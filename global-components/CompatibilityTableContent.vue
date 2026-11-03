<script setup>
import { computed } from 'vue'

const props = defineProps({ options: { type: Object, required: true } })
const hasGroupedHeader = computed(() => props.options.headers.some(header => header.group))
const primaryHeaders = computed(() => {
  if (!hasGroupedHeader.value) return props.options.headers
  return props.options.headers.reduce((headers, header, index, allHeaders) => {
    if (!header.group) {
      headers.push({ ...header, rowspan: 2 })
    } else if (allHeaders[index - 1] && allHeaders[index - 1].group === header.group) {
      headers[headers.length - 1].colspan++
    } else {
      headers.push({ title: header.group, href: header.href, colspan: 1 })
    }
    return headers
  }, [])
})
const secondaryHeaders = computed(() => props.options.headers
  .filter(header => header.group)
  .map(header => ({ ...header, title: header.subtitle || header.title })))
const resolveCellContent = content => typeof content === 'string'
  ? content.replace(/~~([^~]+)~~/g, '<s>$1</s>')
  : content
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="(header, index) in primaryHeaders" :key="index" :colspan="header.colspan" :rowspan="header.rowspan"
          :style="header.align ? { textAlign: header.align } : ''">
          <a v-if="header.href" :href="header.href" style="color:unset;" target="_blank" rel="noopener noreferrer">{{ header.title }}</a>
          <template v-else>{{ header.title }}</template>
        </th>
      </tr>
      <tr v-if="hasGroupedHeader">
        <th v-for="(header, index) in secondaryHeaders" :key="index"
          :style="header.align ? { textAlign: header.align } : ''">
          {{ header.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, rowIndex) in options.rows" :key="rowIndex">
        <td v-for="(cell, columnIndex) in row" :key="columnIndex"
          :style="options.headers[columnIndex].align ? { textAlign: options.headers[columnIndex].align } : ''">
          <span v-html="resolveCellContent(cell)" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  margin: 0;
}
</style>
