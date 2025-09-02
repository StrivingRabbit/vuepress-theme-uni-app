function getFormattedDate() {
	const now = new Date();

	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	const hours = now.getHours().toString().padStart(2, '0');
	const minutes = now.getMinutes().toString().padStart(2, '0');
	const seconds = now.getSeconds().toString().padStart(2, '0');

	const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

	return formattedDate;
}

const nowString = getFormattedDate();
const changeLoaderOptions = (options, key = 'name') => {
	if (options && options[key]) options[key] = `${nowString}/${options[key]}`;
	return options;
};

module.exports = (themeConfig, ctx, pluginAPI) => {
	pluginAPI.options.chainWebpack.add('assets-chunk-timestamp', (config, isServer) => {
		config.output.filename(`${nowString}/${config.output.get('filename')}`); //输出文件名
		config.module.rule('images').use('url-loader').tap(changeLoaderOptions);
		config.module.rule('fonts').use('url-loader').tap(changeLoaderOptions);
		config.module.rule('media').use('url-loader').tap(changeLoaderOptions);
		config.module.rule('svg').use('file-loader').tap(changeLoaderOptions);
		if (!isServer && process.env.NODE_ENV !== 'development') {
			const extract_css_plugin = config.plugin('extract-css');
			const extract_css_plugin_args = extract_css_plugin.get('args');
			if (extract_css_plugin_args) {
				extract_css_plugin.set(
					'args',
					extract_css_plugin_args.map(item =>
						changeLoaderOptions(item, 'filename')
					)
				);
			}
		}
	})

	pluginAPI.options.extendMarkdown.add('vuepress-theme-uni-app-md-plugins', (md) => {
		md.core.ruler.disable('emoji', true)
		md.use(require('markdown-it-attrs'), {
			leftDelimiter: '#{',
			rightDelimiter: '}',
		});
		md.use(require('markdown-it-task-lists'));
		md.use(require('markdown-it-raw-table'));
	})

	const originalShouldPrefetch = ctx.siteConfig.shouldPrefetch || function () { return false }
	/**
	 *
	 * @param {string} path path: js 资源文件路径
	 * @param {string} type type: 资源文件类型，取值有 script 等
	 * @returns {boolean}
	 */
	ctx.siteConfig.shouldPrefetch = function (path, type) {
		let themeShouldPrefetch = true
		if (type === 'script') themeShouldPrefetch = path.includes('vendors~') || path.includes('layout-') || path.includes('index.')
		else { themeShouldPrefetch = false }
		return originalShouldPrefetch.call(this, path, type) || themeShouldPrefetch
	}
	ctx.siteConfig.patterns = ctx.siteConfig.patterns || ['**/!(_sidebar).md', '**/*.vue']

	const klass = 'info'
	const config = {
		extend: '@vuepress/theme-default',
		plugins: [
			'@vuepress/back-to-top',
			'mermaidjs',
			['container', {
				type: 'preview',
				validate: (params) => {
					// return params.trim().match(/^preview\s+(.*)$/);
					return params.trim().match(/^preview/);
				},

				render: (tokens, idx, opts, event) => {
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
			['container', {
				type: 'sourceCode',
				validate: (params) => {
					return params.trim().match(/^sourceCode/);
				},

				render: (tokens, idx, opts, event) => {
					var m = tokens[idx].info.trim().match(/^sourceCode\s+(.*)$/);
					if (tokens[idx].nesting === 1) {
						// opening tag
						return `<SourceCode>`;
					} else {
						// closing tag
						return `</SourceCode>`;
					}
				}
			}],
			['container', {
				type: klass,
				render(tokens, idx, opts, env) {
					const token = tokens[idx]
					const info = token.info.trim().slice(klass.length).trim()
					if (token.nesting === 1) {
						return `<div class="custom-block ${klass}"><p class="custom-block-title">${info || 'INFO'}</p>\n`
					} else return `</div>\n`
				}
			}],
			['zooming', {
				selector: '.theme-default-content img.zooming',
				options: {
					scaleBase: 0.9,
					bgColor: 'rgba(0,0,0,0.6)'
				}
			}],
			['named-chunks', {
				layoutChunkName: (layout) => 'layout-' + layout.componentName,
				pageChunkName: page => {
					const _context = page._context
					const pageHeaders = (page.headers || []).map(item => item.title).join(',')
					if (pageHeaders) {
						const originDescription = page.frontmatter.description || ''
						page.frontmatter = {
							...page.frontmatter,
							description: `${_context.siteConfig.description ? `${_context.siteConfig.description},` : ''}${pageHeaders}${originDescription ? `,${originDescription}` : ''}`.slice(0, 150),
						}
					}
					const pagePath = page.path.indexOf('.html') === -1 ? page.path + 'index' : page.path
					const curPath = 'docs/' + pagePath.replace('docs/', '').substring(1).replace(/\.html/g, "")
					return curPath
				}
			}],
			['check-md2', {
				filter({ errMsg, fileUrl, fullText, matchUrl, col, line }) {
					/**
					 * errMsg："Should use .md instead of .html"、"File is not found"、"Hash should slugify"、"Hash is not found"
					 */
					const hashNotFound = errMsg === 'Hash is not found' && matchUrl.startsWith('#')
					const replaceHtmlExtToMd = errMsg === "Should use .md instead of .html"
					const fileNotFound = errMsg === "File is not found" && !matchUrl.startsWith('<!--')
					const hashShouldSlugify = errMsg === "Hash should slugify"
					return hashNotFound || replaceHtmlExtToMd || fileNotFound || hashShouldSlugify
				}
			}],
			'expandable-row'
		]
	}

	if (Array.isArray(themeConfig.plugins) && themeConfig.plugins.length) {
		const vuepressPluginPrefix = 'vuepress-plugin-'
		const configPluginNames = config.plugins.map(item => typeof item === 'string' ? item : item[0])

		themeConfig.plugins.forEach(item => {
			const pluginName = typeof item === 'string' ? item : item[0]
			let configPluginIndex = configPluginNames.indexOf(pluginName)
			if (configPluginIndex === -1 && pluginName.indexOf(vuepressPluginPrefix) === 0) {
				// vuepress-plugin-${pluginName} -> ${pluginName}
				configPluginIndex = configPluginNames.indexOf(pluginName.replace(vuepressPluginPrefix, ''))
			} else if (configPluginIndex === -1) {
				// ${pluginName} -> vuepress-plugin-${pluginName}
				configPluginIndex = configPluginNames.indexOf(vuepressPluginPrefix + pluginName)
			}
			if (configPluginIndex !== -1 && Array.isArray(item)) {
				const configPlugin = config.plugins[configPluginIndex]
				if (Array.isArray(configPlugin) && typeof item[1] !== 'undefined') {
					if (item[1] === false) configPlugin[1] = false
					else { configPlugin[1] = Object.assign({}, configPlugin[1], item[1]) }
				} else {
					config.plugins[configPluginIndex] = item
				}
			}
		})
	}

	return config
}
