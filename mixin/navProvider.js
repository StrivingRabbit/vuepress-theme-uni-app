import { navbar, navbarLanguage } from '@theme-config/navbar';

export default {
  data() {
    return { navConfig: { userNavIndex: 0, languageIndex: navbarLanguage.default } }
  },

  provide() {
    return {
      navConfig: this.navConfig,
      customNavBar: this.customNavBar,
      changeUserNav: this.changeUserNav,
      customNavBarKeys: this.customNavBarKeys,
      customNavBarLinks: this.customNavBarLinks,
      navbarLanguage: navbarLanguage.items
    }
  },

  created() {
    this.customNavBar.forEach((item, index) => {
      if (this.$route.path.indexOf(item.link) !== -1 && item.link !== '/') this.navConfig.userNavIndex = index
    })
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
    changeUserNav(index) {
      this.navConfig.userNavIndex = index
      const curNavBar = this.customNavBar[index]
      const firstItemLink = curNavBar.items ? curNavBar.items[0].link : curNavBar.link
      if (this.$page.path !== firstItemLink) this.$router.push(firstItemLink)
    }
  },

  watch: {
    $route(after) {
      let navbarIndex = -1
      this.customNavBarLinks.forEach((link, index) => {
        if (after.path.indexOf(link) !== -1) navbarIndex = index
      })
      navbarIndex === -1 && (navbarIndex = 0)
      this.navConfig.userNavIndex !== navbarIndex && navbarIndex !== -1 && (this.navConfig.userNavIndex = navbarIndex)
    }
  }
}