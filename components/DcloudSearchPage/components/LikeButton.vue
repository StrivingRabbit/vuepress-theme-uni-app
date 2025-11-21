<template>
  <button class="ai-feedback-btn" :class="{ active: props.active }" @click="emit('click', $event)">
    <svg viewBox="0 0 24 24" class="icon">
      <path v-if="isLike"
        d="M2 10h4v12H2V10zm6.31 0L11 4.06a1 1 0 0 1 1-.56h.09c.87 0 1.6.63 1.74 1.49L14.8 10H21a1 1 0 0 1 1 1v1.09c0 .27-.06.53-.17.77l-3.14 6.58A2 2 0 0 1 16.85 20H10a1 1 0 0 1-1-1V10h-.69z"
        fill="currentColor" />
      <path v-if="isDislike"
        d="M22 14h-4V2h4v12zM15.69 14L13 19.94a1 1 0 0 1-.91.56H12c-.87 0-1.6-.63-1.74-1.49L9.2 14H3a1 1 0 0 1-1-1v-1.09c0-.27.06-.53.17-.77l3.14-6.58A2 2 0 0 1 7.15 4H14a1 1 0 0 1 1 1v9h.69z"
        fill="currentColor" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  type: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click']);

const isLike = computed(() => props.type === 'like');
const isDislike = computed(() => props.type === 'dislike');
</script>

<style lang="stylus" scoped>
.ai-feedback-btn
  border none
  background transparent
  cursor pointer
  padding 6px
  display flex
  align-items center
  justify-content center
  border-radius 6px
  transition background .2s, transform .2s, opacity .2s
  opacity .75

  &.active .icon
    color $accentColor
  &:hover
    opacity 1
    background rgba(0,0,0,0.06)
    transform scale(1.12)

  .icon
    width 18px
    height 18px
    display block
    color #666
</style>