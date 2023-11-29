export default {
  inject: ['navConfig', 'customNavBar', 'changeUserNav', 'customNavBarKeys', 'navbarLanguage', 'customNavBarLinks'],

  computed: {
    showSubNavBar() {
      return !!this.customNavBar[this.navConfig.userNavIndex].items
    },
    mainNavBarText() {
      return this.customNavBar[this.navConfig.userNavIndex].text
    },
    subNavBarText() {
      const curNavBar = this.customNavBar[this.navConfig.userNavIndex]
      // fix: /uni-app-x/api/ 获取不到 subNavBarText
      const curLink = (this.$page.path.match(/\/([^\/]+)\/([^\/]+)?/) || [])[this.navConfig.userNavIndex + 1]
      const item = curNavBar.items ? curNavBar.items.filter(
        item => item.type === 'link' && item.link.indexOf(curLink) !== -1
      )[0] : curNavBar
      return item ? item.text : curNavBar.items[0].text
    }
  }
}