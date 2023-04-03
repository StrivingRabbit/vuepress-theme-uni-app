module.exports = themeConfig => {
	const config = {
		extend: '@vuepress/theme-default',
		plugins: [
			['container', {
				type: 'preview',
				validate: (params) => {
					// return params.trim().match(/^preview\s+(.*)$/);
					return params.trim().match(/^preview/);
				},

				render: (tokens, idx, otps, event) => {
					var m = tokens[idx].info.trim().match(/^preview\s+(.*)$/);
					if (tokens[idx].nesting === 1) {
						// opening tag
						return `<CodeSimulator class="code" src="${m && m.length > 0 ? m[1] : ''}">`;
					} else {
						// closing tag
						return `</CodeSimulator>`;
					}
				}
			}],
			'@vuepress/back-to-top',
			'vuepress-plugin-mermaidjs',
			['vuepress-plugin-zooming', {
				selector: '.theme-default-content img.zooming',
				options: {
					scaleBase: 0.8
				}
			}]
		]
	}

	return config
}
