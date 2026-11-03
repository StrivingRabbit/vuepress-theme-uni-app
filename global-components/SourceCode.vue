<script>
import { defineComponent, h, onMounted, getCurrentInstance } from 'vue';

function vnode2h(vnode) {
  if (typeof vnode.tag === 'undefined') {
    return vnode.text
  }
  return h(vnode.tag, vnode.data, vnode.children ? vnode.children.map(vnode2h) : [])
}

export default defineComponent({
  setup(props, { slots }) {
    const { proxy } = getCurrentInstance()
    const sources = {}
    const renderVNodes = []
    slots.default()
      .forEach(vnode => {
        if (typeof vnode.tag !== 'undefined' || (typeof vnode.text !== 'undefined' && vnode.text.trim().length > 0)) {
          if (vnode.tag === 'blockquote') {
            if (vnode.children && vnode.children.length > 0) {
              const p = vnode.children[0]
              const text = p.children[0].text && p.children[0].text.trim()
              if (typeof text === 'string') {
                const match = text.match(/^\s*([^:]+):\s*(https?:\/\/\S+)$/)
                if (match) sources[match[1]] = match[2]
              }
            }
          } else {
            renderVNodes.push(vnode)
          }
        }
      })

    const H = renderVNodes[0]
    if (!H) return () => null
    H.data = H.data || {}
    if (!H.data.style) H.data.style = {}
    Object.assign(H.data.style, { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' })
    const sourceLabel = /^zh\b/i.test(proxy.$lang || '') ? '源码' : 'Source'
    const sourceKey = ['源码', 'Source', 'GitHub'].find(key => sources[key])
    const links = [
      sources.issues && { label: 'issues', url: sources.issues },
      sourceKey && { label: sourceKey === 'GitHub' ? sourceLabel : sourceKey, url: sources[sourceKey] }
    ].filter(Boolean)
    onMounted(() => {
      try {
        if (!(proxy.$title && proxy.$page.title)) {
          document.title = proxy.$page.title = `${H.children[1].text} | ${proxy.$siteTitle || ''}`.trim()
        }
      } catch (error) { }
    })
    return () => h(
      H.tag,
      H.data,
      [
        h('span', null, H.children.map(vnode2h)),
        h('span', { style: { alignSelf: 'center', fontSize: 'initial', display: 'flex', flexWrap: 'wrap' } },
          links.flatMap((link, index) => [
            ...(index ? [h('span', { attrs: { 'aria-hidden': 'true' }, style: { margin: '0 6px' } }, '|')] : []),
            h('a', {
              attrs: {
                href: link.url,
                target: '_blank',
                rel: 'noopener noreferrer',
              }
            }, link.label)])
        )
      ]
    )
  }
});
</script>
