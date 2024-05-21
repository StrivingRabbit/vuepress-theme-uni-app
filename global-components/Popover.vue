<script setup>
import { ref, useSlots } from 'vue'
import { getNavbarHeight } from '../helper'

const props = defineProps({
  table: String
})

const infoHover = ref(false)
const slots = useSlots()
let iconMouseOptions = {}

const iconMouseEnter = (e) => {
  const { top, left, bottom, right, height, width } = e.target.getBoundingClientRect()
  iconMouseOptions = {
    top,
    left,
    bottom,
    right,
    height,
    width
  }
  infoHover.value = true
}

const iconMouseLeave = (e) => {
  infoHover.value = false
}

const vPopover = {
  inserted(el, binding, vnode, prevVnode) {
    const ThemeDefaultContent = document.querySelector('.theme-default-content')
    if (ThemeDefaultContent) {
      ThemeDefaultContent.appendChild(el)
    }
  },
  componentUpdated(el, binding, vnode, prevVnode) {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
    const screenWidth = document.documentElement.clientWidth

    const { width, height } = el.getBoundingClientRect()
    const { left: targetLeft, top: targetTop, bottom: targetBottom, right: targetRight, height: targetHeight, width: targetWidth } = iconMouseOptions
    const OFFSET = 10
    const NAVBAR_HEIGHT = getNavbarHeight()

    // 默认 icon 正中间位置
    const HALF_WIDTH = width / 2
    const HALF_TARGET_WIDTH = targetWidth / 2
    const TOP = height // + OFFSET
    const LEFT = HALF_TARGET_WIDTH - HALF_WIDTH

    const DEFAULT_TOP = targetTop + scrollTop
    const DEFAULT_LEFT = targetLeft + scrollLeft

    let currentTop = DEFAULT_TOP - TOP
    let currentLeft = DEFAULT_LEFT + LEFT

    if (targetTop - NAVBAR_HEIGHT - TOP - OFFSET > 0) {
      // 上方空间够
      currentTop = currentTop - OFFSET
    } else {
      // 上方空间不够
      currentTop = currentTop + (height + targetHeight) + OFFSET
    }

    const RIGHT_OFFSET = (screenWidth - (targetLeft + HALF_TARGET_WIDTH)) - HALF_WIDTH
    // const LEFT_OFFSET = (screenWidth - targetLeft - HALF_TARGET_WIDTH) - HALF_WIDTH

    if (RIGHT_OFFSET < 0) {
      // 右侧空间不够
      currentLeft = screenWidth - width
    }
    el.style.top = `${currentTop < 0 ? 0 : currentTop}px`
    el.style.left = `${currentLeft < 0 ? 0 : currentLeft}px`
  }
}
</script>

<template>
  <div class="popover-container">
    <span class="info" :class="{ 'info-hover': infoHover }" @mouseenter="iconMouseEnter" @mouseleave="iconMouseLeave">
      <slot name="icon"></slot>
      <svg v-if="!slots.icon" t="1715917545486" class="icon" viewBox="0 0 1024 1024" version="1.1"
        xmlns="http://www.w3.org/2000/svg" p-id="10306" fill="#2c3e50">
        <path
          d="M512 958.016C266.08 958.016 65.984 757.952 65.984 512 65.984 266.08 266.08 65.984 512 65.984c245.952 0 446.016 200.064 446.016 446.016 0 245.952-200.064 446.016-446.016 446.016z m0-828.032c-210.656 0-382.016 171.36-382.016 382.016 0 210.624 171.36 382.016 382.016 382.016 210.624 0 382.016-171.36 382.016-382.016S722.624 129.984 512 129.984z"
          p-id="10307"></path>
        <path
          d="M464 304a1.5 1.5 0 1 0 96 0 1.5 1.5 0 1 0-96 0zM512 768c-17.664 0-32-14.304-32-32V448c0-17.664 14.336-32 32-32s32 14.336 32 32v288c0 17.696-14.336 32-32 32z"
          p-id="10308"></path>
      </svg>
    </span>
    <transition name="fade-in">
      <div class="popover-content-container" v-show="infoHover" v-popover>
        <slot></slot>
      </div>
    </transition>
  </div>

</template>

<style lang="stylus" scoped>
.popover-container {
  position: relative;

  .info {
    user-select: none;
    display: inline-block;
    cursor: pointer;
    width: 20px;
    height: 20px;
    padding: 5px;
    border-radius: 5px;
  }

  .info-hover {
    background-color: #f0f0f0;
  }
}

.popover-content-container {
  position: absolute;
  background-color: #fff;
  z-index: 1;
  border-radius: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: opacity .1s cubic-bezier(0.57, 0.85, 0.85, 0.57);
  box-sizing: border-box;
  padding: 10px;

  &.show {
    opacity: 1;
  }
}

.fade-in-enter-active,.fade-in-leave-active {
    transition: all .1s cubic-bezier(.55,0,.1,1)
}

.fade-in-enter,.fade-in-leave-active {
    opacity: 0
}

</style>
