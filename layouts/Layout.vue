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
          ref="sidebar"
          :items="sidebarItems"
          @toggle-sidebar="toggleSidebar"
          @hook:mounted="activeSidebarLinkVisible"
        >
          <template #top>
            <slot name="sidebar-top" />
          </template>
          <template #bottom>
            <slot name="sidebar-bottom" />
            <SiderBarBottom v-if="$lang === LOCALE_ZH_HANS" />
          </template>
        </Sidebar>
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
    pageClasses() {
      const userPageClass = this.$page.frontmatter.pageClass
      return [
        {
          'no-navbar': !this.shouldShowNavbar,
          'sidebar-open': this.isSidebarOpen,
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
  },
  methods: {
    toggleSidebar(to) {
      this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
      this.$emit('toggle-sidebar', this.isSidebarOpen)
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
    activeSidebarLinkVisible() {
      this.$nextTick(() => {
        const sidebarRef = this.$refs.sidebar
        const sidebarEl = sidebarRef && sidebarRef.$el
        if (!sidebarEl) return

        const activeLink = sidebarEl.querySelector('.sidebar-link.active')
        if (!activeLink) return

        const topOffset = 50
        const bottomOffset = 24
        const sidebarScrollTop = sidebarEl.scrollTop
        const windowInnerHeight = window.innerHeight
        const { bottom } = activeLink.getBoundingClientRect()
        const isNearTop = sidebarScrollTop + topOffset > activeLink.offsetTop
        const isNearBottom = bottom > windowInnerHeight - bottomOffset

        if (isNearTop || isNearBottom) {
          activeLink.scrollIntoView({ block: 'center' })
        }
      })
    },
  },
  watch: {
    isSidebarOpen: forbidScroll,
    $route() {
      this.renderNavLinkState()
      this.activeSidebarLinkVisible()
    },
  },
}
</script>
