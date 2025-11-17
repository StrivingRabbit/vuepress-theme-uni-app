<template>
	<section class="DocSearch-Hits">
		<div class="DocSearch-Hit-source">
			{{ title }}
		</div>

		<ul id="docsearch-list">
			<template v-for="(item, index) in results">
				<Result
					:key="[title, item.objectID].join(':')"
					:item="item"
					:index="index"
					@click.native="event => onSelect({ item, event })"
				/>
			</template>
		</ul>
	</section>
</template>
<script>
	import Result from './Result.vue';
	export default {
		components: { Result },
		data() {
			return {};
		},
		props: {
			title: {
				type: String,
				default: '文档',
			},
			results: {
				type: Array,
				default: [],
			},
			onSelect: {
				type: Function,
				default: () => {},
			},
		},
		computed: {
			tag() {
				return this.results[0].tag !== 'uniCloud' ? this.results[0].tag : '';
			},
		},
	};
</script>
<style lang="stylus">
	#docsearch-list{
		border-radius: 5px;
		padding: 0;
		border: 1px solid #dfe2e5;
		overflow: hidden;
	}

	.DocSearch-Hits mark {
	  background: none;
	  color: $accentColor;
	}

	.DocSearch-Hit-source {
	  background-color $search-container-color;
	  color: $accentColor;
		font-size 1em;
		padding 15px 4px 15px
	}

	@media (max-width $MQMobile)
		.DocSearch-Hit-source
			padding 8px 4px 8px
</style>
