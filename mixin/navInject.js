import { isExternal, normalizeNavPath, resolveMatchingConfig } from '../util'

function getSidebarBase(path, sidebar) {
  if (!sidebar || Array.isArray(sidebar)) return ''
  return resolveMatchingConfig(path, sidebar).base || ''
}

function belongsToSidebar(sidebarBase, parentSidebarBase) {
  const parentBase = parentSidebarBase.replace(/\/+$/, '')
  const currentBase = sidebarBase.replace(/\/+$/, '')
  return parentBase
    && parentBase !== '/'
    && (currentBase === parentBase || currentBase.indexOf(`${parentBase}/`) === 0)
}

function isPathMatch(currentPath, itemPath) {
  return currentPath === itemPath || (
    itemPath !== '/' && currentPath.indexOf(`${itemPath}/`) === 0
  )
}

export default {
  inject: ['navConfig', 'customNavBar', 'changeUserNav', 'customNavBarKeys', 'navbarLanguage', 'customNavBarLinks'],

  computed: {
    showSubNavBar() {
      const currentNav = this.customNavBar[this.navConfig.userNavIndex]
      return !!(currentNav && currentNav.items && currentNav.items.length)
    },
    mainNavBarText() {
      const currentNav = this.customNavBar[this.navConfig.userNavIndex]
      return currentNav ? currentNav.text : ''
    },
    subNavBarItem() {
      const curNavBar = this.customNavBar[this.navConfig.userNavIndex] || {}
      const items = curNavBar.items || []
      const siteBase = this.$site && this.$site.base
      const currentPath = normalizeNavPath(this.$page.path, siteBase)
      const themeLocaleConfig = this.$themeLocaleConfig || {}
      const sidebar = themeLocaleConfig.sidebar || this.$themeConfig.sidebar

      // 一个二级导航可代表同一 _sidebar.md 下的多个页面，例如 pages.json 和 theme.json。
      const currentSidebarBase = getSidebarBase(currentPath, sidebar)
      let matchedByPath
      let matchedBySidebar
      let matchedPathLength = -1
      let matchedSidebarLength = -1

      items.forEach(item => {
        if (item.type !== 'link' || !item.link || isExternal(item.link)) return
        const itemPath = normalizeNavPath(item.link, siteBase)
        if (isPathMatch(currentPath, itemPath) && itemPath.length > matchedPathLength) {
          matchedByPath = item
          matchedPathLength = itemPath.length
        }

        const itemSidebarBase = getSidebarBase(itemPath, sidebar)
        if (
          belongsToSidebar(currentSidebarBase, itemSidebarBase)
          && itemPath.length > matchedSidebarLength
        ) {
          matchedBySidebar = item
          matchedSidebarLength = itemPath.length
        }
      })

      return matchedByPath || matchedBySidebar || items[0] || curNavBar
    },
    subNavBarText() {
      return this.subNavBarItem ? this.subNavBarItem.text : ''
    }
  }
}
