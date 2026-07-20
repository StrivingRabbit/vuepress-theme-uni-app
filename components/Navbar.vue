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
    this.scheduleInitNavBar()
    window.addEventListener('resize', this.scheduleInitNavBar, false)
    this.handleWindowClick = () => {
      this.showLanguage = false
    }
    window.addEventListener('click', this.handleWindowClick)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.scheduleInitNavBar, false)
    window.removeEventListener('click', this.handleWindowClick)
    this.clearInitNavBarFrame()
    this.removeWindowScroll()
    this.resetFloatingStyles()
    if (!this.pageContainer) {
      this.pageContainer = document.querySelector('.page')
    }
    this.pageContainer && (this.pageContainer.style.marginTop = 'auto')
  },

  methods: {
    scheduleInitNavBar () {
      // resize 和导航栏 watcher 可能同时触发，将布局读取延迟并合并到同一帧。
      if (this.initNavBarPending) return
      this.initNavBarPending = true
      this.$nextTick(() => {
        if (!this.initNavBarPending) return
        this.initNavBarRafId = window.requestAnimationFrame(() => {
          this.initNavBarRafId = 0
          this.initNavBarPending = false
          if (!this.$el || !this.$el.parentElement) return
          this.initNavBar()
        })
      })
    },
    clearInitNavBarFrame () {
      this.initNavBarPending = false
      if (!this.initNavBarRafId) return
      window.cancelAnimationFrame(this.initNavBarRafId)
      this.initNavBarRafId = 0
    },
    initNavBar () {
      os.init()
      const themeContainer = this.$el.parentElement
      this.navbar = this.$el
      this.mainNavBar = this.navbar.querySelector('.main-navbar')
      this.pageContainer = themeContainer.querySelector('.page')
      // 只匹配布局中的直属元素，避免修改 Markdown 内容里的同名 class。
      this.stickyElements = Array.from(themeContainer.querySelectorAll(
        '.content-container > .sidebar, .content-container > .vuepress-toc'
      ))
      this.navbarHeight = (this.navbar && this.navbar.clientHeight) || 0
      this.mainNavBarHeight = (this.mainNavBar && this.mainNavBar.clientHeight) || 0
      this.isDesktop = os.pc
      this.shouldSlideNavbar = this.showSubNavBar && this.isDesktop
      // 偏移量只用于直接更新 DOM，不需要放入 Vue 响应式数据。
      this.lastNavbarOffset = null
      this.updatePageOffset()
      this.scrollBehavior()
    },
    scrollBehavior () {
      this.removeWindowScroll()
      this.updateFloatingState()
      if (this.shouldSlideNavbar) {
        this.addWindowScroll()
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
      // 滚动超过折叠阈值后偏移量不再变化，跳过后续动画帧。
      if (this.scrollRafId || this.getNavbarOffset() === this.lastNavbarOffset) return
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
    getNavbarOffset () {
      if (!this.shouldSlideNavbar) return 0
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      return Math.min(Math.max(scrollTop, 0), this.mainNavBarHeight)
    },
    setFixedNavbar (fixed) {
      if (this.fixedNavbar === fixed) return
      this.fixedNavbar = fixed
    },
    updateFloatingState () {
      const offset = this.getNavbarOffset()
      if (this.lastNavbarOffset === offset) return
      this.lastNavbarOffset = offset
      this.setFixedNavbar(!this.shouldSlideNavbar || offset >= this.mainNavBarHeight)
      this.updateStickyTop(offset)
    },
    updateStickyTop (offset) {
      const fullHeight = this.navbarHeight
      const top = fullHeight - offset
      // 只更新相关元素：修改根节点 CSS 变量会使整棵 Markdown DOM 树的样式失效；
      // transform 会创建新的包含块，改变导航栏内部 fixed 元素的定位行为。
      if (this.navbar) {
        this.navbar.style.top = `${-offset}px`
      }
      const stickyElements = this.stickyElements || []
      stickyElements.forEach(element => {
        if (this.isDesktop) {
          element.style.top = `${top}px`
        } else {
          element.style.removeProperty('top')
        }
      })
    },
    resetFloatingStyles () {
      if (this.navbar) {
        this.navbar.style.removeProperty('top')
      }
      const stickyElements = this.stickyElements || []
      stickyElements.forEach(element => {
        element.style.removeProperty('top')
      })
      this.lastNavbarOffset = null
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
      this.scheduleInitNavBar()
    },
    'navConfig.userNavIndex' () {
      this.scheduleInitNavBar()
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
