<template>
  <nav
    v-if="userLinks.length && showSubNavBar"
    class="nav-links"
  >
    <!-- user links -->
    <div
      v-for="(item, index) in userLinks"
      :key="item.link"
      class="nav-item"
      :class="{
        'current-nav-item': index === currentUserLinkIndex,
        'router-link-active': index === currentUserLinkIndex && hasItemChildren(item)
      }"
    >
      <DropdownLink
        v-if="item.type === 'links'"
        :item="item"
      />
      <NavLink
        v-else
        :item="item"
      />
      <button
        v-if="hasItemChildren(item)"
        class="nav-item-toggle"
        type="button"
        :aria-controls="itemChildrenId(index)"
        :aria-expanded="String(isItemOpen(item, index))"
        :aria-label="item.ariaLabel || item.text"
        @click="toggleItem(item, index)"
      >
        <span
          class="arrow"
          :class="isItemOpen(item, index) ? 'down' : 'right'"
          aria-hidden="true"
        />
      </button>
      <div
        v-if="hasItemChildren(item)"
        v-show="isItemOpen(item, index)"
        :id="itemChildrenId(index)"
        class="nav-item-children"
      >
        <slot
          v-if="index === currentUserLinkIndex || isItemOpen(item, index)"
          name="item-children"
          :item="item"
          :children="getItemChildren(item)"
        />
      </div>
    </div>
  </nav>
</template>

<script>
import DropdownLink from '@theme/components/DropdownLink.vue'
import { resolveNavLinkItem } from '../util'
import NavLink from '@theme/components/NavLink.vue'
import navInject from '../mixin/navInject';

export default {
  name: 'NavLinks',

  mixins: [ navInject ],

  components: {
    NavLink,
    DropdownLink
  },

  props: {
    itemChildren: {
      type: Object,
      default: () => ({})
    }
  },

  data () {
    return {
      openItemKey: ''
    }
  },

  computed: {
    userNav () {
      return this.customNavBar[this.navConfig.userNavIndex].items || []
      // return this.$themeLocaleConfig.nav || this.$site.themeConfig.nav || []
    },

    nav () {
      const { locales } = this.$site
      if (locales && Object.keys(locales).length > 1) {
        const currentLink = this.$page.path
        const routes = this.$router.options.routes
        const themeLocales = this.$site.themeConfig.locales || {}
        const languageDropdown = {
          text: this.$themeLocaleConfig.selectText || 'Languages',
          ariaLabel: this.$themeLocaleConfig.ariaLabel || 'Select language',
          items: Object.keys(locales).map(path => {
            const locale = locales[path]
            const text = themeLocales[path] && themeLocales[path].label || locale.lang
            let link
            // Stay on the current page
            if (locale.lang === this.$lang) {
              link = currentLink
            } else {
              // Try to stay on the same page
              link = currentLink.replace(this.$localeConfig.path, path)
              // fallback to homepage
              if (!routes.some(route => route.path === link)) {
                link = path
              }
            }
            return { text, link }
          })
        }
        return [...this.userNav, languageDropdown]
      }
      return this.userNav
    },

    userLinks () {
      return (this.nav || []).map(link => {
        return Object.assign(resolveNavLinkItem(link), {
          items: (link.items || []).map(resolveNavLinkItem)
        })
      })
    },

    currentUserLinkIndex () {
      const index = this.userLinks.indexOf(this.subNavBarItem)
      return index === -1 ? 0 : index
    }
  },

  methods: {
    getItemChildren (item) {
      return this.itemChildren[item.link] || []
    },
    hasItemChildren (item) {
      return this.getItemChildren(item).length > 0
    },
    itemKey (item, index) {
      return item.link || item.text || String(index)
    },
    itemChildrenId (index) {
      return `sidebar-nav-children-${index}`
    },
    isItemOpen (item, index) {
      return this.openItemKey === this.itemKey(item, index)
    },
    toggleItem (item, index) {
      const key = this.itemKey(item, index)
      this.openItemKey = this.openItemKey === key ? '' : key
    },
    openCurrentItem () {
      const item = this.userLinks[this.currentUserLinkIndex]
      this.openItemKey = item && this.hasItemChildren(item)
        ? this.itemKey(item, this.currentUserLinkIndex)
        : ''
    }
  },

  created () {
    this.openCurrentItem()
  },

  watch: {
    $route () {
      this.$nextTick(this.openCurrentItem)
    }
  }
}
</script>

<style lang="stylus">
.nav-links
  max-width 90%
  display inline-block
  a
    line-height 1.4rem
    color inherit
    &:hover, &.router-link-active
      color $accentColor
  .nav-item
    position relative
    display inline-block
    margin-left 0.8rem
    line-height 2rem
    &:first-child
      margin-left 0
  .repo-link
    margin-left 1.5rem

@media (max-width: $MQMobile)
  .nav-links
    .nav-item, .repo-link
      margin-left 0

@media (min-width: $MQMobile)
  .nav-item > .nav-link:not(.external)
    display block
    height 40px
    line-height 40px
    min-width 24px
    padding 0 1.6vw
    background-color #fff
    border-radius 4px
    transition background .3s
    font-size 14px

  /* .nav-links a
    &:hover, &.router-link-active
      color $textColor*/
  .nav-item > a:not(.external)
    &:hover
      background-color #f0f0f0
    &.router-link-active
      color #fff
      background-color $accentColor
</style>
