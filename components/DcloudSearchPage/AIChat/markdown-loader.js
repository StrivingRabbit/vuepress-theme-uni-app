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

export async function renderMarkdown(md) {
	if (!markedInstance) {
		const [marked, hljs] = await Promise.all([import('marked'), import('highlight.js')]);

		marked.setOptions({
			headerIds: false,
			mangle: false,
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
