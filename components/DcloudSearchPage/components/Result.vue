<template>
	<li :class="li_class">
		<a :href="handleUrl(item.url)">
			<div class="DocSearch-Hit-Container">
				<div
					class="DocSearch-Hit-content-wrapper"
					v-if="item.hierarchy[item.type] && item.type === 'lvl1'"
				>
					<span class="DocSearch-Hit-title" v-html="hierarchyLvl1Html" />
					<span v-if="item.content" class="DocSearch-Hit-path" v-html="contentHtml" />
				</div>

				<div v-else-if="isContent" class="DocSearch-Hit-content-wrapper">
					<span class="DocSearch-Hit-title" v-html="contentHtml" />
					<span class="DocSearch-Hit-path" v-html="hierarchyLvl1Html || hierarchyLvl2Html" />
				</div>

				<div v-else class="DocSearch-Hit-content-wrapper">
					<span
						class="DocSearch-Hit-title"
						v-html="snippetResultContent(`hierarchy.${item.type}`)"
					/>
					<span class="DocSearch-Hit-path" v-html="hierarchyLvl1Html" />
				</div>

				<span v-if="item.tag && item.tag !== 'uniCloud'" class="DocSearch-Hit-source_tag">
					{{ item.tag }}
				</span>
			</div>
		</a>
	</li>
</template>
<script>
	function getPropertyByPath(object, path) {
		const parts = path.split('.');

		return parts.reduce((prev, current) => {
			if (prev && prev[current]) return prev[current];
			return null;
		}, object);
	}

	export default {
		data() {
			return {};
		},
		props: {
			item: {
				type: Object,
				default: () => ({}),
			},
			index: {
				type: Number,
				default: 0,
			},
		},
		computed: {
			li_class() {
				return ['DocSearch-Hit', this.item.__docsearch_parent && 'DocSearch-Hit--Child']
					.filter(Boolean)
					.join(' ');
			},
			isContent() {
				return this.item.type === 'content';
			},
			contentHtml() {
				return this.snippetResultContent('content');
			},
			hierarchyLvl1Html() {
				return this.snippetResultContent('hierarchy.lvl1');
			},
			hierarchyLvl2Html() {
				const lvl2 = this.snippetResultContent('hierarchy.lvl2');
				return this.isContent ? this.contentHtml === lvl2 ? '' : lvl2 : '';
			},
		},
		methods: {
			snippetResultContent(attribute) {
				return (
					getPropertyByPath(this.item, `_snippetResult.${attribute}.value`) ||
					getPropertyByPath(this.item, attribute)
				);
			},
			handleUrl(url) {
				const len = url.length
				const lastIndex = url.lastIndexOf('/')
				if (lastIndex === len - 1) {
					return url
				}
				const front = url.substring(0, lastIndex + 1)
				const end = url.substring(lastIndex + 1)
				if (end.indexOf('.html') > -1) {
					return url
				}
				if (end.indexOf('#') > -1) {
					return front + end.replace(/([\s\S]+)#([\s\S]+)/, '$1.html#$2')
				}
				return `${url}.html`
			}
		},
	};
</script>
<style lang="stylus">
  .DocSearch-Hit-source_tag {
    background-color: #f0f0f0;
    font-size: 12px;
    padding: 2px 4px;
    color: #999;
    border-radius: 3px;
    margin-right: 5px;
    font-weight: normal;
  }
	.DocSearch-Hit
	  border-radius 0px
	  display flex
	  padding-bottom 0px
	  position relative

	  &:not(:first-child)
	    border-top 1px solid #f5f6f7

	  a
	    background var(--docsearch-hit-background)
	    border-radius 0px
	    // box-shadow var(--docsearch-hit-shadow)
	    box-shadow none
	    display block
	    padding-left var(--docsearch-spacing)
	    width 100%

	  .DocSearch-Hit-Container
	    align-items center
	    color #444950
	    display flex
	    flex-direction row
	    height 56px
	    padding 0 12px 0 0

	  .DocSearch-Hit-content-wrapper
	    overflow hidden
	    display flex
	    flex 1 1 auto
	    flex-direction column
	    font-weight 500
	    justify-content center
	    line-height 1.2em
	    margin 0 8px
	    overflow-x hidden
	    position relative
	    text-overflow ellipsis
	    white-space nowrap
	    width 80%

	    .DocSearch-Hit-title
	      font-size 0.9em

	    .DocSearch-Hit-path
	      // color $accentColor
	      font-size 0.75em
</style>
