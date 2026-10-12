const assert = require('assert')
const fs = require('fs')
const path = require('path')

async function run() {
	const root = path.resolve(__dirname, '../components/DcloudSearchPage')
	const component = fs.readFileSync(path.join(root, 'index.vue'), 'utf8')
	const client = fs.readFileSync(path.join(root, 'utils/searchClient.js'), 'utf8')
	const selectMethod = client.slice(client.indexOf('onSelect({'), client.indexOf('getItemUrl({'))
	let closed = 0
	const source = new Function('onClose', `return { ${selectMethod} };`)(() => closed++)
	const item = { objectID: 'current-page', url: '/current.html' }
	source.getItems = () => [item]
	const searchMethod = component.slice(component.indexOf('\t\tsearch() {'), component.indexOf('\t\tsearchByAlgolia() {'))
	const methods = new Function('aa', 'removeHighlightTags', `return { ${searchMethod} };`)(
		() => { throw new Error('analytics unavailable') },
		() => 'Current page'
	)
	const context = {
		searchPage: 1,
		currentCategory: { type: 'algolia', text: 'uni-app' },
		createSearchRequest: () => 1,
		isCurrentSearch: () => true,
		finishSearchRequest() {},
		$nextTick: callback => callback(),
		$refs: {},
		searchByAlgolia: () => Promise.resolve({
			hits: [source], hitsPerPage: 20, nbHits: 1, nbPages: 1, page: 0,
			queryID: 'query', indexName: 'docs'
		})
	}
	methods.search.call(context)
	await new Promise(resolve => setImmediate(resolve))
	assert.strictEqual(context.resultList.length, 1)
	const select = context.resultList[0].onSelect
	assert.doesNotThrow(() => select({ item, event: {} }))
	assert.strictEqual(closed, 1)
	for (const key of ['ctrlKey', 'metaKey', 'shiftKey']) {
		assert.doesNotThrow(() => select({ item, event: { [key]: true } }))
	}
	assert.strictEqual(closed, 1)
	const watcherSource = component.slice(component.indexOf('\t\tresultList() {'), component.indexOf('\t\tcategoryIndex('))
	const watcher = new Function(`return { ${watcherSource} };`)().resultList
	assert.doesNotThrow(() => watcher.call({ $refs: {} }))
	const pageContainer = { scrollTop: 10 }
	watcher.call({ $refs: { pageContainer } })
	assert.strictEqual(pageContainer.scrollTop, 0)
	console.log('ok - search selection closes without navigation and tolerates analytics errors')
}

run().catch(error => {
	console.error(error)
	process.exitCode = 1
})
