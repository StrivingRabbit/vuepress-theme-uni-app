export default {
  data() {
    return {
      paddingLeftOffset: 1,
    }
  },
  created() {
    if ((this.pageHeaders || []).length) {
      this.paddingLeftOffset = this.pageHeaders
        .map(item => item.level)
        .sort((a, b) => a - b)[0];
    }
  },
  computed: {
    pageHeaders() {
      return (this.$page.headers || []).filter(item => item.level > 1)
    },
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
  }
}