import { isExternal, normalizeNavPath } from '../util'

export default {
  inject: ['navConfig', 'customNavBar', 'changeUserNav', 'customNavBarKeys', 'navbarLanguage', 'customNavBarLinks'],

  computed: {
    showSubNavBar() {
      return !!this.customNavBar[this.navConfig.userNavIndex].items
    },
    mainNavBarText() {
      return this.customNavBar[this.navConfig.userNavIndex].text
    },
    subNavBarItem() {
      const curNavBar = this.customNavBar[this.navConfig.userNavIndex]
      const items = curNavBar.items || []
      const currentPath = normalizeNavPath(this.$page.path)
      let matchedItem
      let matchedLength = -1

      items.forEach(item => {
        if (item.type !== 'link' || !item.link || isExternal(item.link)) return
        const itemPath = normalizeNavPath(item.link)
        const matched = currentPath === itemPath || (
          itemPath !== '/' && currentPath.indexOf(`${itemPath}/`) === 0
        )
        if (matched && itemPath.length > matchedLength) {
          matchedItem = item
          matchedLength = itemPath.length
        }
      })

      return matchedItem || items[0] || curNavBar
    },
    subNavBarText() {
      return this.subNavBarItem.text
    }
  }
}
