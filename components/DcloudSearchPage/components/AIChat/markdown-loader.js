// markdown-loader.js
let markedInstance = null;
let hljsInstance = null;

function transfromLang(lang) {
	switch (lang) {
		case 'uts':
			return 'typescript';
		case 'json5':
			return 'json';
	}
	if (!hljsInstance) return 'plaintext';
	return hljsInstance.getLanguage(lang) ? lang : 'plaintext';
}

export async function renderMarkdown(md) {
	if (!markedInstance) {
		const [{ Marked }, { markedHighlight }, hljs] = await Promise.all([
			import('marked'),
			import('marked-highlight'),
			import('highlight.js'),
		]);

		const marked = new Marked(
			markedHighlight({
				emptyLangClass: 'hljs',
				langPrefix: 'hljs language-',
				highlight(code, lang, info) {
					const language = transfromLang(lang);
					return hljs.highlight(code, { language }).value;
				},
			})
		);

		marked.setOptions({
			headerIds: false,
			mangle: false,
		});

		markedInstance = marked;
		hljsInstance = hljs;
	}

	return markedInstance.parse(md || '');
}
