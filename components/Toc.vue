<template>
  <Sticker ref="sticker" :class="['vuepress-toc', visible ? '' : 'table-of-contents-sticker']" v-bind="$attrs">
    <h5>{{ onThisPage }}</h5>
    <div v-for="(item, index) in formatTitlePageHeaders" ref="chairTocItem" class="vuepress-toc-item"
      :class="[`vuepress-toc-h${item.level}`, { active: activeIndex === index }]">
      <RouterLink :style="{ paddingLeft: createPaddingLeft(item.level) }" :to="`#${item.slug}`"
        :title="item.title">
        <span v-html="item.title"></span>
      </RouterLink>
    </div>
    <div v-if="ads && ads.length" class="vuepress-toc-ads">
      <a
        v-for="(ad, i) in ads"
        :key="i"
        :href="ad.href"
        :target="ad.target || '_blank'"
        rel="noopener noreferrer"
        class="vuepress-toc-ad-item"
      >
        <img :src="ad.img" :alt="ad.alt || ''" />
      </a>
    </div>
  </Sticker>
</template>

<script>
import Sticker from './Sticker.vue'
import toc from '../mixin/toc'
import tocConfig from '@theme-config/toc'

const { onThisPage } = tocConfig

// get offset top
function getAbsoluteTop(dom) {
  return dom && dom.getBoundingClientRect
    ? dom.getBoundingClientRect().top + document.body.scrollTop + document.documentElement.scrollTop
    : 0
}
export default {
  mixins: [toc],
  components: {
    Sticker,
  },
  data() {
    return {
      activeIndex: 0,
      tocConfig,
      onThisPage,
      ads: tocConfig.ads || [],
      headingPositions: [],
      scrollRafId: 0,
    }
  },
  watch: {
    activeIndex() {
      const items = this.$refs.chairTocItem || []
      const dom = items[this.activeIndex]
      if (!dom) return
      const rect = dom.getBoundingClientRect()
      const wrapperRect = this.$el.getBoundingClientRect()
      const top = rect.top - wrapperRect.top
      if (top < 20) {
        this.$el.scrollTop = this.$el.scrollTop + top - 20
      } else if (top + rect.height > wrapperRect.height) {
        this.$el.scrollTop += rect.top - (wrapperRect.height - rect.height)
      }
    },
    pageHeaders() {
      this.$nextTick(() => {
        this.refreshHeadingPositions()
        this.syncActiveByScroll()
      })
    },
  },
  mounted() {
    // sync visible to parent component
    const syncVisible = () => {
      this.$emit('visible-change', this.visible)
    }
    syncVisible()
    this.$watch('visible', syncVisible)
    // binding event
    this._onScroll = () => {
      if (this.scrollRafId) return
      this.scrollRafId = window.requestAnimationFrame(() => {
        this.scrollRafId = 0
        this.syncActiveByScroll()
      })
    }
    this._onResize = () => {
      this.refreshHeadingPositions()
      this._onScroll()
    }
    this.refreshHeadingPositions()
    setTimeout(() => this._onScroll(), 1000)
    this._onHashChange = () => {
      const hash = decodeURIComponent(location.hash.substring(1))
      const index = (this.pageHeaders || []).findIndex(h => h.slug === hash)
      if (index >= 0) this.activeIndex = index
      const dom = hash && document.getElementById(hash)
      if (dom) window.scrollTo(0, getAbsoluteTop(dom) - 20)
    }
    window.addEventListener('scroll', this._onScroll, { passive: true })
    window.addEventListener('resize', this._onResize, { passive: true })
    // window.addEventListener('hashchange', this._onHashChange);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this._onScroll)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('hashchange', this._onHashChange)
    if (this.scrollRafId) {
      window.cancelAnimationFrame(this.scrollRafId)
      this.scrollRafId = 0
    }
  },
  methods: {
    refreshHeadingPositions() {
      const headings = this.pageHeaders || []
      this.headingPositions = headings.map(item => {
        const dom = document.getElementById(item.slug)
        return dom ? getAbsoluteTop(dom) : Number.POSITIVE_INFINITY
      })
    },
    syncActiveByScroll() {
      const scrollTop = document.body.scrollTop + document.documentElement.scrollTop
      const positions = this.headingPositions || []
      if (!positions.length) return

      let nextActive = 0
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] - 50 < scrollTop) nextActive = i
        else break
      }

      if (this.activeIndex !== nextActive) this.activeIndex = nextActive
    },
    triggerEvt() {
      this._onScroll()
      this._onHashChange()
    },
  },
}
</script>

<style lang="stylus">
$tocItemPaddingRight = 0.6rem
.table-of-contents-sticker
  display none !important
.vuepress-toc
  position relative
  display none
  max-height 89vh
  width $vuepress-toc-width
  overflow-y hidden
  box-sizing border-box
  background-color #fff
  /* background: #fff; */
  z-index 0
  .vuepress-toc-item
    position relative
    padding 0.1rem $tocItemPaddingRight 0.1rem 1.5rem
    line-height 1.5rem
    border-left 2px solid rgba(0, 0, 0, 0.08)
    overflow hidden
    a
      display block
      color $textColor
      width 100%
      box-sizing border-box
      font-size 14px
      font-weight 400
      text-decoration none
      transition color 0.3s
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &.active
      border-left-color $accentColor
      a
        color $accentColor
    &:hover
      a
        color $accentColor
		.vuepress-toc-h1 a
		.vuepress-toc-h2 a
			font-weight bold
  /* for i in range(2, 6)
    .vuepress-toc-h{i} a
      padding-left 1rem * (i - 1) */
.vuepress-toc:hover
	overflow-y auto

.vuepress-toc-ads
  margin-top 0.5rem
  display flex
  flex-direction column
  gap 0.5rem

.vuepress-toc-ad-item
  display block
  border-radius 4px
  overflow hidden
  line-height 0
  max-width 100%
  padding-right $tocItemPaddingRight
  img
    width 100%
    height auto
    display block
    border-radius 4px
    transition opacity 0.2s
  &:hover img
    opacity 0.85
</style>
