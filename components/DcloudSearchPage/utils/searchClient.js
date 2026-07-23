import algoliasearch from 'algoliasearch';
import aa from 'search-insights';
import { removeHighlightTags, groupBy } from './searchUtils';

/**
 * @typedef {import('algoliasearch').SearchClient} SearchClient
 */

let searchIndex;
const activeRequests = [];

function createCancelableRequester() {
	return {
		send(request) {
			let xhr;
			let completed = false;
			let resolveRequest;
			let timeoutId;
			const finish = response => {
				if (completed) return;
				completed = true;
				window.clearTimeout(timeoutId);
				const index = activeRequests.indexOf(cancel);
				if (index !== -1) activeRequests.splice(index, 1);
				resolveRequest(response);
			};
			const cancel = () => {
				if (xhr) xhr.abort();
				finish({ status: 400, content: 'Request cancelled', isTimedOut: false });
			};

			const promise = new Promise(resolve => {
				resolveRequest = resolve;
				xhr = new XMLHttpRequest();
				xhr.open(request.method, request.url, true);
				Object.keys(request.headers).forEach(key => xhr.setRequestHeader(key, request.headers[key]));
				xhr.onerror = () => finish({ status: xhr.status, content: xhr.responseText || 'Network request failed', isTimedOut: false });
				xhr.onload = () => finish({ status: xhr.status, content: xhr.responseText, isTimedOut: false });
				xhr.send(request.data);
				timeoutId = window.setTimeout(() => {
					xhr.abort();
					finish({ status: 0, content: 'Request timeout', isTimedOut: true });
				}, request.responseTimeout * 1000);
			});
			activeRequests.push(cancel);
			return promise;
		}
	};
}

export function abortSearchRequests() {
	activeRequests.slice().forEach(cancel => cancel());
}

/**
 *
 * @param {string} appId
 * @param {string} apiKey
 * @returns {ReturnType<SearchClient['initIndex']>}
 */
function getSearchIndex(appId, apiKey, indexName) {
	if (searchIndex) return searchIndex;
	const searchClient = algoliasearch(appId, apiKey, { requester: createCancelableRequester() });
	searchIndex = searchClient.initIndex(indexName);
	aa('init', { appId, apiKey });
	searchClient.addAlgoliaAgent('dcloudsearch', '1.0.0');

	return searchIndex;
}

export function search({
	query,
	indexName,
	appId,
	apiKey,
	searchParameters = {},
	snippetLength = 0,
	transformItems = () => {},
	onClose = () => {},
	...args
}) {
	return getSearchIndex(appId, apiKey, indexName)
		.search(query, {
			attributesToRetrieve: [
				'hierarchy.lvl0',
				'hierarchy.lvl1',
				'hierarchy.lvl2',
				'hierarchy.lvl3',
				'hierarchy.lvl4',
				'hierarchy.lvl5',
				'hierarchy.lvl6',
				'content',
				'type',
				'url',
				'url_without_anchor',
				'category',
				'tag',
			],
			attributesToSnippet: [
				`hierarchy.lvl1:${snippetLength}`,
				`hierarchy.lvl2:${snippetLength}`,
				`hierarchy.lvl3:${snippetLength}`,
				`hierarchy.lvl4:${snippetLength}`,
				`hierarchy.lvl5:${snippetLength}`,
				`hierarchy.lvl6:${snippetLength}`,
				`content:${snippetLength}`,
			],
			snippetEllipsisText: '…',
			highlightPreTag: '<mark>',
			highlightPostTag: '</mark>',
			hitsPerPage: 20,
			clickAnalytics: true,
			...searchParameters,
			...args,
		})
		.catch(error => {
			throw error;
		})
		.then(({ hits, hitsPerPage, nbHits, nbPages, page, queryID }) => {
			const sources = groupBy(hits, hit => removeHighlightTags(hit));
			return {
				hitsPerPage,
				nbHits,
				nbPages,
				page,
				hits: Object.values(sources).map((items, index) => {
					return {
						sourceId: `hits${index}`,
						onSelect({ item, event }) {
							// saveRecentSearch(item);

							if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
								onClose();
							}
						},
						getItemUrl({ item }) {
							return item.url;
						},
						getItems() {
							return Object.values(groupBy(items, item => item.hierarchy.lvl1))
								.map(transformItems)
								.map(groupedHits =>
									groupedHits.map(item => {
										return {
											...item,
											__docsearch_parent:
												item.type !== 'lvl1' &&
												groupedHits.find(
													siblingItem =>
														siblingItem.type === 'lvl1' && siblingItem.hierarchy.lvl1 === item.hierarchy.lvl1
												),
										};
									})
								)
								.flat();
						},
					};
				}),
				queryID,
				indexName,
			};
		});
}
