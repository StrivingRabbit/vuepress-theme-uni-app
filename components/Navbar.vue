<template>
  <header
    class="navbar navbar-fixed"
    :class="{
      'navbar-with-subnav': showSubNavBar,
      'navbar-collapsed': fixedNavbar && showSubNavBar
    }"
  >
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
        <div
          id="mobile-nav-panel"
          class="mobile-links__panel"
          :class="{ open: showMobilePanel }"
          @click="handleMobilePanelClick"
          @keydown.esc="closeMobilePanel"
        >
          <template v-for="(item, index) in customNavBar">
            <div
              :key="item.link || item.text || index"
              :class="[
                mainNavLinkClass(index),
                { 'mobile-nav-expanded': mobileExpandedIndex === index }
              ]"
            >
              <button
                v-if="hasMobileSubLinks(item)"
                class="mobile-nav-title"
                type="button"
                :aria-expanded="String(mobileExpandedIndex === index)"
                :aria-controls="`mobile-sub-nav-${index}`"
                @click="toggleMobileNav(index)"
              >
                <span>{{ item.text }}</span>
                <span class="mobile-nav-arrow" aria-hidden="true" />
              </button>
              <MainNavbarLink v-else :item="item" />

              <div
                v-if="hasMobileSubLinks(item)"
                v-show="mobileExpandedIndex === index"
                :id="`mobile-sub-nav-${index}`"
                class="mobile-sub-links"
              >
                <div
                  v-for="(subItem, subIndex) in item.items"
                  :key="subItem.link || subItem.text || subIndex"
                  class="mobile-sub-link"
                >
                  <MainNavbarLink :item="subItem" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="main-navbar_right">
        <div class="mobile-links_mobile">
          <a
            href="javascript:;"
            class="mobile-links__btn"
            aria-controls="mobile-nav-panel"
            :aria-expanded="String(showMobilePanel)"
            @click="toggleMobilePanel"
          >
            {{ mainNavBarText }}
          </a>
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
      mobileExpandedIndex: -1,
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
    this.resetNavbarPosition()
    this.closeMobilePanel()
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
      const mainNavBar = this.$el.querySelector('.main-navbar')
      const mobileMainNavBar = this.$el.querySelector('.mobile-main-navbar')
      this.mainNavBarHeight = (mainNavBar && mainNavBar.clientHeight) || 0
      this.shouldSlideNavbar = this.showSubNavBar && os.pc
      // 从移动端切换到桌面端时，隐藏的菜单不能继续锁住页面滚动。
      if (
        this.showMobilePanel &&
        mobileMainNavBar &&
        window.getComputedStyle(mobileMainNavBar).display === 'none'
      ) {
        this.closeMobilePanel()
      }
      // 偏移量只用于直接更新 DOM，不需要放入 Vue 响应式数据。
      this.lastNavbarOffset = null
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
    updateFloatingState () {
      const offset = this.getNavbarOffset()
      if (this.lastNavbarOffset === offset) return
      this.lastNavbarOffset = offset
      const fixedNavbar = !this.shouldSlideNavbar || offset >= this.mainNavBarHeight
      if (this.fixedNavbar !== fixedNavbar) this.fixedNavbar = fixedNavbar
      // 不使用 transform，避免创建新的包含块并改变导航栏内部 fixed 元素的定位行为。
      this.$el.style.top = `${-offset}px`
    },
    resetNavbarPosition () {
      if (this.$el) this.$el.style.removeProperty('top')
      this.lastNavbarOffset = null
    },
    mainNavLinkClass (index) {
      return ['main-navbar-item', this.navConfig.userNavIndex === index ? 'active' : '']
    },
    hasMobileSubLinks (item) {
      return Array.isArray(item.items) && item.items.length > 0
    },
    toggleMobileNav (index) {
      this.mobileExpandedIndex = this.mobileExpandedIndex === index ? -1 : index
    },
    handleMobilePanelClick (event) {
      let target = event.target
      // 所有层级的实际链接统一在这里关闭面板，折叠按钮不会触发关闭。
      while (target && target !== event.currentTarget) {
        if (target.tagName === 'A') {
          this.closeMobilePanel()
          return
        }
        target = target.parentElement
      }
    },
    closeMobilePanel () {
      if (!this.showMobilePanel) return
      this.showMobilePanel = false
      this.mobileExpandedIndex = -1
      forbidScroll(false)
    },
    toggleMobilePanel () {
      if (this.showMobilePanel) {
        this.closeMobilePanel()
        return
      }

      // 打开面板时先展示完整的一级导航，二级导航只在点击一级项后展开。
      this.mobileExpandedIndex = -1
      this.showMobilePanel = true
      // 一级菜单和文档侧边栏不能同时占用移动端视口。
      this.$emit('toggle-sidebar', false)
      // 等父组件完成侧边栏解锁后再加锁，避免异步解锁覆盖菜单状态。
      this.$nextTick(() => {
        if (this.showMobilePanel) forbidScroll(true)
      })
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
    },
    $route () {
      this.closeMobilePanel()
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
