<template>
  <div
    class="theme-container"
    :class="pageClasses"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @keydown.ctrl="openSearch = true"
  >
    <Navbar v-if="shouldShowNavbar" @toggle-sidebar="toggleSidebar" />

    <div class="sidebar-mask" @click="toggleSidebar(false)" />

    <div class="content-container">
      <div class="sidebar-column">
        <Sidebar
          id="theme-sidebar"
          :collapsed="isDesktopSidebarCollapsed || isDesktopSidebarExpanding"
          :items="sidebarItems"
          @toggle-sidebar="toggleSidebar"
        >
          <template #top>
            <slot name="sidebar-top" />
          </template>
          <template #bottom>
            <slot name="sidebar-bottom" />
            <SiderBarBottom v-if="$lang === LOCALE_ZH_HANS" />
          </template>
        </Sidebar>
        <button
          v-if="shouldShowSidebar && !isDesktopSidebarCollapsed && !isDesktopSidebarExpanding"
          class="desktop-sidebar-toggle"
          type="button"
          aria-controls="theme-sidebar"
          :aria-expanded="String(!isDesktopSidebarCollapsed)"
          :aria-label="desktopSidebarToggleLabel"
          :title="desktopSidebarToggleLabel"
          @click="toggleDesktopSidebar"
        >
          <span
            class="arrow left"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="shouldShowSidebar && isDesktopSidebarCollapsed"
          class="desktop-sidebar-expand-rail"
          type="button"
          aria-controls="theme-sidebar"
          aria-expanded="false"
          aria-label="展开侧边栏"
          @click="toggleDesktopSidebar"
        >
          <span class="desktop-sidebar-expand-rail__label">展开侧栏</span>
        </button>
      </div>

      <Home v-if="$page.frontmatter.home" />

      <Page v-else :sidebar-items="sidebarItems">
        <template #top>
          <slot name="page-top" />
          <TocTop />
        </template>
        <template #bottom>
          <slot name="page-bottom" />
          <Footer />
        </template>
      </Page>

      <div class="toc-column">
        <Toc />
      </div>
    </div>
  </div>
</template>

<script>
import Home from '@theme/components/Home.vue'
import Navbar from '@theme/components/Navbar.vue'
import Page from '@theme/components/Page.vue'
import Sidebar from '@theme/components/Sidebar.vue'
import Footer from '@theme/components/Footer.vue'
import SiderBarBottom from '../components/SiderBarBottom.vue'
import Toc from '../components/Toc'
import TocTop from '../components/Toc-top'
import { resolveSidebarItems, forbidScroll } from '../util'
import navProvider from '../mixin/navProvider'
import toc from '../mixin/toc'
import { LOCALE_ZH_HANS } from '@theme-config/i18n'

// 与 styles/index.styl 的 $MQMobile 和 $page-layout-width 保持一致。
const DESKTOP_SIDEBAR_MEDIA = '(min-width: 1141px) and (max-width: 1823px)'

export default {
  name: 'Layout',
  mixins: [navProvider, toc],
  components: {
    Home,
    Page,
    Sidebar,
    Navbar,
    Footer,
    SiderBarBottom,
    Toc,
    TocTop,
  },
  data() {
    return {
      isSidebarOpen: false,
      isDesktopSidebarCollapsed: false,
      isDesktopSidebarExpanding: false,
      LOCALE_ZH_HANS,
    }
  },
  computed: {
    shouldShowNavbar() {
      const { themeConfig } = this.$site
      const { frontmatter } = this.$page
      if (frontmatter.navbar === false || themeConfig.navbar === false) {
        return false
      }
      return this.$title || themeConfig.logo || themeConfig.repo || themeConfig.nav || this.$themeLocaleConfig.nav
    },
    shouldShowSidebar() {
      const { frontmatter } = this.$page
      return !frontmatter.home && frontmatter.sidebar !== false && this.sidebarItems.length
    },
    sidebarItems() {
      return resolveSidebarItems(this.$page, this.$page.regularPath, this.$site, this.$localePath)
    },
    desktopSidebarToggleLabel() {
      return this.isDesktopSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'
    },
    pageClasses() {
      const userPageClass = this.$page.frontmatter.pageClass
      return [
        {
          'no-navbar': !this.shouldShowNavbar,
          'sidebar-open': this.isSidebarOpen,
          'sidebar-collapsed': this.isDesktopSidebarCollapsed && this.shouldShowSidebar,
          'sidebar-expanding': this.isDesktopSidebarExpanding && this.shouldShowSidebar,
          'no-sidebar': !this.shouldShowSidebar,
          'no-toc': !this.visible,
        },
        userPageClass,
      ]
    },
  },
  mounted() {
    this.$router.afterEach(() => {
      this.isSidebarOpen = false
    })
    forbidScroll(this.isSidebarOpen)
    this.renderNavLinkState()
    this._desktopSidebarMediaQuery = window.matchMedia(DESKTOP_SIDEBAR_MEDIA)
    this._desktopSidebarMediaQuery.addListener(this.handleDesktopSidebarMediaChange)
  },
  beforeDestroy() {
    if (this._desktopSidebarMediaQuery) {
      this._desktopSidebarMediaQuery.removeListener(this.handleDesktopSidebarMediaChange)
    }
    this.cancelDesktopSidebarExpand()
  },
  methods: {
    toggleSidebar(to) {
      this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
      this.$emit('toggle-sidebar', this.isSidebarOpen)
    },
    toggleDesktopSidebar() {
      if (this.isDesktopSidebarCollapsed) {
        this.isDesktopSidebarCollapsed = false
        this.isDesktopSidebarExpanding = true
        this.$nextTick(() => {
          if (
            this._isBeingDestroyed ||
            this._isDestroyed ||
            !this.isDesktopSidebarExpanding
          ) return
          this._desktopSidebarExpandFrame = window.requestAnimationFrame(() => {
            this._desktopSidebarExpandFrame = 0
            this.finishDesktopSidebarExpand()
          })
        })
      } else {
        this.isDesktopSidebarCollapsed = true
        this.cancelDesktopSidebarExpand()
      }
    },
    finishDesktopSidebarExpand() {
      this.cancelDesktopSidebarExpand()
      this.isDesktopSidebarExpanding = false
    },
    cancelDesktopSidebarExpand() {
      if (this._desktopSidebarExpandFrame) {
        window.cancelAnimationFrame(this._desktopSidebarExpandFrame)
        this._desktopSidebarExpandFrame = 0
      }
      this.isDesktopSidebarExpanding = false
    },
    handleDesktopSidebarMediaChange(event) {
      // 离开可折叠区间时恢复完整布局，返回后仍保持默认展开。
      if (!event.matches) {
        this.isDesktopSidebarCollapsed = false
        this.cancelDesktopSidebarExpand()
      }
    },
    // side swipe
    onTouchStart(e) {
      this.touchStart = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      }
    },
    onTouchEnd(e) {
      const dx = e.changedTouches[0].clientX - this.touchStart.x
      const dy = e.changedTouches[0].clientY - this.touchStart.y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx > 0 && this.touchStart.x <= 80) {
          this.toggleSidebar(true)
        } else {
          this.toggleSidebar(false)
        }
      }
    },
    renderNavLinkState() {
      this.$nextTick(() => {
        const sidebarKeys = Object.keys(this.$themeConfig.sidebar || {}).filter(key => key !== '/')
        const currentPath = this.$page.path
        const matchedSidebarKey = sidebarKeys
          .filter(key => currentPath.includes(key))
          .sort((a, b) => b.length - a.length)[0]
        const hasMatchedSidebarKey = typeof matchedSidebarKey === 'string' && matchedSidebarKey.length > 0

        const isSubPage = /\/([\w-]+)+\//.test(this.$route.fullPath)
        const navContainers = Array.from(document.querySelectorAll('nav.nav-links'))
        navContainers.forEach(nav => {
          const navLinks = Array.from(nav.querySelectorAll('a.nav-link:not(.external)'))
          navLinks.forEach(link => {
            link.classList.remove('router-link-active')

            if (isSubPage && hasMatchedSidebarKey) {
              const isMatchedLink = link.href.includes(matchedSidebarKey)
              const matchWithoutMatchSidebar = sidebarKeys
                .filter(i => i !== matchedSidebarKey && i !== this.$site.base)
                .find(i => link.href.match(i) !== null)
              // 当 base 不为 '/' 时，可能会出现 link.href 包含 sidebarKey，但实际并不匹配的情况，此时需要排除掉这种情况
              const hasNoMoreSpecificMatch = typeof matchWithoutMatchSidebar === 'undefined' || matchWithoutMatchSidebar.length < matchedSidebarKey.length

              if (isMatchedLink && hasNoMoreSpecificMatch) {
                link.classList.add('router-link-active')
              }
            }
          })

          if ((!isSubPage || !hasMatchedSidebarKey) && navLinks.length) {
            navLinks[0].classList.add('router-link-active')
          }
        })
      })
    },
  },
  watch: {
    isSidebarOpen: forbidScroll,
    $route() {
      this.renderNavLinkState()
    },
  },
}
</script>
