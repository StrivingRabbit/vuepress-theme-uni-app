import marked from 'marked'
import hljs from 'highlight.js'

// markdown-loader.js
let markedInstance = null;

// 防止 ``` 和上一行之前没有空行 marked 解析失败
function escapeMD(str) {
	return str
		.replace(/\n(```)/g, '\n\n$1')
}

function getLangCodeFromExtension(extension) {
	const extensionMap = {
		vue: 'markup',
		html: 'markup',
		md: 'markdown',
		rb: 'ruby',
		ts: 'typescript',
		py: 'python',
		sh: 'bash',
		yml: 'yaml',
		styl: 'stylus',
		kt: 'kotlin',
		rs: 'rust',
		uts: 'typescript',
		json5: 'json',
	};

	return extensionMap[extension] || extension;
}

export function renderMarkdown(md) {
	if (!markedInstance) {
		// 创建自定义 renderer 来转义 HTML
		const renderer = new marked.Renderer();

		// 重写 html 方法，转义所有 HTML 标签
		renderer.html = function(html) {
			// 将 HTML 标签转义为文本
			return html
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		};

		marked.setOptions({
			headerIds: false,
			mangle: false,
			renderer: renderer,
			breaks: true,
			gfm: true, // 启用 GitHub Flavored Markdown
			highlight(code, lang) {
				lang = getLangCodeFromExtension(lang);
				if (lang && hljs.getLanguage(lang)) {
					return hljs.highlight(code, { language: lang }).value;
				}
				return hljs.highlightAuto(code).value;
			},
		});

		markedInstance = marked;
	}
	return markedInstance.parse(escapeMD(md || ''));
}
