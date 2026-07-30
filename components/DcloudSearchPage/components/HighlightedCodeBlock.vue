<template>
  <pre class="stream-code-block"><code :class="codeClass" v-html="highlightedCode" /></pre>
</template>

<script>
import hljs from 'highlight.js';
import 'highlight.js/styles/github.min.css';

const languageAliases = {
  vue: 'xml',
  uvue: 'xml',
  html: 'xml',
  md: 'markdown',
  rb: 'ruby',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  yml: 'yaml',
  styl: 'stylus',
  kt: 'kotlin',
  rs: 'rust',
  uts: 'typescript',
  json5: 'json'
};

function escapeHtml(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  name: 'HighlightedCodeBlock',

  props: {
    node: {
      type: Object,
      required: true
    }
  },

  computed: {
    language() {
      const language = String(this.node.language || '').toLowerCase()
      return languageAliases[language] || language
    },

    codeClass() {
      return this.language ? ['hljs', `language-${this.language}`] : 'hljs';
    },

    highlightedCode() {
      const code = typeof this.node.code === 'string' ? this.node.code : '';
      if (!code) return '';

      // 未闭合的代码块会在每个流式分片更新，避免高频高亮导致输入卡顿。
      if (this.node.loading) return escapeHtml(code);

      if (this.language && hljs.getLanguage(this.language)) {
        return hljs.highlight(code, { language: this.language }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  }
}
</script>

<style lang="stylus">
.stream-code-block
  overflow auto
  margin 12px 0
  border-radius 6px

  code.hljs
    display block
    padding 10px 12px

.dark .stream-code-block
  code.hljs
    color #c9d1d9
    background #0d1117

  .hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_
    color #ff7b72

  .hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_
    color #d2a8ff

  .hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id, .hljs-variable
    color #79c0ff

  .hljs-meta .hljs-string, .hljs-regexp, .hljs-string
    color #a5d6ff

  .hljs-built_in, .hljs-symbol
    color #ffa657

  .hljs-code, .hljs-comment, .hljs-formula
    color #8b949e

  .hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag
    color #7ee787

  .hljs-subst, .hljs-emphasis, .hljs-strong
    color #c9d1d9

  .hljs-section
    color #1f6feb

  .hljs-bullet
    color #f2cc60

  .hljs-addition
    color #aff5b4
    background-color #033a16

  .hljs-deletion
    color #ffdcd7
    background-color #67060c
</style>
