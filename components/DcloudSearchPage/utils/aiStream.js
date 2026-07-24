import {
	isDocSearchStreamCompleted,
	isDocSearchStreamMessageDelta,
	stopDocSearchStream,
	streamDocSearch,
} from './postDcloudServer';

const TYPEWRITER_DELAY = 24;
const TYPEWRITER_MAX_CHARS = 12;

function scheduleRender(callback) {
	return typeof requestAnimationFrame === 'function'
		? requestAnimationFrame(callback)
		: setTimeout(callback, 0);
}

function cancelRender(timer) {
	if (typeof cancelAnimationFrame === 'function') {
		cancelAnimationFrame(timer);
	} else {
		clearTimeout(timer);
	}
}

function isDocSearchStreamError(event) {
	return event.event === 'error';
}

function isAssistantAnswer(data) {
	return data.role === 'assistant' && data.type === 'answer' && typeof data.content === 'string' && data.content.length > 0;
}

const generationText = {
	thinking: {
		streaming: '正在思考',
		stopped: '已停止思考',
		stop: '停止思考',
	},
	generating: {
		streaming: '正在生成',
		stopped: '已停止生成',
		stop: '停止生成',
	},
};

export function getDocSearchGenerationText(message, state) {
	const stage = message && message.raw ? 'generating' : 'thinking';
	return generationText[stage][state];
}

// 请求、增量渲染和停止共用同一个状态对象，组件只负责状态归属和视图更新。
export function createDocSearchAIRequest(options) {
	const request = {
		handle: null,
		message: options.message,
		conversationId: options.conversationId || '',
		chatId: '',
		feedbackId: '',
		stopped: false,
		completed: false,
		finished: false,
		pendingText: '',
		typeTimer: 0,
		renderTimer: 0,
	};

	function isActive() {
		return !request.finished && options.isActive(request);
	}

	function render(immediately) {
		function renderNow() {
			if (isActive() && options.render) options.render(request);
		}

		if (immediately) {
			if (request.renderTimer) {
				cancelRender(request.renderTimer);
				request.renderTimer = 0;
			}
			renderNow();
			return;
		}
		if (request.renderTimer) return;
		request.renderTimer = scheduleRender(() => {
			request.renderTimer = 0;
			renderNow();
		});
	}

	function appendText(text) {
		request.message.raw += text;
	}

	function getTypewriterStepLength(text) {
		return Math.min(TYPEWRITER_MAX_CHARS, Math.max(1, Math.ceil(text.length / 24)));
	}

	function flush() {
		if (request.typeTimer) {
			clearTimeout(request.typeTimer);
			request.typeTimer = 0;
		}
		if (!request.pendingText) return;
		appendText(request.pendingText);
		request.pendingText = '';
	}

	function finishDisplay() {
		if (!isActive()) return;
		if (!request.message.streaming) return;
		flush();
		request.message.streaming = false;
		render(true);
	}

	function complete() {
		if (!isActive() || request.completed) return;
		request.completed = true;
		finishDisplay();
		if (options.onCompleted) options.onCompleted(request);
	}

	function finish() {
		if (!isActive()) return;
		finishDisplay();
		request.finished = true;
		if (options.onFinish) options.onFinish(request);
	}

	function runTypewriter() {
		if (!isActive()) return;
		request.typeTimer = 0;
		const length = getTypewriterStepLength(request.pendingText);
		appendText(request.pendingText.slice(0, length));
		request.pendingText = request.pendingText.slice(length);
		render();
		if (request.pendingText) {
			request.typeTimer = setTimeout(runTypewriter, TYPEWRITER_DELAY);
		}
	}

	function enqueue(text) {
		if (!isActive()) return;
		request.pendingText += text;
		if (!request.typeTimer) runTypewriter();
	}

	function updateMetadata(data) {
		let changed = false;
		if (data.uni_ai_feedback_id) {
			if (request.feedbackId !== data.uni_ai_feedback_id) {
				request.feedbackId = data.uni_ai_feedback_id;
				request.message.uni_ai_feedback_id = data.uni_ai_feedback_id;
				changed = true;
			}
		}
		if (data.conversation_id && request.conversationId !== data.conversation_id) {
			request.conversationId = data.conversation_id;
			changed = true;
		}
		if (data.chat_id && request.chatId !== data.chat_id) {
			request.chatId = data.chat_id;
			changed = true;
		}
		if (changed && options.onMetadata) options.onMetadata(request, data);
	}

	function fail(error) {
		if (!isActive() || request.stopped) return;
		if (!request.completed && options.onError) options.onError(request, error);
		finish();
	}

	request.start = function (payload) {
		try {
			request.handle = streamDocSearch(options.streamUrl, payload, {
				onEvent(event) {
					let data;
					try {
						data = JSON.parse(event.data);
					} catch (error) {
						return;
					}
					if (!data || typeof data !== 'object' || !isActive()) return;
					updateMetadata(data);
					if (isDocSearchStreamCompleted(event, data)) {
						complete();
					} else if (!request.completed && isDocSearchStreamMessageDelta(event) && isAssistantAnswer(data)) {
						enqueue(data.content);
					} else if (isDocSearchStreamError(event)) {
						fail(data.errorMsg);
					}
				},
				onComplete: finish,
				onError(error) {
					fail(error.message);
				},
				onAbort: finish,
			});
		} catch (error) {
			fail(error.message);
		}
		return request;
	};

	request.stop = function () {
		if (!isActive() || request.completed) return !!request.message.raw;
		request.stopped = true;
		request.message.stopped = true;
		flush();
		const hasContent = !!request.message.raw;
		if (request.handle) request.handle.abort();
		finish();
		stopDocSearchStream(options.stopUrl, {
			conversation_id: request.conversationId,
			chat_id: request.chatId,
			uni_ai_feedback_id: request.feedbackId,
		}).catch(() => {});
		return hasContent;
	};

	return request;
}
