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
		const [marked, hljs] = await Promise.all([import('marked'), import('highlight.js')]);

		marked.setOptions({
			headerIds: false,
			mangle: false,
			highlight(code, lang) {
				lang = transfromLang(lang);
				if (lang && hljs.getLanguage(lang)) {
					return hljs.highlight(code, { language: lang }).value;
				}
				return hljs.highlightAuto(code).value;
			},
		});

		markedInstance = marked;
		hljsInstance = hljs;
	}

	return markedInstance.parse(md || '');
}
