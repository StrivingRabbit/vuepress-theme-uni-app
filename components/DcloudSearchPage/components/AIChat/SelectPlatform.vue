<script setup>
import { watch, ref } from 'vue'

const props = defineProps({
  currentCategory: {
    type: String,
    required: false,
    default: 'uni-app x'
  },
  platforms: {
    type: Array,
    required: false,
    default: () => []
  }
})

const notSupportBackdrop = ref(false);
if (!(CSS && typeof CSS.supports === 'function' && CSS.supports('backdrop-filter', 'blur(10px)'))) {
  // 不支持 backdrop-filter，则使用更简单的样式
  notSupportBackdrop.value = true;
}

const emit = defineEmits(['change'])

const platform = ref(
  props.platforms.includes(props.currentCategory)
    ? props.currentCategory
    : props.platforms[0] || ''
)

watch(platform, (v) => emit('change', v))
</script>

<template>
  <div class="select-platform">
    <select name="select" v-model="platform" :class="{ 'not-support-backdrop-filter': notSupportBackdrop }">
      <template v-for="value in props.platforms">
        <option :key="value" :value="value">{{ value }}</option>
      </template>
    </select>
  </div>
</template>

<style lang="stylus" scoped>
.select-platform

  select
    color black
    appearance none
    padding 6px 12px
    border 1px solid rgba(0,0,0,.12)
    border-radius 8px
    font-size 14px
    background-color: transparent
    cursor pointer
    outline none
    transition border .2s
    &.not-support-backdrop-filter
      background-color: #fff

    &:hover
      // border-color $accentColor
      box-shadow 0 0 10px 0px rgba($accentColor,0.3)

    &:active
      border-color $accentColor
</style>