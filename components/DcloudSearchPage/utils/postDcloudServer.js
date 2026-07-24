const isProduction = process.env.NODE_ENV === 'production';
const isMock = false;
import mock from './mock';

const activeXhrs = [];

const classificationMap = {
	'uni-app': 'uniapp',
	'uni-app x': 'uni-app x',
	uniCloud: 'unicloud',
	HBuilderX: 'HBuilderX',
	'uni-ad 广告': 'uni-ad广告',
	'uni-agent': 'uni-agent',
	其他: '其他',
};

function removeActiveXhr(xhr) {
	const index = activeXhrs.indexOf(xhr);
	if (index !== -1) activeXhrs.splice(index, 1);
}

export function abortAjaxRequests() {
	activeXhrs.slice().forEach(xhr => xhr.abort());
}

export function normalizeAIClassification(category) {
	return classificationMap[category] || '其他';
}

export function isDocSearchStreamCompleted(event, data) {
	return event.event === 'conversation.chat.completed' || data.status === 'completed';
}

export function isDocSearchStreamMessageDelta(event) {
	return event.event === 'conversation.message.delta';
}

export function createSSEParser(onEvent) {
	// XHR progress 可能在任意位置截断一个 SSE 事件，保留未完成部分等待下一批数据。
	let buffer = '';

	function parseEvent(block) {
		const lines = block.split('\n');
		let event = 'message';
		const data = [];

		lines.forEach(line => {
			if (line.indexOf('event:') === 0) {
				event = line.replace(/^event:\s?/, '');
			} else if (line.indexOf('data:') === 0) {
				data.push(line.replace(/^data:\s?/, ''));
			}
		});

		if (!data.length) return null;
		return { event, data: data.join('\n') };
	}

	function dispatchEvent(block) {
		const event = parseEvent(block);
		if (event) onEvent(event);
	}

	function flushEventsWithoutSeparator() {
		// 服务端偶尔省略空行而直接开始下一个 event；event 行本身仍是可靠边界。
		while (true) {
			const eventStart = buffer.search(/(?:^|\n)event:[ \t]*[^\n]*/);
			if (eventStart === -1) return;
			const eventLineEnd = buffer.indexOf('\n', eventStart);
			if (eventLineEnd === -1) return;
			const nextEventStart = buffer.slice(eventLineEnd + 1).search(/\n(?=(?:(?:id|retry):[^\n]*\n)*event:[ \t]*[^\n]*)/);
			if (nextEventStart === -1) return;
			const blockEnd = eventLineEnd + 1 + nextEventStart;
			dispatchEvent(buffer.slice(0, blockEnd));
			buffer = buffer.slice(blockEnd + 1);
		}
	}

	function flushCompletedEvent() {
		// completed 的 JSON 已完整时必须立即结束思考，不能等待后续 done 或连接关闭。
		const match = buffer.match(/^(?:(?:id|retry):[^\n]*\n)*event:[ \t]*conversation\.chat\.completed[ \t]*\n((?:data:[^\n]*(?:\n|$))+)/);
		if (!match || buffer.charAt(match[0].length) === '\n') return;
		const event = parseEvent(match[0]);
		if (!event) return;
		try {
			if (!isDocSearchStreamCompleted(event, JSON.parse(event.data))) return;
		} catch (error) {
			return;
		}
		onEvent(event);
		buffer = buffer.slice(match[0].length);
	}

	function flush(completed) {
		if (!completed) {
			flushCompletedEvent();
			flushEventsWithoutSeparator();
			flushCompletedEvent();
		}
		let separatorIndex = buffer.indexOf('\n\n');
		while (separatorIndex !== -1) {
			dispatchEvent(buffer.slice(0, separatorIndex));
			buffer = buffer.slice(separatorIndex + 2);
			separatorIndex = buffer.indexOf('\n\n');
		}
		if (completed && buffer.trim()) {
			dispatchEvent(buffer);
			buffer = '';
		}
	}

	return {
		push(chunk) {
			buffer += String(chunk || '');
			buffer = buffer.replace(/\r\n/g, '\n');
			flush(false);
		},
		finish() {
			flush(true);
		}
	};
}

export function streamDocSearch(url, data, handlers = {}) {
	const xhr = new XMLHttpRequest();
	let receivedLength = 0;
	let finished = false;
	let aborted = false;
	const parser = createSSEParser(event => {
		if (!finished && handlers.onEvent) handlers.onEvent(event);
	});

	function cleanup() {
		removeActiveXhr(xhr);
	}

	function fail(error) {
		if (finished) return;
		finished = true;
		cleanup();
		if (handlers.onError) handlers.onError(error);
	}

	function consumeResponse() {
		const chunk = xhr.responseText.slice(receivedLength);
		receivedLength = xhr.responseText.length;
		if (chunk) parser.push(chunk);
	}

	xhr.open('POST', url);
	xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
	xhr.setRequestHeader('Accept', 'text/event-stream');
	xhr.onprogress = () => {
		try {
			consumeResponse();
		} catch (error) {
			fail(error);
			xhr.abort();
		}
	};
	xhr.onreadystatechange = () => {
		if (xhr.readyState !== 4 || finished) return;
		if (aborted || xhr.status === 0) return;
		if (xhr.status < 200 || xhr.status >= 300) {
			fail(new Error(`Request failed with status ${xhr.status}`));
			return;
		}
		try {
			consumeResponse();
			parser.finish();
			finished = true;
			cleanup();
			if (handlers.onComplete) handlers.onComplete();
		} catch (error) {
			fail(error);
		}
	};
	xhr.onerror = () => fail(new Error('Network request failed'));
	xhr.onabort = () => {
		if (finished) return;
		finished = true;
		cleanup();
		if (handlers.onAbort) handlers.onAbort();
	};
	activeXhrs.push(xhr);
	try {
		xhr.send(JSON.stringify(data));
	} catch (error) {
		fail(error);
	}

	return {
		abort() {
			if (finished) return;
			aborted = true;
			xhr.abort();
		}
	};
}

export function stopDocSearchStream(url, data) {
	if (!data.conversation_id || !data.chat_id) return Promise.resolve();
	// 停止指令必须在弹窗关闭后的全局取消中继续发送到服务端。
	return ajax(url, 'POST', data, false);
}

export function ajax(url = '', method = 'get', data = {}, track = true) {
	if (!url) return Promise.reject('url 不可为空');
	const xhr = new XMLHttpRequest();
	const p = new Promise((resolve, reject) => {
		xhr.open(method, url);
		xhr.onreadystatechange = function () {
			if (this.readyState == 4) {
				removeActiveXhr(xhr);
				if (this.status < 200 || this.status >= 300) {
					reject(new Error(`Request failed with status ${this.status}`));
					return;
				}
				try {
					resolve(JSON.parse(this.response));
				} catch (error) {
					resolve(this.response);
				}
			}
		};
		xhr.onerror = () => {
			removeActiveXhr(xhr);
			reject(new Error('Network request failed'));
		};
		xhr.onabort = () => {
			removeActiveXhr(xhr);
			reject(new Error('Request cancelled'));
		};
		if (track) activeXhrs.push(xhr);
		if (method.toLowerCase() === 'post') {
			xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			xhr.send(JSON.stringify(data));
		} else {
			xhr.send();
		}
	});
	p.abort = () => xhr.abort();
	return p;
}

export async function postExt(query) {
	const base = isProduction ? '//ext.dcloud.net.cn' : '/ext';
	let extRet;
	if (!isMock) {
		const extRes = await ajax(base + '/search/json?query=' + encodeURIComponent(query));
		extRet = JSON.parse(extRes);
	} else {
		extRet = mock.ext;
	}

	let extHtml = '';
	let data = extRet.data;
	if (extRet.ret === 0) {
		for (let i = 0, len = data.length; i < len; i++) {
			extHtml += _renderExt(data[i], query);
		}
	}
	return {
		html: extHtml,
		hits: data.length,
	};
}

export async function postAsk(query, page = 1) {
	const base = isProduction ? '//ask.dcloud.net.cn' : '/ask';
	let askHtml = '';

	if (!isMock) {
		askHtml = await ajax(base + `/search/ajax/search_result/search_type-all__q-${query}__page-${page}`);
		if (!askHtml) {
			return;
		}
	} else {
		askHtml = mock.askHtml;
	}

	return {
		html: askHtml,
		hits: 0,
	};
}

function _renderExt(ext, keyword) {
	return `<div class="matching-post">
    <a href="${ext.url}" target="_blank">
      <div class="post-wrapper">
        <h2>
          <p class="aw-text">
            <span class="post-tag">插件</span>
          </p>
          ${_handleHTMLString(ext.name, keyword)}
        </h2>
      </div>
      <p>${ext.total_download}次下载</p>
      <p>${_handleHTMLString(ext.description, keyword)}</p>
    </a>
  </div>`;
}

function _renderPost(post, value) {
	let html = '';
	let commentText = '';
	let tagName = '规范';

	// 1，问题；2，文章；默认是规范。
	switch (post.type) {
		case 'questions':
			tagName = '问题';
			break;
		case 'articles':
			tagName = '文章';
			break;
	}

	if (!!value) {
		post.title = _handleHTMLString(post.title, value);
		post.content = _handleHTMLString(post.content, value);
	}

	html += `<div class="matching-post">
    <a href="${post.url}" target="_blank">
    <div class="post-wrapper">
      <h2>
        <p class="aw-text">
          <span class="post-tag">${tagName}</span>
        </p>
        ${post.title}
      </h2>
  </div>`;

	if (!!value) {
		commentText = post.type === 'questions' ? '回复' : '评论';
		html += `<p>
      ${post.comment_count}个${commentText}
      <span class="aw-text-space">-</span>
      ${post.view_count}次浏览
    </p>`;
	}

	html += `\n<p>${post.content}</p>\n</a>\n</div>`;

	return html;
}

function _handleHTMLString(dataString, keyword) {
	let keywordReg = new RegExp(keyword.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), 'gi');
	let tagStartReg = new RegExp("&lt;span style='font-weight:bold;color:red'&gt;", 'g');
	let tagEndReg = new RegExp('&lt;/span&gt;', 'g');

	return dataString
		.replace(tagStartReg, '')
		.replace(tagEndReg, '')
		.replace(keywordReg, '<em class="search-keyword">' + keyword + '</em>');
}
