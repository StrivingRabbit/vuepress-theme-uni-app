const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const source = fs.readFileSync(path.join(__dirname, '../global-components/SourceCode.vue'), 'utf8')
const options = new Function('defineComponent', 'h', 'onMounted', 'getCurrentInstance', source
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/import[^;]+;/, '')
  .replace('export default', 'return'))(value => value,
  (tag, data, children) => ({ tag, data, children }), () => {}, () => ({ proxy: { $lang: 'zh-CN' } }))

function render(metadata) {
  const heading = { tag: 'h2', data: {}, children: [{ text: 'fixture' }] }
  const nodes = metadata.map(text => ({ tag: 'blockquote', children: [{ children: [{ text }] }] }))
  return options.setup({}, { slots: { default: () => [heading, ...nodes] } })()
}
test('header actions use issues then localized source and hide GitCode', () => {
  const output = render(['GitCode: https://gitcode.com/example', 'issues: https://issues.dcloud.net.cn/?mid=fixture', '源码: https://github.com/example'])
  const actions = output.children[1].children
  assert.deepEqual(actions.filter(node => node.tag === 'a').map(node => node.children), ['issues', '源码'])
  assert.equal(actions.filter(node => node.tag === 'span').length, 1)
  assert.ok(!JSON.stringify(output).includes('gitcode.com'))
})
test('legacy GitHub label is localized and an absent action has no stray divider', () => {
  const actions = render(['GitHub: https://github.com/example']).children[1].children
  assert.equal(actions.length, 1)
  assert.equal(actions[0].children, '源码')
  assert.equal(render([]).children[1].children.length, 0)
})

test('unrelated metadata does not replace the GitHub source action', () => {
  const actions = render(['Documentation: https://example.com/docs', 'GitHub: https://github.com/example']).children[1].children
  assert.equal(actions.length, 1)
  assert.equal(actions[0].children, '源码')
  assert.equal(actions[0].data.attrs.href, 'https://github.com/example')
  assert.equal(render(['Documentation: https://example.com/docs']).children[1].children.length, 0)
})
