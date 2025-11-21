// markdown-loader.js
let markedInstance = null;
let hljsInstance = null;

function getLangCodeFromExtension (extension) {
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
  }

  return extensionMap[extension] || extension
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
		hljsInstance = hljs;
	}

	return markedInstance.parse(md || '');
}
