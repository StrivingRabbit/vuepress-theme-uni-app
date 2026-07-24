const assert = require('assert')
const fs = require('fs')
const path = require('path')

function loadSSEParser() {
	const file = path.resolve(__dirname, '../components/DcloudSearchPage/utils/postDcloudServer.js')
	const source = fs
		.readFileSync(file, 'utf8')
		.replace("import mock from './mock';", 'const mock = {};')
		.replace(/^export async function /gm, 'async function ')
		.replace(/^export function /gm, 'function ')

	return new Function(`${source}\nreturn { createSSEParser };`)()
}

function parse(chunks, finish) {
	const events = []
	const parser = loadSSEParser().createSSEParser(event => events.push(event))
	chunks.forEach(chunk => parser.push(chunk))
	if (finish) parser.finish()
	return events
}

const tests = [
	{
		name: 'parses an event split at arbitrary positions',
		run() {
			const events = parse([
				'event: conversation.mess',
				'age.delta\r\ndata: {"role":"assistant","type":"answer","content":"你好"}\r',
				'\n\r\n',
			])

			assert.deepStrictEqual(events, [{
				event: 'conversation.message.delta',
				data: '{"role":"assistant","type":"answer","content":"你好"}',
			}])
		},
	},
	{
		name: 'joins multiline data and preserves the following event',
		run() {
			const events = parse([
				'event: tbox.meta\n',
				'data: {"errorCode":0,\ndata: "conversation_id":"c1"}\n\n',
				'event: done\ndata: [DONE]\n\n',
			])

			assert.deepStrictEqual(events, [
				{ event: 'tbox.meta', data: '{"errorCode":0,\n"conversation_id":"c1"}' },
				{ event: 'done', data: '[DONE]' },
			])
		},
	},
	{
		name: 'keeps the full completion sequence when completed has no separator',
		run() {
			const events = parse([
				'event: tbox.init\ndata: {"errorCode":0}\n\n',
				'event: conversation.message.delta\ndata: {"content":"A"}\n\n',
				'event: conversation.chat.completed\ndata: {"status":"completed"}',
				'\nevent: done\ndata: [DONE]\n\nevent: tbox.meta\ndata: {"conversation_id":"c1"}\n\n',
			])

			assert.deepStrictEqual(events, [
				{ event: 'tbox.init', data: '{"errorCode":0}' },
				{ event: 'conversation.message.delta', data: '{"content":"A"}' },
				{ event: 'conversation.chat.completed', data: '{"status":"completed"}' },
				{ event: 'done', data: '[DONE]' },
				{ event: 'tbox.meta', data: '{"conversation_id":"c1"}' },
			])
		},
	},
	{
		name: 'flushes the final unterminated error event',
		run() {
			const events = parse([
				'event: error\ndata: {"errorCode":1,"errorMsg":"failed"}',
			], true)

			assert.deepStrictEqual(events, [{
				event: 'error',
				data: '{"errorCode":1,"errorMsg":"failed"}',
			}])
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
