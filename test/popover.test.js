const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const Vue = require('vue')
const compiler = require('vue/compiler-sfc')

const filename = path.join(__dirname, '../global-components/Popover.vue')
const descriptor = compiler.parse({ source: fs.readFileSync(filename, 'utf8'), filename })
const script = compiler.compileScript(descriptor, { id: 'Popover' })
const body = script.content
  .replace(/import\s+\{([^}]+)\}\s+from 'vue'/g, 'const {$1} = require("vue")')
  .replace("import { usePopoverDirective } from '../util'", 'const usePopoverDirective = () => ({ mouseEnter() {}, directive: {} })')
  .replace('export default', 'return')
const component = new Function('require', body)(require)
const template = compiler.compileTemplate({ source: descriptor.template.content, filename, bindings: script.bindings })
assert.deepEqual(template.errors, [])
Object.assign(component, new Function(`${template.code}; return { render, staticRenderFns }`)())

function mount() {
  const events = []
  const vm = new Vue({ ...component, scopedSlots: { reference: () => [] } })
  vm.$on('show', () => events.push('show'))
  vm.$on('hide', () => events.push('hide'))
  const content = vm._render().children.find(node => node.componentOptions)?.componentOptions.children
    .find(node => node.data?.staticClass === 'popover-content-wrapper')
  assert.ok(content?.data.on.mouseenter)
  assert.ok(content?.data.on.mouseleave)
  return { vm, events, content }
}

const waitForClose = () => new Promise(resolve => setTimeout(resolve, 220))

test('entering the floating content cancels closing and leaving it closes the popover', async () => {
  const { vm, events, content } = mount()
  try {
    vm._setupState.wrapperMouseEnter({})
    vm._setupState.mouseLeave()
    assert.equal(vm._setupState.infoHover.value, true)
    assert.deepEqual(events, ['show'])
    content.data.on.mouseenter()
    await waitForClose()
    assert.equal(vm._setupState.infoHover.value, true)
    assert.ok(!events.includes('hide'))
    content.data.on.mouseleave()
    await waitForClose()
    assert.equal(vm._setupState.infoHover.value, false)
    assert.equal(events.at(-1), 'hide')
  } finally { vm.$destroy() }
})

test('returning to the reference cancels closing and unmount clears pending timers', async () => {
  const { vm, events } = mount()
  try {
    vm._setupState.wrapperMouseEnter({})
    vm._setupState.mouseLeave()
    vm._setupState.wrapperMouseEnter({})
    await waitForClose()
    assert.equal(vm._setupState.infoHover.value, true)
    assert.ok(!events.includes('hide'))
    vm._setupState.mouseLeave()
    vm.$destroy()
    await waitForClose()
    assert.ok(!events.includes('hide'))
  } finally { vm.$destroy() }
})
