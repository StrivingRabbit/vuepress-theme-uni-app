<template>
	<div v-if="openSearch" id="search-container" ref="pageContainer">
		<div class="search-navbar">
			<div class="search-navbar-header navbar">
				<div class="main-navbar">
					<NavbarLogo />
					<div class="main-navbar-links can-hide">
						<div class="main-navbar-item active"></div>
					</div>
				</div>
				<div class="sub-navbar">
					<div class="search-wrap">
						<div class="input-wrap">
							<input
								ref="searchInput"
								class="search-input"
								:placeholder="placeholder"
								type="text"
								@keydown.enter="
									() => {
										resetSearchPage();
										search();
									}
								"
								v-model="searchValue"
							/>
							<span class="search-input-btn">
								<button
									@click="
										() => {
											resetSearchPage();
											search();
										}
									"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M11.33 10.007l4.273 4.273a.502.502 0 0 1 .005.709l-.585.584a.499.499 0 0 1-.709-.004L10.046 11.3a6.278 6.278 0 1 1 1.284-1.294zm.012-3.729a5.063 5.063 0 1 0-10.127 0 5.063 5.063 0 0 0 10.127 0z"
										></path>
									</svg>
								</button>
							</span>
							<a href="javascript:;" class="search-back__btn" @click="onSearchClose">
								{{ buttonText }}
							</a>
						</div>

						<div class="search-category">
							<div class="navbar">
								<div class="main-navbar">
									<div class="main-navbar-links">
										<template v-for="(item, index) in category">
											<div :class="mainNavLinkClass(index)" :key="item.text">
												<MainNavbarLink
													v-if="item.link"
													:key="item.text"
													:item="{
														...item,
														link: createLink(item),
													}"
												/>
												<a v-else href="javascript:;" @click="switchCategory(index)">
													{{ item.text }}
												</a>
											</div>
										</template>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="result-number">
			<span v-if="showLoading" class="uni-loading"></span>
			<span v-else>{{ resultText }}</span>
		</div>

		<div class="search-result">
			<div class="result-wrap">
				<template v-if="isAlgolia">
					<template v-for="item in resultList">
						<Results
							:key="item.sourceId"
							:title="item.title"
							:results="item.items"
							:onSelect="item.onSelect"
						/>
					</template>
				</template>

				<template v-else>
					<div
						class="markdown-section search-result-list"
						v-if="serverHtml"
						v-html="serverHtml"
					></div>
				</template>
			</div>

			<div v-if="isAlgolia" class="algolia-logo">
				<div class="DocSearch-Logo">
					<a
						href="https://www.algolia.com/ref/docsearch/?utm_source=uniapp.dcloud.io&amp;utm_medium=referral&amp;utm_content=powered_by&amp;utm_campaign=docsearch"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span class="DocSearch-Label">{{ searchBy }}</span>
						<svg width="77" height="19" aria-label="Algolia" role="img">
							<path
								d="M2.5067 0h14.0245c1.384.001 2.5058 1.1205 2.5068 2.5017V16.5c-.0014 1.3808-1.1232 2.4995-2.5068 2.5H2.5067C1.1232 18.9995.0014 17.8808 0 16.5V2.4958A2.495 2.495 0 01.735.7294 2.505 2.505 0 012.5068 0zM37.95 15.0695c-3.7068.0168-3.7068-2.986-3.7068-3.4634L34.2372.3576 36.498 0v11.1794c0 .2715 0 1.9889 1.452 1.994v1.8961zm-9.1666-1.8388c.694 0 1.2086-.0397 1.5678-.1088v-2.2934a5.3639 5.3639 0 00-1.3303-.1679 4.8283 4.8283 0 00-.758.0582 2.2845 2.2845 0 00-.688.2024c-.2029.0979-.371.2362-.4919.4142-.1268.1788-.185.2826-.185.5533 0 .5297.185.8359.5205 1.0375.3355.2016.7928.3053 1.365.3053v-.0008zm-.1969-8.1817c.7463 0 1.3768.092 1.8856.2767.5088.1838.9195.4428 1.2204.7717.3068.334.5147.7777.6423 1.251.1327.4723.196.991.196 1.5603v5.798c-.5235.1036-1.05.192-1.5787.2649-.7048.1037-1.4976.156-2.3774.156-.5832 0-1.1215-.0582-1.6016-.167a3.385 3.385 0 01-1.2432-.5364 2.6034 2.6034 0 01-.8037-.9565c-.191-.3922-.29-.9447-.29-1.5208 0-.5533.11-.905.3246-1.2863a2.7351 2.7351 0 01.8849-.9329c.376-.242.8029-.415 1.2948-.5187a7.4517 7.4517 0 011.5381-.156 7.1162 7.1162 0 011.6667.2024V8.886c0-.259-.0296-.5061-.093-.7372a1.5847 1.5847 0 00-.3245-.6158 1.5079 1.5079 0 00-.6119-.4158 2.6788 2.6788 0 00-.966-.173c-.5206 0-.9948.0634-1.4283.1384a6.5481 6.5481 0 00-1.065.259l-.2712-1.849c.2831-.0986.7048-.1964 1.2491-.2943a9.2979 9.2979 0 011.752-.1501v.0008zm44.6597 8.1193c.6947 0 1.2086-.0405 1.567-.1097v-2.2942a5.3743 5.3743 0 00-1.3303-.1679c-.2485 0-.503.0177-.7573.0582a2.2853 2.2853 0 00-.688.2024 1.2333 1.2333 0 00-.4918.4142c-.1268.1788-.1843.2826-.1843.5533 0 .5297.1843.8359.5198 1.0375.3414.2066.7927.3053 1.365.3053v.0009zm-.191-8.1767c.7463 0 1.3768.0912 1.8856.2759.5087.1847.9195.4436 1.2204.7717.3.329.5147.7786.6414 1.251a5.7248 5.7248 0 01.197 1.562v5.7972c-.3466.0742-.874.1602-1.5788.2648-.7049.1038-1.4976.1552-2.3774.1552-.5832 0-1.1215-.0573-1.6016-.167a3.385 3.385 0 01-1.2432-.5356 2.6034 2.6034 0 01-.8038-.9565c-.191-.3922-.2898-.9447-.2898-1.5216 0-.5533.1098-.905.3245-1.2854a2.7373 2.7373 0 01.8849-.9338c.376-.2412.8029-.4141 1.2947-.5178a7.4545 7.4545 0 012.325-.1097c.2781.0287.5672.081.879.156v-.3686a2.7781 2.7781 0 00-.092-.738 1.5788 1.5788 0 00-.3246-.6166 1.5079 1.5079 0 00-.612-.415 2.6797 2.6797 0 00-.966-.1729c-.5205 0-.9947.0633-1.4282.1384a6.5608 6.5608 0 00-1.065.259l-.2712-1.8498c.283-.0979.7048-.1957 1.2491-.2935a9.8597 9.8597 0 011.752-.1494zm-6.79-1.072c-.7576.001-1.373-.6103-1.3759-1.3664 0-.755.6128-1.3664 1.376-1.3664.764 0 1.3775.6115 1.3775 1.3664s-.6195 1.3664-1.3776 1.3664zm1.1393 11.1507h-2.2726V5.3409l2.2734-.3568v10.0845l-.0008.0017zm-3.984 0c-3.707.0168-3.707-2.986-3.707-3.4642L59.7069.3576 61.9685 0v11.1794c0 .2715 0 1.9889 1.452 1.994V15.0703zm-7.3512-4.979c0-.975-.2138-1.7873-.6305-2.3516-.4167-.571-.9998-.852-1.747-.852-.7454 0-1.3302.281-1.7452.852-.4166.5702-.6195 1.3765-.6195 2.3516 0 .9851.208 1.6473.6254 2.2183.4158.576.9998.8587 1.7461.8587.7454 0 1.3303-.2885 1.747-.8595.4158-.5761.6237-1.2315.6237-2.2184v.0009zm2.3132-.006c0 .7609-.1099 1.3361-.3356 1.9654a4.654 4.654 0 01-.9533 1.6076A4.214 4.214 0 0155.613 14.69c-.579.2412-1.4697.3795-1.9143.3795-.4462-.005-1.3303-.1324-1.9033-.3795a4.307 4.307 0 01-1.474-1.0316c-.4115-.4445-.7293-.9801-.9609-1.6076a5.3423 5.3423 0 01-.3465-1.9653c0-.7608.104-1.493.3356-2.1155a4.683 4.683 0 01.9719-1.5958 4.3383 4.3383 0 011.479-1.0257c.5739-.242 1.2043-.3567 1.8864-.3567.6829 0 1.3125.1197 1.8906.3567a4.1245 4.1245 0 011.4816 1.0257 4.7587 4.7587 0 01.9592 1.5958c.2426.6225.3643 1.3547.3643 2.1155zm-17.0198 0c0 .9448.208 1.9932.6238 2.431.4166.4386.955.6579 1.6142.6579.3584 0 .6998-.0523 1.0176-.1502.3186-.0978.5721-.2134.775-.3517V7.0784a8.8706 8.8706 0 00-1.4926-.1906c-.8206-.0236-1.4452.312-1.8847.8468-.4335.5365-.6533 1.476-.6533 2.3516v-.0008zm6.2863 4.4485c0 1.5385-.3938 2.662-1.1866 3.3773-.791.7136-2.0005 1.0712-3.6308 1.0712-.5958 0-1.834-.1156-2.8228-.334l.3643-1.7865c.8282.173 1.9202.2193 2.4932.2193.9077 0 1.555-.1847 1.943-.5533.388-.3686.578-.916.578-1.643v-.3687a6.8289 6.8289 0 01-.8848.3349c-.3634.1096-.786.167-1.261.167-.6246 0-1.1917-.0979-1.7055-.2944a3.5554 3.5554 0 01-1.3244-.8645c-.3642-.3796-.6541-.8579-.8561-1.4289-.2028-.571-.3068-1.59-.3068-2.339 0-.7034.1099-1.5856.3245-2.1735.2198-.5871.5316-1.0949.9542-1.515.4167-.42.9255-.743 1.5213-.98a5.5923 5.5923 0 012.052-.3855c.7353 0 1.4114.092 2.0707.2024.6592.1088 1.2204.2236 1.6776.35v8.945-.0008zM11.5026 4.2418v-.6511c-.0005-.4553-.3704-.8241-.8266-.8241H8.749c-.4561 0-.826.3688-.8265.824v.669c0 .0742.0693.1264.1445.1096a6.0346 6.0346 0 011.6768-.2362 6.125 6.125 0 011.6202.2185.1116.1116 0 00.1386-.1097zm-5.2806.852l-.3296-.3282a.8266.8266 0 00-1.168 0l-.393.3922a.8199.8199 0 000 1.164l.3237.323c.0524.0515.1268.0397.1733-.0117.191-.259.3989-.507.6305-.7372.2374-.2362.48-.4437.7462-.6335.0575-.0354.0634-.1155.017-.1687zm3.5159 2.069v2.818c0 .081.0879.1392.1622.0987l2.5102-1.2964c.0574-.0287.0752-.0987.0464-.1552a3.1237 3.1237 0 00-2.603-1.574c-.0575 0-.115.0456-.115.1097l-.0008-.0009zm.0008 6.789c-2.0933.0005-3.7915-1.6912-3.7947-3.7804C5.9468 8.0821 7.6452 6.39 9.7387 6.391c2.0932-.0005 3.7911 1.6914 3.794 3.7804a3.7783 3.7783 0 01-1.1124 2.675 3.7936 3.7936 0 01-2.6824 1.1054h.0008zM9.738 4.8002c-1.9218 0-3.6975 1.0232-4.6584 2.6841a5.359 5.359 0 000 5.3683c.9609 1.661 2.7366 2.6841 4.6584 2.6841a5.3891 5.3891 0 003.8073-1.5725 5.3675 5.3675 0 001.578-3.7987 5.3574 5.3574 0 00-1.5771-3.797A5.379 5.379 0 009.7387 4.801l-.0008-.0008z"
								fill="currentColor"
								fill-rule="evenodd"
							></path>
						</svg>
					</a>
				</div>
			</div>

			<div class="search-pagination">
				<pagination
					v-show="showPagination"
					@research="research"
					:totalPage="totalPage"
					:curPage="curPage"
					:pageSize="pageSize"
				/>
				<a v-if="showMoreAsk" class="search-more" @click="moreAskResult">
					<span v-if="showServerLoading" class="uni-loading"></span>
					<span v-else>{{ hasNoMoreServerResult ? '没有更多了' : '更多...' }}</span>
				</a>
			</div>
		</div>
	</div>
</template>

<script>
	import NavbarLogo from '../NavbarLogo.vue';
	import Results from './components/Results.vue';
	import pagination from './components/pagination.vue';
	import MainNavbarLink from '../MainNavbarLink.vue';
	import { search as searchClient } from './utils/searchClient';
	import { postExt, postAsk } from './utils/postDcloudServer';
	import { forbidScroll, debounce } from '../../util';
	import { removeHighlightTags, isEditingContent } from './utils/searchUtils';
	import searchPageConfig from '@theme-config/searchPage';
	import Base64 from './utils/Base64';

	const {
		category,
		translations: {
			searchBox: { placeholder, buttonText, searchBy },
			resultsScreen: { resultsText, noResultsText, askNoResultsText },
		},
		extraFacetFilters = []
	} = searchPageConfig;
	const crawlerUrl = 'https://zh.uniapp.dcloud.io/'

	const resolveRoutePathFromUrl = (url, base = '/') => {
		if (url.indexOf(crawlerUrl) === 0) {
			return url.replace(crawlerUrl, 'https://uniapp.dcloud.io/')
		}
		return url
			// remove url origin
			// .replace(/^(https?:)?\/\/[^/]*/, '');
	}

	export default {
		name: 'DcloudSearchPage',

		props: ['options'],

		components: { NavbarLogo, Results, pagination, MainNavbarLink },

		data() {
			return {
				openSearch: false,
				placeholder,
				buttonText,
				searchBy,
				snippetLength: 30,
				searchValue: '',
				category: Object.freeze(category),
				categoryIndex: 0,
				resultList: [],
				noResult: false,
				serverHtml: '',
				showLoading: false,
				showServerLoading: false,
				hasNoMoreServerResult: false,

				searchPage: 0, // 跳转页数
				curHits: 0, // 当前搜索结果总条数
				totalPage: 0, // 搜索结果总共页数
				curPage: 1, // 当前页
				pageSize: 0, // 每页条数
			};
		},

		computed: {
			currentCategory() {
				return this.category[this.categoryIndex];
			},
			isAlgolia() {
				return this.currentCategory.type === 'algolia';
			},
			isAsk() {
				return this.currentCategory.tag === 'ask';
			},
			showPagination() {
				return !!(this.resultList.length && this.totalPage > 1 && this.isAlgolia);
			},
			showMoreAsk() {
				return this.isAsk && this.serverHtml;
			},
			resultText() {
				return this.noResult
					? noResultsText.replace('${categoryText}', this.currentCategory.text)
					: !this.isAsk
					? resultsText.replace('${resultHits}', this.curHits)
					: askNoResultsText.replace('${categoryText}', this.currentCategory.text);
			},
		},

		mounted() {
			window.addEventListener('keydown', this.onKeyDown);
			window.addEventListener('resize', () => {
				this.initSnippetLength();
				this.initResultWrapHeight();
			});
			if (this.$route.query.s) {
				this.searchValue = this.$route.query.s;
				this.onSearchOpen();
			}
		},

		watch: {
			resultList() {
				this.$refs.pageContainer.scrollTop = 0;
			},

			openSearch(val) {
				this.$nextTick(() => {
					if (val) {
						forbidScroll();
						document.body.appendChild(this.$el);
						this.$nextTick(() => {
							this.$refs.searchInput.focus();
							this.initResultWrapHeight();
						});
					} else {
						this.cancel();
						forbidScroll(false);
						document.body.removeChild(this.$el);
					}
				});
			},

			searchValue: debounce(function () {
				this.resetSearchPage();
				this.search();
			}, 300),

			$route: {
				immediate: true,
				handler(route) {
					this.categoryIndex = -1;
					category
						.map(item => {
							return item.type === 'algolia' ? item.text : '';
						})
						.filter(Boolean)
						.forEach((item, index) => {
							if (route.path.indexOf('uni-app-x') !== -1 && item === 'uni-app x') {
								this.categoryIndex = index;
							} else if (route.path.indexOf(item) !== -1) {
								this.categoryIndex = index;
							}
						});

					if (this.categoryIndex === -1) this.categoryIndex = 0;
				},
			},
		},

		methods: {
			initResultWrapHeight() {
				if (!this.$el) return;

				const pageHeight = this.$el.clientHeight;
				const searchNavbar = document.querySelector('.search-navbar');
				const resultNumber = document.querySelector('.result-number');
				const alogliaLogo = document.querySelector('.algolia-logo');
				const resultWrap = document.querySelector('.result-wrap');

				const searchNavbarHeight = (searchNavbar || { clientHeight: 209 }).clientHeight;
				const resultNumberHeight = (resultNumber || { clientHeight: 47 }).clientHeight;
				const algoliaLogoHeight = (alogliaLogo || { clientHeight: 49 }).clientHeight;
				const searchPagination = 36;

				if (resultWrap)
					resultWrap.style.minHeight =
						pageHeight -
						searchNavbarHeight -
						resultNumberHeight -
						algoliaLogoHeight -
						searchPagination -
						20 +
						'px';
			},

			resetSearchPage() {
				this.searchPage = 0;
			},

			research(curPage) {
				this.searchPage = curPage - 1;
				this.search();
			},

			search() {
				if (!this.searchValue || !this.searchValue.trim().length) return;
				const { type } = this.currentCategory;
				switch (type) {
					case 'algolia':
						this.showLoading = true;
						this.searchByAlgolia()
							.then(({ hitsPerPage, nbHits, nbPages, page, hits }) => {
								this.resultList = hits.map(item => {
									const items = item.getItems();
									return {
										...item,
										title: removeHighlightTags(items[0]),
										items,
									};
								});
								this.noResult = !this.resultList.length;
								this.curHits = nbHits;
								this.pageSize = hitsPerPage;
								this.totalPage = nbPages;
								this.curPage = page + 1;
							})
							.finally(() => (this.showLoading = false));
						break;
					case 'server':
						this.showLoading = true;
						this.searchByServer().finally(() => (this.showLoading = false));
						break;
				}
			},

			searchByAlgolia() {
				const { searchParameters = {} } = this.options;
				let categoryArr = [`category:${this.currentCategory.text}`];
				categoryArr.push(...extraFacetFilters)
				categoryArr = [categoryArr];
				return searchClient(
					Object.assign({}, this.options, {
						query: `'${this.searchValue}'`,
						page: this.searchPage,
						snippetLength: this.snippetLength,
						searchParameters: {
							...searchParameters,
							facetFilters: [`lang:${this.$lang}`].concat(
								searchParameters.facetFilters || [],
								categoryArr
							),
						},
						transformItems: items =>
							items.map(item => {
								// the `item.url` is full url with protocol and hostname
								// so we have to transform it to vue-router path
								return {
									...item,
									url: resolveRoutePathFromUrl(item.url, this.$site.base),
								};
							}),
						onClose: this.onSearchClose,
					})
				);
			},

			searchByServer(append = false) {
				const { tag } = this.currentCategory;
				const query = this.searchValue || '';

				switch (tag) {
					case 'ext':
						return postExt(query).then(({ html, hits }) => {
							this.serverHtml = html;
							this.curHits = hits;
							this.noResult = !hits;
						});
					case 'ask':
						append && (this.showServerLoading = true);
						this.searchPage === 0 && (this.searchPage = 1);
						return postAsk(query, this.searchPage)
							.then(res => {
								if (res) {
									const { html = '', hits } = res;
									if (append) {
										this.serverHtml += html;
									} else {
										this.hasNoMoreServerResult = false;
										this.serverHtml = html;
									}
									this.noResult = !this.serverHtml.length;
								} else {
									if (append) {
										this.hasNoMoreServerResult = true;
									} else {
										this.serverHtml = '';
										this.noResult = true;
									}
								}
							})
							.finally(() => (this.showServerLoading = false));
				}
			},

			moreAskResult() {
				if (this.hasNoMoreServerResult) return;
				this.searchPage === 0 ? (this.searchPage = 2) : this.searchPage++;
				this.searchByServer(true);
			},

			mainNavLinkClass(index) {
				return ['main-navbar-item', this.categoryIndex === index ? 'active' : ''];
			},

			initSnippetLength() {
				if (window.matchMedia('(max-width: 980px)').matches) {
					this.snippetLength = 20;
				}

				if (window.matchMedia('(max-width: 600px)').matches) {
					this.snippetLength = 15;
				}

				if (this.$refs.pageContainer) {
					this.$refs.pageContainer.style.maxHeight = document.documentElement.clientHeight;
					this.$refs.pageContainer.style.maxWidth = document.documentElement.clientWidth;
				}
			},

			switchCategory(index) {
				this.categoryIndex = index;
				this.research(1);
			},

			cancel() {
				this.resultList.length = 0;
				this.searchValue = '';
				this.curHits = 0;
				this.totalPage = 0;
				this.serverHtml = '';
				this.noResult = false;
			},

			onSearchOpen() {
				this.openSearch = true;
			},

			onSearchClose() {
				this.openSearch = false;
			},

			onKeyDown(event) {
				if (
					(event.keyCode === 27 && this.openSearch) ||
					// The `Cmd+K` shortcut both opens and closes the modal.
					(event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
					// The `/` shortcut opens but doesn't close the modal because it's
					// a character.
					(!isEditingContent(event) && event.key === '/' && !this.openSearch)
				) {
					event.preventDefault();

					if (this.openSearch) {
						this.onSearchClose();
					} else {
						this.onSearchOpen();
					}
				}
			},

			createLink({ link, tag }) {
				return link + (tag === 'ask' ? Base64.encode(this.searchValue) : this.searchValue);
			},
		},
	};
</script>

<style lang="stylus">
	@import './index'
</style>
