<template>
  <aside class="sidebar">
    <NavLinks :item-children="sidebarItemsByNavLink">
      <template #item-children="{ children }">
        <SidebarLinks
          class="contextual-sidebar-links"
          :depth="0"
          :items="children"
        />
      </template>
    </NavLinks>

    <slot name="top" />

    <SidebarLinks
      v-if="!showSubNavBar"
      class="sidebar-links-fallback"
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />
  </aside>
</template>

<script>
import NavLinks from '@theme/components/NavLinks.vue'
import SidebarLinks from '@theme/components/SidebarLinks.vue'
import navInject from '../mixin/navInject'
import { isExternal, normalizeNavPath, resolveSidebarItems } from '../util'

export default {
  name: 'Sidebar',

  mixins: [navInject],

  components: {
    NavLinks,
    SidebarLinks
  },

  props: {
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
    a
      // font-weight 600
    .nav-item, .repo-link
      display block
      line-height 1.25rem
      font-size 1.1em
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
        font-size 1em
        > .nav-link,
        > .dropdown-wrapper
          display none
    .contextual-sidebar-links
      display block
      padding 1.5rem 0
      a.sidebar-link
        // font-weight 400
        &.active
          font-weight 600
  .contextual-sidebar-links,
  > .sidebar-links-fallback
    padding 1.5rem 0
    > li > a.sidebar-link
      font-size 1.1em
      line-height 1.7
      font-weight bold
    > li:not(:first-child)
      margin-top 0.5rem
      @media (max-width: $MQMobile)
        &
          margin-top 0rem

@media (max-width: $MQMobile)
  .sidebar
    > .nav-links
      padding 0
      border-bottom 0
      > .nav-item
        display block
        margin 0
        padding 0
        font-size 16px
        line-height 1.4
        border-bottom 1px solid rgba(0, 0, 0, 0.06)
        > .nav-link
          display block
          width 100%
          min-width 0
          height auto
          padding 14px 52px 14px 20px
          box-sizing border-box
          border-radius 0
          background transparent
          font-size 16px
          // font-weight 500
          line-height 1.4
        > .dropdown-wrapper
          display block
          > .mobile-dropdown-title
            display block
            width 100%
            padding 14px 20px
            box-sizing border-box
            font-size 16px
            line-height 1.4
            text-align left
        > .nav-item-toggle
          position absolute
          z-index 1
          top 7px
          right 12px
          display flex
          align-items center
          justify-content center
          width 36px
          height 36px
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
          font-size 16px
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
        margin 0 16px 10px 28px
        padding 4px 0 8px 12px
        border-left 1px solid #d9e4de
        font-size 14px
        .sidebar-heading
          position relative
          padding 9px 32px 9px 12px
          border-left 0
          font-size 14px
          // font-weight 500
          line-height 1.5
          .arrow
            position absolute
            top 50%
            right 12px
            left auto
            margin-top -3px
        .sidebar-group.is-sub-group
          padding-left 8px
          > .sidebar-heading
            padding-left 12px
        .sidebar-group-items a.sidebar-link
          padding-left 20px
        a.sidebar-link
          width 100%
          padding 8px 10px 8px 12px
          border-left 0
          border-radius 4px
          box-sizing border-box
          font-size 14px
          // font-weight 400
          line-height 1.5
          &.active
            background-color #eaf6f0
            font-weight 600
    > .sidebar-links-fallback
      padding 1rem 0

@media (min-width: ($MQMobile + 1px))
  .sidebar > .nav-links > .current-nav-item > .nav-item-children
    // 移动端的折叠状态不能隐藏桌面端 Sidebar。
    display block !important
</style>
