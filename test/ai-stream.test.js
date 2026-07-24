const assert = require('assert')
const fs = require('fs')
const path = require('path')

function loadRequestFactory(dependencies) {
	const file = path.resolve(__dirname, '../components/DcloudSearchPage/utils/aiStream.js')
	const source = fs
		.readFileSync(file, 'utf8')
		.replace(/import \{[\s\S]*?\} from '\.\/postDcloudServer';/, 'const { isDocSearchStreamCompleted, isDocSearchStreamMessageDelta, stopDocSearchStream, streamDocSearch } = dependencies;')
		.replace(/^export function /gm, 'function ')

	return new Function('dependencies', `${source}\nreturn { createDocSearchAIRequest, getDocSearchGenerationText };`)(dependencies)
}

function createHarness() {
	let handlers
	let stopCalls = 0
	const factory = loadRequestFactory({
		isDocSearchStreamCompleted(event, data) {
			return event.event === 'conversation.chat.completed' || data.status === 'completed'
		},
		isDocSearchStreamMessageDelta(event) {
			return event.event === 'conversation.message.delta'
		},
		stopDocSearchStream() {
			stopCalls += 1
			return Promise.resolve()
		},
		streamDocSearch(url, payload, nextHandlers) {
			handlers = nextHandlers
			return {
				abort() {
					handlers.onAbort()
				},
			}
		},
	})

	return {
		create: factory.createDocSearchAIRequest,
		getGenerationText: factory.getDocSearchGenerationText,
		handlers() {
			return handlers
		},
		stopCalls() {
			return stopCalls
		},
	}
}

const tests = [
	{
		name: 'uses consistent labels before and after content is displayed',
		run() {
			const getGenerationText = createHarness().getGenerationText
			assert.strictEqual(getGenerationText({ raw: '' }, 'streaming'), '正在思考')
			assert.strictEqual(getGenerationText({ raw: '回答' }, 'streaming'), '正在生成')
			assert.strictEqual(getGenerationText({ raw: '' }, 'stop'), '停止思考')
			assert.strictEqual(getGenerationText({ raw: '回答' }, 'stopped'), '已停止生成')
		},
	},
	{
		name: 'completed flushes typewriter content before the transport closes',
			run() {
			const harness = createHarness()
			const message = { raw: '', streaming: true }
			let completed = 0
			let finished = 0
			let renders = 0
			const request = harness.create({
				message,
				isActive: () => true,
				render() {
					renders += 1
				},
				onCompleted() {
					completed += 1
				},
				onFinish() {
					finished += 1
				},
			})

			request.start({})
			harness.handlers().onEvent({
				event: 'conversation.message.delta',
				data: '{"role":"assistant","type":"answer","content":"回答"}',
			})
			harness.handlers().onEvent({
				event: 'conversation.chat.completed',
				data: '{"status":"completed"}',
			})

			assert.strictEqual(message.raw, '回答')
			assert.strictEqual(message.streaming, false)
			assert.strictEqual(completed, 1)
			assert.strictEqual(finished, 0)
			assert.strictEqual(renders, 1)

			harness.handlers().onComplete()
			assert.strictEqual(finished, 1)
		},
	},
	{
		name: 'metadata after completed is still available and completed requests are not stopped',
		run() {
			const harness = createHarness()
			const message = { raw: '回答', streaming: true }
			let metadata
			const request = harness.create({
				message,
				isActive: () => true,
				onMetadata(nextRequest) {
					metadata = nextRequest
				},
			})

			request.start({})
			harness.handlers().onEvent({
				event: 'conversation.chat.completed',
				data: '{"status":"completed","conversation_id":"c1","chat_id":"chat1"}',
			})
			harness.handlers().onEvent({
				event: 'tbox.meta',
				data: '{"uni_ai_feedback_id":"feedback1","conversation_id":"c1","chat_id":"chat1"}',
			})

			assert.strictEqual(metadata.feedbackId, 'feedback1')
			assert.strictEqual(message.uni_ai_feedback_id, 'feedback1')
			assert.strictEqual(request.stop(), true)
			assert.strictEqual(message.stopped, undefined)
			assert.strictEqual(harness.stopCalls(), 0)
		},
	},
]

let failed = 0
tests.forEach(test => {
	try {
		test.run()
		console.log(`ok - ${test.name}`)
	} catch (error) {
		failed += 1
		console.error(`not ok - ${test.name}`)
		console.error(error.stack)
	}
})

if (failed) {
	process.exitCode = 1
} else {
	console.log(`${tests.length} tests passed`)
}
