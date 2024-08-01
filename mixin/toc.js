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
    formatTitlePageHeaders() {
      return (this.pageHeaders || []).map(item => {
        return {
          ...item,
          title: this.simpleMd2html(item.title)
        }
      })
    }
  },
  methods: {
    simpleMd2html(md) {
      md = md
        .replace(/\\/g, '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/([\s\S]*)~~([\S\s]+)~~([\s\S]*)/g, '$1<del>$2</del>$3')
      return md
    },
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
