<script>
import { defineComponent, h } from 'vue';

function vnode2h(vnode) {
  if (typeof vnode.tag === 'undefined') {
    return vnode.text
  }
  return h(vnode.tag, vnode.data, vnode.children ? vnode.children.map(vnode2h) : [])
}

export default defineComponent({
  setup(props, { slots }) {
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
                const [_, git, url] = text.match(/\s*(\w+):\s*(https?:\/\/\S+)$/) || []
                sources[git] = url
              }
            }
          } else {
            renderVNodes.push(vnode)
          }
        }
      })

    const H = renderVNodes[0]
    if (!H.data.style) H.data.style = {}
    Object.assign(H.data.style, { display: 'flex', justifyContent: 'space-between' })
    return () => h(
      H.tag,
      H.data,
      [
        h('span', null, H.children.map(vnode2h)),
        h('span', { style: { marginLeft: '10px', alignSelf: 'center', fontSize: 'initial' } },
          Object.keys(sources).map(git => h('a', {
            attrs: {
              href: sources[git],
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            style: { marginLeft: '5px' }
          }, git))
        )
      ]
    )
  }
});
</script>
