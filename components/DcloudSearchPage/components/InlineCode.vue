<template>
  <code class="inline stream-markdown_line-code">{{ code }}</code>
</template>
<script>
export default {
  name: 'StreamInlineCode',

  props: {
    node: {
      type: Object,
      required: true
    }
  },

  computed: {
    code() {
      return typeof this.node.code === 'string' ? this.node.code : '';
    }
  }
};
</script>
<style>
.stream-markdown_line-code {
  padding: .1rem .5rem;
}
</style>