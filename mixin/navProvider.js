import { navbar, navbarLanguage, userNavIndex } from '@theme-config/navbar';
import { isExternal, normalizeNavPath } from '../util'

function getMatchingPathLength(currentPath, item, siteBase) {
  const links = [item.link].concat((item.items || []).map(child => child.link))
  let matchedLength = -1

  links.forEach(link => {
    if (!link || isExternal(link)) return
    const itemPath = normalizeNavPath(link, siteBase)
    const matched = itemPath === '/' || currentPath === itemPath || currentPath.indexOf(`${itemPath}/`) === 0
    if (matched && itemPath.length > matchedLength) {
      matchedLength = itemPath.length
    }
  })

  return matchedLength
}

export default {
  data() {
    return { navConfig: { userNavIndex: userNavIndex || 0, languageIndex: (navbarLanguage || {}).default } }
  },

  provide() {
    return {
      navConfig: this.navConfig,
      customNavBar: this.customNavBar,
      changeUserNav: this.changeUserNav,
      customNavBarKeys: this.customNavBarKeys,
      customNavBarLinks: this.customNavBarLinks,
      navbarLanguage: (navbarLanguage || {}).items
    }
  },

  created() {
    this.syncUserNavIndex()
  },

  computed: {
    customNavBar() {
      const list = []
      navbar.forEach(item => {
        if (item.items && item.items.length) {
          list.push(item)
        }
        item.type === 'link' && list.push(item)
      })
      return list
    },

    customNavBarKeys() {
      return this.customNavBar.map(item => item.text)
    },

    customNavBarLinks() {
      return this.customNavBar.map(item => item.link)
    }
  },

  methods: {
    syncUserNavIndex() {
      const siteBase = this.$site && this.$site.base
      const currentPath = normalizeNavPath(this.$route.path, siteBase)
      let matchedIndex = -1
      let matchedLength = -1

      this.customNavBar.forEach((item, index) => {
        const length = getMatchingPathLength(currentPath, item, siteBase)
        if (length > matchedLength) {
          matchedIndex = index
          matchedLength = length
        }
      })

      if (matchedIndex !== -1) {
        this.navConfig.userNavIndex = matchedIndex
      }
    },
    changeUserNav(index) {
      this.navConfig.userNavIndex = index
      const curNavBar = this.customNavBar[index]
      const firstItemLink = curNavBar.items ? curNavBar.items[0].link : curNavBar.link
      if (this.$page.path !== firstItemLink) this.$router.push(firstItemLink)
    }
  },

  watch: {
    $route() {
      this.syncUserNavIndex()
    }
  }
}
