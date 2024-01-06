<template>
	<div class="table-of-contents">
		<div v-for="item in showHeaders" ref="chairTocItem" class="vuepress-toc-item-top"
			:class="[`vuepress-toc-h${item.level}`]">
			<a :style="{ paddingLeft: createPaddingLeft(item.level) }" :href="`#${item.slug}`" :title="item.title">
				{{ item.title }}
			</a>
		</div>
		<span v-if="pageHeaders && pageHeaders.length > expandHeaderLength" class="expand-button" @click="expandClick">
			{{ !expand ? collapseText : expandText }}
			<uni-icon :type="!expand ? 'bottom' : 'top'"></uni-icon>
		</span>
	</div>
</template>

<script>
import toc from '../mixin/toc';
import tocConfig from '@theme-config/toc';

const { expandText, collapseText } = tocConfig;

export default {
	mixins: [toc],
	data: () => ({
		expand: false,
		expandText,
		collapseText,
		expandHeaderLength: 10,
	}),
	computed: {
		showHeaders() {
			return this.expand
				? this.pageHeaders
				: this.pageHeaders.slice(0, this.expandHeaderLength);
		},
	},
	methods: {
		expandClick() {
			this.expand = !this.expand;
		},
	},
};
</script>

<style lang="stylus" scoped>
	$paddingLeft = 1.5rem
	.table-of-contents
	  margin 145px auto 0
	  padding 2rem 2.5rem 0 2.5rem
	  @media (max-width: $MQNarrow)
	    padding 2rem 2rem 0 2rem
	  @media (max-width: $MQMobileNarrow)
	    padding 1.5rem 1.5rem 0 1.5rem
	   // border-left: 2px solid #e6e6e6
		.expand-button
			padding-left $paddingLeft
			border-left 2px solid rgba(0, 0, 0, 0.08)
			color #666
			&:hover
				cursor pointer
				color $accentColor
	.vuepress-toc-item-top
	  position relative
	  padding 0.1rem 0.6rem 0.1rem $paddingLeft
	  line-height 1.5rem
	  border-left 2px solid rgba(0, 0, 0, 0.08)
	  overflow hidden
	  a
	    // display block
	    // color $textColor
	    // width 100%
	    box-sizing border-box
	    font-size 15px
	    font-weight 400
	    text-decoration none
	    transition color 0.3s
	    overflow hidden
	    text-overflow ellipsis
	    white-space nowrap
	/* for i in range(2, 6)
	  .vuepress-toc-h{i} a
	    padding-left 1rem * (i - 1) */
</style>
