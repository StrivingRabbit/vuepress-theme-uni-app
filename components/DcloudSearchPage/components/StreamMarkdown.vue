<template>
  <MarkdownRender
    :content="content"
    :custom-id="CUSTOM_ID"
    :final="final"
    :typewriter="false"
    :fade="false"
    :viewport-priority="true"
  />
</template>

<script setup>
import MarkdownRender from 'markstream-vue2';
import { setCustomComponents } from 'markstream-vue2';
import HighlightedCodeBlock from './HighlightedCodeBlock.vue';

const CUSTOM_ID = 'dcloud-search-markdown';

setCustomComponents(CUSTOM_ID, {
  code_block: HighlightedCodeBlock
});

defineProps({
  content: {
    type: String,
    default: ''
  },
  final: {
    type: Boolean,
    default: true
  }
})
</script>

<style lang="stylus">
div[data-custom-id="dcloud-search-markdown"]
  code
    &.inline
      color: $codeColor
      background-color: var(--vt-c-gray-light-5)
      border-radius: 4px
  .link-loading, .link-node
    --link-color: $accentColor !important
  .link-loading
    color: alpha($accentColor, 0.8) !important
</style>
