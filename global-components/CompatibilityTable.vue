<script setup>
import Popover from './Popover.vue'

const props = defineProps({
  table: String
})

/** @type {MdTableOptions} */
const TABLE_OPTIONS = JSON.parse(props.table.replace(/\\/g, ''))

const resolveTableCelContent = (content) => {
  if (/~~.+~~/.test(content)) {
    return `<s>${content}</s>`
  }
  return content
}
</script>

<template>
  <Popover>
    <table>
      <thead>
        <tr>
          <th v-for="header in TABLE_OPTIONS.headers" :style="header.align ? { textAlign: header.align } : ''"
            :key="header.title">
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in TABLE_OPTIONS.rows">
          <td v-for="(cel, celIndex) in row" :key="celIndex"
            :style="TABLE_OPTIONS.headers[rowIndex].align ? { textAlign: TABLE_OPTIONS.headers[rowIndex].align } : ''">
            <span v-html="resolveTableCelContent(cel)" />
          </td>
        </tr>
      </tbody>
    </table>
  </Popover>
</template>

<style lang="stylus" scoped>
table {
  margin: 0;
}
</style>
