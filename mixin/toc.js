export default {
  computed: {
    visible() {
      return (
        this.$frontmatter &&
        this.$frontmatter.toc !== false &&
        !!(this.$page && this.$page.headers && this.$page.headers.length)
      );
    },
  }
}