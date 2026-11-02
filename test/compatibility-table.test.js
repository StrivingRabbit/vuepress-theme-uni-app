const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const Vue = require('vue')
const compiler = require('vue/compiler-sfc')

function loadComponent(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name)
  if (name === 'Popover') return { name, render(h) { return h('div', [this.$scopedSlots.reference(), this.$slots.default]) } }
  const filename = path.join(__dirname, '../global-components', `${name}.vue`)
  const descriptor = compiler.parse({ source: fs.readFileSync(filename, 'utf8'), filename })
  assert.deepEqual(descriptor.errors, [])
  const script = compiler.compileScript(descriptor, { id: name })
  const body = script.content
    .replace(/import\s+\{([^}]+)\}\s+from 'vue'/g, 'const {$1} = require("vue")')
    .replace(/import\s+(\w+)\s+from '\.\/(\w+)\.vue'/g, 'const $1 = require("$2")')
    .replace('export default', 'return')
  const options = new Function('require', body)(dependency => dependency === 'vue' ? Vue : loadComponent(dependency, cache))
  const template = compiler.compileTemplate({ source: descriptor.template.content, filename, bindings: script.bindings })
  assert.deepEqual(template.errors, [])
  Object.assign(options, new Function(`${template.code}; return { render, staticRenderFns }`)())
  cache.set(name, options)
  return options
}

const Component = loadComponent('CompatibilityTable')
const Content = loadComponent('CompatibilityTableContent')
const options = {
  headers: [{ title: 'Web' }, { title: 'Android(VDOM)', group: 'Android', subtitle: 'VDOM' },
    { title: 'Android(Vapor)', group: 'Android', subtitle: 'Vapor' }],
  rows: [['4.0', 'x', '5.32']], status: 'PARTIALLY_SUPPORTED'
}
const mount = props => new Vue({ ...Component, propsData: { table: JSON.stringify(options), ...props } })

test('direct mode renders immediately with no popover, icon or lazy-render limit', () => {
  const instances = Array.from({ length: 4 }, () => mount({ mode: 'table' }))
  try {
    for (const vm of instances) {
      const root = vm._render()
      assert.equal(root.tag, 'div')
      assert.equal(root.data.staticClass, 'compatibility-table-scroll')
      assert.equal(root.children.filter(child => child.componentOptions).length, 1)
      vm._setupState.showTable()
      assert.equal(vm._setupState.renderedTableIds.value.length, 0)
    }
  } finally { instances.forEach(vm => vm.$destroy()) }
})

test('default mode remains a lazy popover and preserves the render limit', () => {
  const instances = Array.from({ length: 3 }, () => mount({}))
  try {
    assert.equal(instances[0].mode, 'popover')
    assert.equal(instances[0]._setupState.shouldRenderTable.value, false)
    instances.forEach(vm => vm._setupState.showTable())
    assert.equal(instances[0]._setupState.shouldRenderTable.value, false)
    assert.equal(instances[1]._setupState.shouldRenderTable.value, true)
    assert.equal(instances[2]._setupState.shouldRenderTable.value, true)
    assert.equal(instances[2]._render().componentOptions.Ctor.options.name, 'Popover')
  } finally { instances.forEach(vm => vm.$destroy()) }
})

test('shared content renders correct rowspan, colspan, subtitles and every cell', () => {
  const vm = new Vue({ ...Content, propsData: { options } })
  try {
    const root = vm._render()
    const thead = root.children.find(node => node.tag === 'thead')
    const headerRows = thead.children.filter(node => node.tag === 'tr')
    const primary = headerRows[0].children.filter(node => node.tag === 'th')
    assert.equal(primary[0].data.attrs.rowspan, 2)
    assert.equal(primary[1].data.attrs.colspan, 2)
    const secondary = headerRows[1].children.filter(node => node.tag === 'th')
    assert.deepEqual(secondary.map(node => node.children[0].text.trim()), ['VDOM', 'Vapor'])
    const tbody = root.children.find(node => node.tag === 'tbody')
    const cells = tbody.children.find(node => node.tag === 'tr').children.filter(node => node.tag === 'td')
    assert.equal(cells.length, 3)
    assert.equal(cells[2].children[0].data.domProps.innerHTML, '5.32')
  } finally { vm.$destroy() }
})

test('valid JSON escapes and legacy escaped payloads both remain readable', () => {
  const value = 'C:\\path "quote"\nnext'
  for (const table of [JSON.stringify({ ...options, rows: [[value]] }), JSON.stringify(options).replace(/"/g, '\\"')]) {
    const vm = mount({ mode: 'table', table })
    try {
      assert.ok(vm._setupState.TABLE_OPTIONS.value.rows.length)
      if (table.includes('path')) assert.equal(vm._setupState.TABLE_OPTIONS.value.rows[0][0], value)
    } finally { vm.$destroy() }
  }
})

test('legacy status accounts for every row rather than only the first one', () => {
  for (const [rows, expected] of [
    [[['5.32'], ['x']], 'PARTIALLY_SUPPORTED'],
    [[['x'], ['5.32']], 'PARTIALLY_SUPPORTED'],
    [[['x'], ['x']], 'NOT_SUPPORTED'],
    [[['4.0'], ['5.32']], 'SUPPORTED'],
    [[[' '], ['-']], 'PERCH'],
    [[], 'PARTIALLY_SUPPORTED']
  ]) {
    const vm = mount({ table: JSON.stringify({ headers: [{ title: 'Web' }], rows }) })
    try { assert.equal(vm._setupState.status.value, expected) }
    finally { vm.$destroy() }
  }
})

test('switching display mode clears popup registration and pending hide timers', async () => {
  const vm = mount({})
  try {
    vm._setupState.showTable()
    assert.equal(vm._setupState.shouldRenderTable.value, true)
    vm._setupState.hideTable()
    vm._props.mode = 'table'
    await Vue.nextTick()
    assert.equal(vm._setupState.shouldRenderTable.value, false)
    vm._props.mode = 'popover'
    await Vue.nextTick()
    assert.equal(vm._setupState.shouldRenderTable.value, false)
    vm._setupState.showTable()
    await new Promise(resolve => setTimeout(resolve, 220))
    assert.equal(vm._setupState.shouldRenderTable.value, true)
  } finally { vm.$destroy() }
})

test('legacy Markdown delimiter escapes are repaired without touching JSON string escapes', () => {
  const data = { headers: [{ title: 'Web' }], rows: [[String.raw`C:\folder\]file`, '"quote"\nnext']], status: 'SUPPORTED' }
  for (const depth of [1, 2, 4]) {
    const corrupted = JSON.stringify(data).replace(/"(?:\\.|[^"\\])*"|[\[\]]/g,
      part => part[0] === '"' ? part : '\\'.repeat(depth) + part)
    for (const table of [corrupted, corrupted.replace(/"/g, '\\"')]) {
      const vm = mount({ table })
      try { assert.deepEqual(vm._setupState.TABLE_OPTIONS.value, data) }
      finally { vm.$destroy() }
    }
  }
})

test('theme binds expandable-row to its own dependency and preserves plugin configuration', () => {
  const factory = require('../index')
  const expectedPath = require.resolve('vuepress-plugin-expandable-row')
  for (const [plugins, expectedOptions] of [[[], undefined], [[['expandable-row', { flag: '*' }]], { flag: '*' }], [[['vuepress-plugin-expandable-row', false]], false]]) {
    const config = factory({ plugins }, { siteConfig: {} }, {
      options: { chainWebpack: { add() {} }, extendMarkdown: { add() {} } }
    })
    const entry = config.plugins.find(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) === expectedPath)
    assert.ok(entry)
    assert.deepEqual(Array.isArray(entry) ? entry[1] : undefined, expectedOptions)
    assert.ok(path.isAbsolute(expectedPath))
    assert.ok(!config.plugins.includes('expandable-row'))
  }
})
