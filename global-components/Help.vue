<template>
  <sup class="help">
    <a
      class="help__link"
      :href="_href"
      :title="resolvedLabel"
      :aria-label="resolvedLabel"
      :target="target"
    ><slot>?</slot></a>
  </sup>
</template>

<script>
import helpConfig from '@theme-config/help'

const COMPATIBILITY_HELP_HREF = helpConfig.compatibilityHelpHref || '/tutorial/compatibility.html'

export default {
  name: 'Help',

  props: {
    href: {
      type: String,
      default: COMPATIBILITY_HELP_HREF,
    },
    target: {
      type: String,
      default: '_blank',
    },
    label: {
      type: String,
      default: '',
    },
  },

  computed: {
    _href() {
      const baseEndwithSlash = this.$site.base.slice(-1) === '/'
      const hrefStartwithSlash = this.href.slice(0, 1) === '/'
      return baseEndwithSlash && hrefStartwithSlash
        ? this.$site.base + this.href.slice(1)
        : baseEndwithSlash
        ? this.$site.base + this.href
        : hrefStartwithSlash
        ? this.$site.base.slice(0, -1) + this.href
        : this.$site.base + '/' + this.href
    },
    resolvedLabel() {
      if (this.label) return this.label

      const isChinese = typeof this.$lang === 'string' && this.$lang.toLowerCase().startsWith('zh')
      if (this.href === COMPATIBILITY_HELP_HREF) {
        return isChinese ? '查看兼容性表格说明' : 'View compatibility table guide'
      }
      return isChinese ? '查看帮助' : 'View help'
    },
  },
}
</script>

<style lang="stylus" scoped>
.help
  font-size 0.8em
  line-height 0
  vertical-align super

.help__link
  color inherit !important
  text-decoration none !important
  line-height 1
  opacity 0.72

  &:hover,
  &:focus-visible
    opacity 1
</style>
