<template>
  <aside class="sidebar">
    <NavLinks :item-children="sidebarItemsByNavLink">
      <template #item-children="{ children }">
        <SidebarLinks
          class="contextual-sidebar-links"
          :depth="0"
          :items="children"
          @layout-updated="scheduleActiveLinkScroll"
        />
      </template>
    </NavLinks>

    <slot name="top" />

    <SidebarLinks
      v-if="!showSubNavBar"
      class="sidebar-links-fallback"
      :depth="0"
      :items="items"
      @layout-updated="scheduleActiveLinkScroll"
    />
    <slot name="bottom" />
  </aside>
</template>

<script>
import NavLinks from '@theme/components/NavLinks.vue'
import SidebarLinks from '@theme/components/SidebarLinks.vue'
import navInject from '../mixin/navInject'
import { isExternal, normalizeNavPath, resolveSidebarItems } from '../util'

const ACTIVE_LINK_SCROLL_DELAY = 120
const ACTIVE_LINK_EDGE_SPACE = 24

export default {
  name: 'Sidebar',

  mixins: [navInject],

  components: {
    NavLinks,
    SidebarLinks
  },

  props: {
    collapsed: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    sidebarItemsByNavLink () {
      const result = {}
      const currentNav = this.customNavBar[this.navConfig.userNavIndex]
      const navItems = currentNav && currentNav.items ? currentNav.items : []
      const pages = this.$site.pages || []
      const pagesByPath = createPageIndex(pages)

      navItems.forEach(item => {
        if (!item.link || isExternal(item.link)) return
        const page = findPageByNavLink(pagesByPath, item.link, this.$site.base)
        if (!page) return
        result[item.link] = resolveSidebarItems(
          page,
          page.regularPath || page.path,
          this.$site,
          this.$localePath
        )
      })

      return result
    }
  },

  mounted () {
    this.scheduleActiveLinkScroll()
  },

  beforeDestroy () {
    this.cancelActiveLinkScroll()
  },

  watch: {
    collapsed (value) {
      if (value) {
        this.cancelActiveLinkScroll()
      } else {
        this.scheduleActiveLinkScroll()
      }
    }
  },

  methods: {
    scheduleActiveLinkScroll () {
      if (this.collapsed || this._isBeingDestroyed || this._isDestroyed) return
      this.cancelActiveLinkScroll()

      // SidebarLinks 会在路由变化后展开当前分组，等待其动画结束再计算位置。
      this._activeLinkScrollTimer = window.setTimeout(() => {
        this._activeLinkScrollTimer = 0
        this.scrollActiveLinkIntoView()
      }, ACTIVE_LINK_SCROLL_DELAY)
    },

    cancelActiveLinkScroll () {
      if (!this._activeLinkScrollTimer) return
      window.clearTimeout(this._activeLinkScrollTimer)
      this._activeLinkScrollTimer = 0
    },

    scrollActiveLinkIntoView () {
      const sidebar = this.$el
      if (sidebar.getClientRects().length === 0) return
      const activeLinks = sidebar.querySelectorAll('.sidebar-link.active')
      // hash 路由会同时激活页面和标题链接，最后一个才是当前标题。
      const activeLink = activeLinks[activeLinks.length - 1]
      if (!activeLink) return

      const sidebarRect = sidebar.getBoundingClientRect()
      const activeLinkRect = activeLink.getBoundingClientRect()
      const visibleTop = sidebarRect.top + ACTIVE_LINK_EDGE_SPACE
      const visibleBottom = sidebarRect.bottom - ACTIVE_LINK_EDGE_SPACE

      // 只滚动 Sidebar 自身，并采用最近边缘，避免 scrollIntoView 带动页面跳动。
      if (activeLinkRect.top < visibleTop) {
        sidebar.scrollTop -= visibleTop - activeLinkRect.top
      } else if (activeLinkRect.bottom > visibleBottom) {
        sidebar.scrollTop += activeLinkRect.bottom - visibleBottom
      }
    }
  }
}

function createPageIndex (pages) {
  const result = {}
  pages.forEach(page => {
    result[normalizeNavPath(page.regularPath || page.path)] = page
  })
  return result
}

function findPageByNavLink (pagesByPath, link, base) {
  const path = normalizeNavPath(link)
  const normalizedBase = normalizeNavPath(base)
  const paths = [path]
  if (
    normalizedBase !== '/' &&
    (path === normalizedBase || path.indexOf(`${normalizedBase}/`) === 0)
  ) {
    paths.push(normalizeNavPath(path.slice(normalizedBase.length)))
  }

  for (let i = 0; i < paths.length; i++) {
    if (pagesByPath[paths[i]]) return pagesByPath[paths[i]]
  }
}
</script>

<style lang="stylus">
.sidebar
  font-size $sidebarFontSizeBase
  line-height $sidebarLineHeight
  > .nav-links > .nav-item > .nav-link,
  > .nav-links > .nav-item > .dropdown-wrapper > .mobile-dropdown-title,
  a.sidebar-link,
  .sidebar-heading
    line-height $sidebarLineHeight
  ul
    padding 0
    margin 0
    list-style-type none
  a
    display inline-block
  .nav-links
    display none
    border-bottom 1px solid $borderColor
    padding 0.5rem 0 0.75rem 0
    .nav-item, .repo-link
      display block
      padding 0.5rem 0 0.5rem 1.5rem
  > .nav-links
    display block
    width 100%
    max-width none
    padding 0
    border-bottom 0
    box-sizing border-box
    > .nav-item
      display none
      > .nav-item-toggle
        display none
      > .nav-item-children
        display block
      &.current-nav-item
        display block
        padding 0
        > .nav-link,
        > .dropdown-wrapper
          display none
    .contextual-sidebar-links
      display block
      padding 1rem 0
  .contextual-sidebar-links,
  > .sidebar-links-fallback
    padding 1rem 0
    > li > a.sidebar-link
      font-weight bold
    > li:not(:first-child)
      margin-top 0.375rem
      @media (max-width: $MQMobile)
        &
          margin-top 0

@media (max-width: $MQMobile)
  .sidebar
    > .nav-links
      padding 0
      border-bottom 0
      > .nav-item
        display block
        position relative
        margin 0
        padding 0
        border-bottom 1px solid rgba(0, 0, 0, 0.06)
        > .nav-link
          display block
          width 100%
          min-width 0
          height auto
          padding 0.75rem 3.25rem 0.75rem 1.25rem
          box-sizing border-box
          border-radius 0
          background transparent
        > .dropdown-wrapper
          display block
          > .mobile-dropdown-title
            display block
            width 100%
            padding 0.75rem 1.25rem
            box-sizing border-box
            text-align left
        > .nav-item-toggle
          position absolute
          z-index 1
          top 0.3125rem
          right 0.75rem
          display flex
          align-items center
          justify-content center
          width 2.25rem
          height 2.25rem
          padding 0
          border 0
          background transparent
          cursor pointer
          &:focus-visible
            outline 2px solid $accentColor
            outline-offset -2px
            border-radius 4px
        > .nav-item-children
          display block
        &.current-nav-item
          padding 0
          > .nav-link,
          > .dropdown-wrapper
            display block
        &.router-link-active
          background-color #f5faf7
          > .nav-link
            color $accentColor
            font-weight 600
      .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
        top calc(1rem - 2px)
      .contextual-sidebar-links
        display block
        margin 0 1rem 0.625rem 1.75rem
        padding 0.25rem 0 0.5rem 0.75rem
        border-left 1px solid #d9e4de
        font-size $sidebarFontSizeSub
        .sidebar-heading
          position relative
          font-size inherit
          padding 0.5rem 2rem 0.5rem 0.75rem
          border-left 0
          .arrow
            position absolute
            top 50%
            right 0.75rem
            left auto
            margin-top -3px
        .sidebar-group.is-sub-group
          padding-left 0.5rem
          > .sidebar-heading
            padding-left 0.75rem
        .sidebar-group-items a.sidebar-link
          padding-left 1.25rem
        a.sidebar-link
          width 100%
          padding 0.5rem 0.625rem 0.5rem 0.75rem
          border-left 0
          border-radius 4px
          box-sizing border-box
          &.active
            background-color #edf7f1
            font-weight 600
    > .sidebar-links-fallback
      padding 1rem 0

@media (min-width: ($MQMobile + 1px))
  .sidebar
    > .nav-links > .current-nav-item > .nav-item-children
      // 移动端的折叠状态不能隐藏桌面端 Sidebar。
      display block !important
    border-right 1px solid #e5eae7
    scrollbar-width thin
    scrollbar-color #cbd5d0 transparent
    &::-webkit-scrollbar
      width 6px
    &::-webkit-scrollbar-thumb
      border-radius 3px
      background-color #cbd5d0
    &::-webkit-scrollbar-track
      background transparent
    > .nav-links .contextual-sidebar-links,
    > .sidebar-links-fallback
      padding 1.25rem 0.75rem 1.5rem
    // 子级背景随层级缩进，右边界保持对齐，避免层级关系被等宽背景削弱。
    .sidebar-group-items > li > a.sidebar-link,
    .sidebar-group.is-sub-group > .sidebar-heading
      width calc(100% - 0.5rem)
    a.sidebar-link,
    .sidebar-heading.clickable,
    .sidebar-group.collapsable > .sidebar-heading
      border-radius 4px
      transition color .15s ease, background-color .15s ease
      &:hover,
      &:focus-visible
        background-color #f5f8f6
      &.active
        background-color #edf7f1
</style>
