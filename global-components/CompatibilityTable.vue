<script setup>
import Popover from './Popover.vue'

const props = defineProps({
  table: String
})

/** @type {MdTableOptions} */
const TABLE_OPTIONS = JSON.parse(props.table.replace(/\\/g, ''))
const iconWidth = '22'

const resolveTableCelContent = (content) => {
  if (/~~.+~~/.test(content)) {
    return `<s>${content}</s>`
  }
  return content
}

const SUPPORTED = 'SUPPORTED'
const NOT_SUPPORTED = 'NOT_SUPPORTED'
const PARTIALLY_SUPPORTED = 'PARTIALLY_SUPPORTED'

let status = PARTIALLY_SUPPORTED

// 不会同时出现都是 - 的情况
if (typeof TABLE_OPTIONS.rows === 'object') {
  let hasDefaultTag = false
  let hasNotSupportedTag = false
  let hasSupportedTag = false
  TABLE_OPTIONS.rows[0].forEach(cel => {
    if (cel === '-') {
      hasDefaultTag = true
    } else if (cel === 'x') {
      hasNotSupportedTag = true
    } else {
      hasSupportedTag = true
    }
  })

  if (!hasDefaultTag && !hasNotSupportedTag && hasSupportedTag) {
    status = SUPPORTED
  } else if (!hasDefaultTag && hasNotSupportedTag && !hasSupportedTag) {
    status = NOT_SUPPORTED
  } else {
    status = PARTIALLY_SUPPORTED
  }
}
</script>

<template>
  <Popover>
    <template #reference>
      <svg v-if="status === SUPPORTED" :width="iconWidth" :height="iconWidth" t="1716284589535" class="icon" viewBox="0 0 1024 1024"
        version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6703" fill="#0B6316">
        <path d="M384 691.2L204.8 512l-59.744 59.744L384 810.656l512-512-59.744-59.712L384 691.2z" p-id="6704"></path>
      </svg>
      <svg v-if="status === PARTIALLY_SUPPORTED" :width="iconWidth" :height="iconWidth" t="1716284768743" class="icon"
        viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7063" fill="#4D5702">
        <path
          d="M941.82716 685.195062L733.234568 476.602469l111.249383-111.249383 3.792592-3.792592 93.550617-93.550617c15.17037-15.17037 15.17037-41.718519 0-56.888889l-1.264197-1.264198c-15.17037-15.17037-41.718519-15.17037-56.888889 0L675.081481 418.449383 466.488889 209.85679c-15.17037-15.17037-41.718519-15.17037-56.888889 0l-1.264198 1.264198c-7.585185 7.585185-11.377778 17.698765-12.641975 27.812345s3.792593 20.22716 11.377778 29.076544l208.592593 208.592592-207.328396 208.592593c-1.264198 1.264198-3.792593 3.792593-5.05679 6.320987L366.617284 728.177778 140.325926 499.358025c-16.434568-16.434568-41.718519-16.434568-58.153086 0-16.434568 16.434568-16.434568 41.718519 0 58.153086l255.367901 255.367901c7.585185 7.585185 18.962963 11.377778 29.076543 11.377778 10.11358 0 21.491358-3.792593 29.076543-11.377778l278.123457-278.123456 208.592593 208.592592c15.17037 15.17037 41.718519 15.17037 56.888888 0l1.264198-1.264197c16.434568-16.434568 16.434568-41.718519 1.264197-56.888889z"
          p-id="7064"></path>
      </svg>
      <svg v-if="status === NOT_SUPPORTED" :width="iconWidth" :height="iconWidth" t="1716284801363" class="icon" viewBox="0 0 1024 1024"
        version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7267" fill="#86261A">
        <path
          d="M810.688 273.472l-60.16-60.16L512 451.84 273.472 213.312l-60.16 60.16L451.84 512l-238.528 238.464 60.16 60.16L512 572.16l238.528 238.464 60.16-60.16L572.16 512l238.528-238.528z"
          p-id="7268"></path>
      </svg>
    </template>
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
