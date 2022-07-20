export default {
  data() {
    return {
      paddingLeftOffset: 1,
      pageHeaders: []
    }
  },
  computed: {
    visible() {
      return (
        this.$frontmatter &&
        this.$frontmatter.toc !== false &&
        !!(this.$page && this.$page.headers && this.$page.headers.length)
      );
    },
  },
  methods: {
    createPaddingLeft(level) {
      return level - this.paddingLeftOffset + 'rem';
    },
  },
  watch: {
    "$page.headers": {
      immediate: true,
      handler() {
        if(this.$options.name === 'Layout') return
        this.pageHeaders = (this.$page.headers || []).filter(item => item.level > 1)
        if ((this.pageHeaders || []).length) {
          this.paddingLeftOffset = this.pageHeaders
            .map(item => item.level)
            .sort((a, b) => a - b)[0];
        }
      }
    }
  }
}