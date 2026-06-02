<template>
  <header class="navbar navbar-fixed" :class="{ 'navbar-collapsed': fixedNavbar && showSubNavBar }">
    <div class="main-navbar">
      <!-- <SidebarButton @toggle-sidebar="$emit('toggle-sidebar')" /> -->

      <NavbarLogo />

      <div class="main-navbar-links can-hide">
        <template v-for="(item, index) in customNavBar">
          <div :class="mainNavLinkClass(index)" :key="item.text">
            <MainNavbarLink v-if="item.type" :item='item' />
            <a v-else href="javascript:;" @click="changeUserNav(index)">{{item.text}}</a>
          </div>
        </template>
      </div>

      <div class="mobile-main-navbar">
        <div class="mobile-links__panel" :class="{open: showMobilePanel}">
          <template v-for="(item, index) in customNavBar">
            <div :class="mainNavLinkClass(index)" :key="item.text">
              <MainNavbarLink v-if="item.type" :item='item' @click.native="toggleMobilePanel" />
              <a v-else href="javascript:;" @click="changeUserNav(index),toggleMobilePanel()">{{item.text}}</a>
            </div>
          </template>
        </div>
      </div>

      <div class="main-navbar_right">
        <div class="mobile-links_mobile">
          <a href="javascript:;" class="mobile-links__btn" @click="toggleMobilePanel">{{mainNavBarText}}</a>
        </div>

        <div class="links">
          <!-- <a class="switch-version" href="javascript:void(0)">回到旧版</a> -->
          <DcloudSearchPage v-if="isAlgoliaSearch" ref="dcloudSearchPage" :options="algolia" />
          <AlgoliaSearchBox v-if="isAlgoliaSearch" />
          <SearchBox v-else-if="$site.themeConfig.search !== false && $page.frontmatter.search !== false" />
        </div>

        <div v-if="showNavbarLanguage" class="dropdown-language" @click="switchLanguage">
          <div style="display: flex;align-items: center;">
            <span>{{navbarLanguage[navConfig.languageIndex].text}}</span>
            <svg t="1629441415944" viewBox="0 20 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3713"
              width="16" height="16" class="icon">
              <path
                d="M508.025406 655.446718c-14.45307 0-28.183486-5.781228-39.023289-15.898376l-231.249118-231.249118c-10.117149-10.117149-10.117149-26.015526 0-36.132675s26.015526-10.117149 36.132675 0l231.249118 231.249118c2.16796 2.16796 4.335921 2.16796 5.781228 0l231.971771-231.971771c10.117149-10.117149 26.015526-10.117149 35.410021 0 10.117149 10.117149 10.117149 26.015526 0 36.132674l-231.971771 231.971772c-9.394495 10.117149-23.124912 15.898377-38.300635 15.898376z"
                p-id="3714"></path>
            </svg>
          </div>
          <div v-if="showLanguage" class="dropdown-content">
            <div
              v-for="(item,index) in navbarLanguage"
              :key="item.link"
              @click="() => { typeof item.click === 'function' && item.click(index === navConfig.languageIndex) }"
            >
              <a :href="index === navConfig.languageIndex ? 'javascript:;' : item.link" target="_self" :key="item.text"
                :class="[index === navConfig.languageIndex ? 'clickDisabled' : '']">
                {{item.text}}
              </a>
            </div>
          </div>
        </div>

        <!-- repo link -->
        <a
          v-if="repoLink"
          :href="repoLink"
          class="repo-link can-hide"
          style="color: black"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ repoLabel }}
          <OutboundLink />
        </a>

      </div>

    </div>

    <div class="sub-navbar">
      <DropdownLink class="custom-main-navbar can-hide" v-if="showSubNavBar && fixedNavbar" :item="{
          text: customNavBarKeys[navConfig.userNavIndex],
          items: customNavBar
        }" />
      <NavLinks class="can-hide" />
      <div class="mobile-sub-navbar">
        <div class="subnavbar__item" @click="$emit('toggle-sidebar')">
          <a href="javascript:;">{{subNavBarText}}</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import AlgoliaSearchBox from './AlgoliaSearchBox'
import SearchBox from './SearchBox'
import SidebarButton from '@theme/components/SidebarButton.vue'
import NavLinks from '@theme/components/NavLinks.vue'
import MainNavbarLink from './MainNavbarLink.vue';
import NavbarLogo from './NavbarLogo.vue';
import DcloudSearchPage from './DcloudSearchPage';
import navInject from '../mixin/navInject';
import DropdownLink from '@theme/components/DropdownLink.vue'
import { forbidScroll, os } from '../util';

export default {
  name: 'Navbar',

  mixins: [ navInject ],

  components: {
    SidebarButton,
    NavLinks,
    MainNavbarLink,
    SearchBox,
    AlgoliaSearchBox,
    NavbarLogo,
    DcloudSearchPage,
    DropdownLink
  },

  data () {
    return {
      showMobilePanel: false,
      fixedNavbar: false,
      navbarOffset: 0,
      showLanguage: false
    }
  },

  computed: {
    algolia () {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {}
    },

    isAlgoliaSearch () {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName
    },

    repoLink () {
      const { repo } = this.$site.themeConfig
      if (repo) {
        return /^https?:/.test(repo)
          ? repo
          : `https://github.com/${repo}`
      }
      return null
    },

    repoLabel () {
      if (!this.repoLink) return
      if (this.$site.themeConfig.repoLabel) {
        return this.$site.themeConfig.repoLabel
      }

      const repoHost = this.repoLink.match(/^https?:\/\/[^/]+/)[0]
      const platforms = ['GitHub', 'GitLab', 'GitCode', 'Gitee', 'Bitbucket']
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i]
        if (new RegExp(platform, 'i').test(repoHost)) {
          return platform
        }
      }

      return 'Source'
    },

    showNavbarLanguage() {
      return this.navbarLanguage && Array.isArray(this.navbarLanguage) && this.navbarLanguage.length > 1
    }
  },

  mounted () {
    this.handleLinksWrapWidth()
    window.addEventListener('resize', this.handleLinksWrapWidth, false)
    this.handleWindowClick = () => {
      this.showLanguage = false
    }
    window.addEventListener('click', this.handleWindowClick)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleLinksWrapWidth, false)
    window.removeEventListener('click', this.handleWindowClick)
    this.removeWindowScroll()
    this.clearScrollFrame()
    if (!this.pageContainer) {
      this.pageContainer = document.querySelector('.page')
    }
    this.pageContainer && (this.pageContainer.style.marginTop = 'auto')
  },

  methods: {
    handleLinksWrapWidth() {
      this.$nextTick(this.initNavBar)
    },
    initNavBar () {
      os.init()
      this.navbar = document.querySelector('.navbar')
      this.mainNavBar = document.querySelector('.main-navbar')
      this.subNavBar = document.querySelector('.sub-navbar')
      this.pageContainer = document.querySelector('.page')
      this.navbarHeight = (this.navbar && this.navbar.clientHeight) || 0
      this.subNavBarHeight = (this.subNavBar && this.subNavBar.clientHeight) || 0
      this.mainNavBarHeight = (this.mainNavBar && this.mainNavBar.clientHeight) || 0
      this.updateFloatingState()
      this.scrollBehavior()
    },
    scrollBehavior () {
      this.removeWindowScroll()
      if (this.showSubNavBar && os.pc) {
        this.addWindowScroll()
      } else {
        this.updateFloatingState()
      }
    },
    addWindowScroll () {
      window.addEventListener('scroll', this.onWindowScroll, { passive: true })
    },
    removeWindowScroll () {
      window.removeEventListener('scroll', this.onWindowScroll)
      this.clearScrollFrame()
    },
    onWindowScroll () {
      if (this.scrollRafId) return
      this.scrollRafId = window.requestAnimationFrame(() => {
        this.scrollRafId = 0
        this.updateFloatingState()
      })
    },
    clearScrollFrame () {
      if (!this.scrollRafId) return
      window.cancelAnimationFrame(this.scrollRafId)
      this.scrollRafId = 0
    },
    setFixedNavbar (fixed) {
      if (this.fixedNavbar === fixed) return
      this.fixedNavbar = fixed
    },
    updateFloatingState () {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0
      const shouldSlide = this.showSubNavBar && os.pc
      const offset = shouldSlide
        ? Math.min(Math.max(scrollTop, 0), this.mainNavBarHeight)
        : 0

      this.navbarOffset = offset
      this.setFixedNavbar(!shouldSlide || offset >= this.mainNavBarHeight)
      this.updateStickyTop(offset)
    },
    updateStickyTop (offset = this.navbarOffset) {
      const fullHeight = this.navbarHeight
      const subHeight = this.subNavBarHeight || fullHeight
      const top = fullHeight - offset
      const rootStyle = document.documentElement.style
      rootStyle.setProperty('--navbar-main-height', `${this.mainNavBarHeight}px`)
      rootStyle.setProperty('--navbar-full-height', `${fullHeight}px`)
      rootStyle.setProperty('--navbar-sub-height', `${subHeight}px`)
      rootStyle.setProperty('--navbar-top', `${-offset}px`)
      rootStyle.setProperty('--navbar-sticky-top', `${top}px`)
      this.updatePageOffset()
    },
    updatePageOffset () {
      if (!this.pageContainer) return
      if (!os.pc) {
        this.pageContainer.style.marginTop = 'auto'
        return
      }
      this.pageContainer.style.marginTop = `${this.navbarHeight}px`
    },
    mainNavLinkClass (index) {
      return ['main-navbar-item', this.navConfig.userNavIndex === index ? 'active' : '']
    },
    toggleMobilePanel () {
      this.showMobilePanel = !this.showMobilePanel
      forbidScroll(this.showMobilePanel)
    },
    switchLanguage (e) {
      e.stopPropagation()
      this.showLanguage = !this.showLanguage
    }
  },

  watch: {
    showSubNavBar () {
      this.$nextTick(this.initNavBar)
    },
    'navConfig.userNavIndex' () {
      this.$nextTick(this.initNavBar)
    }
  }
}
</script>

<style lang="stylus">
$navbar-vertical-padding = 0.7rem
$navbar-horizontal-padding = 1.5rem
@import '../styles/navbar'

.navbar
  // padding $navbar-vertical-padding $navbar-horizontal-padding
  line-height $navbar-main-navbar-height // $navbarHeight - 1.4rem
  a, span, img
    display inline-block
  .title-logo
  .logo
    height $navbar-logo-height // $navbarHeight - 1.4rem
    // min-width $navbar-main-navbar-height // $navbarHeight - 1.4rem
    margin-right 0.8rem
    vertical-align top
  .site-name
    font-size 1.3rem
    font-weight 600
    color $textColor
    position relative
  .links
    z-index 100
    height 100%
    // padding-left 1.5rem
    box-sizing border-box
    // background-color white
    white-space nowrap
    font-size 0.9rem
    display flex
    .search-box
      flex: 0 0 auto
      vertical-align top

@media (max-width: $MQMobile)
  .navbar
    // padding-left 4rem
    .can-hide
      display none !important
    .links
      padding-left 0rem // 1.5rem
    .site-name
      width calc(100vw - 9.4rem)
      overflow hidden
      white-space nowrap
      text-overflow ellipsis
</style>
