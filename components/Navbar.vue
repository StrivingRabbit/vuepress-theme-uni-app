<template>
  <header class="navbar" :class="{ 'navbar-fixed': fixedNavbar }">
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
        <div class="mobile-links_mobile">
          <a href="javascript:;" class="mobile-links__btn" @click="toggleMobilePanel">{{mainNavBarText}}</a>
        </div>
        <div class="mobile-links__panel" :class="{open: showMobilePanel}">
          <template v-for="(item, index) in customNavBar">
            <div :class="mainNavLinkClass(index)" :key="item.text">
              <MainNavbarLink v-if="item.type" :item='item' @click.native="toggleMobilePanel" />
              <a v-else href="javascript:;" @click="changeUserNav(index),toggleMobilePanel()">{{item.text}}</a>
            </div>
          </template>
        </div>
      </div>

      <div class="dropdown-language" @click="switchLanguage">
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

      <div class="links" :style="{ top: `${this.SearchBoxTop}px` }">
        <!-- <a class="switch-version" href="javascript:void(0)">回到旧版</a> -->
        <DcloudSearchPage v-if="isAlgoliaSearch" ref="dcloudSearchPage" :options="algolia" />
        <AlgoliaSearchBox v-if="isAlgoliaSearch" />
        <SearchBox v-else-if="$site.themeConfig.search !== false && $page.frontmatter.search !== false" />
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
      SearchBoxTop: 0,
      showLanguage: false
    }
  },

  computed: {
    algolia () {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {}
    },

    isAlgoliaSearch () {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName
    }
  },

  mounted () {
    const handleLinksWrapWidth = () => {
      this.$nextTick(this.initNavBar)
    }
    handleLinksWrapWidth()
    window.addEventListener('resize', handleLinksWrapWidth, false)
    window.addEventListener('click',(e)=> {
      this.showLanguage = false
    })
    this.initNavBar()
  },

  methods: {
    initNavBar () {
      os.init()
      this.sideBar = document.querySelector('.sidebar')
      this.navbar = document.querySelector('.navbar')
      this.mainNavBar = document.querySelector('.main-navbar')
      this.subNavBar = document.querySelector('.sub-navbar')
      this.pageContainer = document.querySelector('.page')
      this.vuepressToc = document.querySelector('.vuepress-toc')
      this.navbarHeight = this.navbar.clientHeight
      this.subNavBarHeight = this.subNavBar.clientHeight
      this.mainNavBarHeight = this.mainNavBar.clientHeight
      this.scrollBehavior()
    },
    scrollBehavior () {
      this.removeWindowScroll()
      this.onWindowScroll()
      if(this.showSubNavBar) {
        this.addWindowScroll()
      } else {
        this.fixedNavbar = true
        this.SearchBoxTop = 0
      }
    },
    addWindowScroll () {
      window.addEventListener('scroll', this.onWindowScroll, false)
    },
    removeWindowScroll () {
      window.removeEventListener('scroll', this.onWindowScroll)
      this.fixedNavbar = false
      this.sideBar && this.sideBar.removeAttribute('style')
      this.vuepressToc && this.vuepressToc.removeAttribute('style')
      this.navbar && this.navbar.removeAttribute('style')
      if (this.pageContainer) {
        this.pageContainer.style.marginTop = this.showSubNavBar || !os.pc ? 'auto' : `${this.navbarHeight}px`
      }
    },
    onWindowScroll () {
      const scrollTop = !this.showSubNavBar ? 0 : document.documentElement.scrollTop || document.body.scrollTop;

      if (!this.fixedNavbar) {
        let sideTop = this.navbarHeight - scrollTop
        sideTop <= this.subNavBarHeight && (sideTop = this.subNavBarHeight)
        this.sideBar && (this.sideBar.style.top = `${sideTop + 1}px`)
        this.vuepressToc && (this.vuepressToc.style.top = `${sideTop + 1}px`)
      }

      if (scrollTop >= this.mainNavBarHeight) {
        if (!this.fixedNavbar) {
          this.fixedNavbar = true
          this.navbar.style.top = `-${this.mainNavBarHeight}px`
          this.SearchBoxTop = this.mainNavBarHeight + (this.subNavBarHeight - this.mainNavBarHeight) / 2
          this.$nextTick(() => {
            this.pageContainer && (this.pageContainer.style.marginTop = `${this.navbarHeight}px`)
          })
        }
      } else if (scrollTop < this.mainNavBarHeight) {
        if (this.fixedNavbar) {
          this.fixedNavbar = false
          this.pageContainer && (this.pageContainer.style.marginTop = 'auto')
          this.SearchBoxTop = 0
        }
      }
    },
    fixedSideBarHeight () {
      if(!os.pc) return
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      this.navbarHeight = this.navbar.clientHeight
      this.subNavBarHeight = this.subNavBar.clientHeight
      const setHeight = !!scrollTop || this.fixedNavbar ? this.subNavBarHeight : this.navbarHeight
      this.sideBar.style.top = `${setHeight + 1}px`
      this.vuepressToc.style.top = `${setHeight + 1}px`
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
    fixedNavbar () {
      this.fixedSideBarHeight()
      this.scrollBehavior()
    },
    'navConfig.userNavIndex' () {
      this.$nextTick(()=>{
        this.fixedSideBarHeight()
        this.scrollBehavior()
      })
    }
  }
}

function css (el, property) {
  // NOTE: Known bug, will return 'auto' if style value is 'auto'
  const win = el.ownerDocument.defaultView
  // null means not to return pseudo styles
  return win.getComputedStyle(el, null)[property]
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
    position absolute
    right $navbar-horizontal-padding
    top 0 //$navbar-vertical-padding
    transition: top 0.1s ease 0s
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
      top 0 !important
    .site-name
      width calc(100vw - 9.4rem)
      overflow hidden
      white-space nowrap
      text-overflow ellipsis
</style>
