<template>
  <div class="chat-wrapper">
    <header class="chat-header">
      <div class="title">DCloud 文档 AI 助手</div>
      <SelectPlatform :currentCategory="currentCategory" :platforms="aiPlatforms" @change="platformChange" />
    </header>

    <main ref="msgList" class="chat-messages">
      <transition-group name="fade-up" tag="div">

        <div v-for="m in messages" :key="m.id" :class="['msg', m.role]">

          <div class="bubble" v-html="m.rendered"></div>

          <div class="meta">
            <span class="time">{{ m.time }}</span>

            <!-- <div class="actions" v-if="m.role === 'assistant'">
              <span class="icon" :class="{ active: m.like === 1 }" @click="setLike(m, 1)">
                👍
              </span>
              <span class="icon" :class="{ active: m.like === -1 }" @click="setLike(m, -1)">
                👎
              </span>
            </div> -->
          </div>

        </div>
      </transition-group>

      <Skeleton style="width: 60%" v-if="sending" />
    </main>

    <footer class="chat-input-bar">
      <div class="input-container">
        <textarea ref="input" v-model="inputText" class="chat-input" rows="1" placeholder="请输入内容…" @input="autoGrow"
          @keydown.enter.exact.prevent="send" inputmode="text" enterkeyhint="newline"></textarea>

        <button class="send-btn" :disabled="sending" @click="send">
          发送
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, watchEffect, onMounted } from 'vue'
import { renderMarkdown } from "./markdown-loader";
import SelectPlatform from './SelectPlatform.vue';
import { ajax } from '../../utils/postDcloudServer';
import searchPageConfig from '@theme-config/searchPage';
import Skeleton from '../Skeleton';

const { aiPlatforms = [], aiChatForDocSearch = 'https://ai-assist-api.dcloud.net.cn/tbox/chatForDocSearch' } = searchPageConfig;

const props = defineProps({
  currentCategory: {
    type: String,
    required: false,
    default: 'uni-app x'
  },
  visible: {
    type: Boolean,
    required: false,
    default: true
  }
})

const messages = ref([])
const inputText = ref('')
const sending = ref(false)
const sendPlatform = ref(props.currentCategory)

const msgList = ref(null)
const input = ref(null)

function setSessionMessages(value) {
  sessionStorage.setItem('__UNIDOC_MESSAGES__', JSON.stringify(value));
}

onMounted(() => {
  const savedMessages = sessionStorage.getItem('__UNIDOC_MESSAGES__')
  if (savedMessages) {
    messages.value = JSON.parse(savedMessages)
    scrollToBottom()
  }
})

watchEffect(() => {
  if (props.visible) {
    nextTick(() => {
      scrollToBottom()
      autoGrow()
      input.value.focus()
    })
  }
})

function formatTime() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function autoGrow() {
  const el = input.value
  el.style.height = 'auto'
  scrollToBottom()
  if (inputText.value.length === 0) {
    return
  }
  el.style.height = el.scrollHeight + 'px'
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

function scrollToBottom() {
  nextTick(() => {
    const el = msgList.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

async function renderHTML(raw) {
  const rendered = await renderMarkdown(raw)
  return rendered
}

function setLike(msg, val) {
  msg.like = msg.like === val ? 0 : val
}

function fakeAITyping(text, msgObj) {
  return new Promise(resolve => {
    let i = 0
    const timer = setInterval(async () => {
      if (i >= text.length) {
        clearInterval(timer)
        msgObj.raw = text
        msgObj.rendered = await renderHTML(text)
        msgObj.isTyping = false
        resolve()
        return
      }

      msgObj.raw += text[i]
      msgObj.rendered = await renderHTML(msgObj.raw)
      i++
      scrollToBottom()
    }, 25)
  })
}

function platformChange(newPlatform) {
  sendPlatform.value = newPlatform
}

// 限制只取最近 6 条消息
function getChatHistory() {
  return messages.value.slice(-6).map(m => ({
    role: m.role,
    contentType: 'text',
    content: m.raw
  }))
}

async function send() {
  if (!inputText.value.trim() || sending.value) return

  const userText = inputText.value.trim()
  inputText.value = ''
  autoGrow()

  // 用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    raw: userText,
    rendered: await renderHTML(userText),
    time: formatTime(),
    like: 0
  })
  scrollToBottom()

  sending.value = true

  let fakeReply = ''
  try {
    const res = await ajax(aiChatForDocSearch, 'POST', {
      "question": userText,
      "group_name": sendPlatform.value,
      "history": getChatHistory()
    })
    if (res.errorCode === 0) {
      fakeReply = res.chunk
    } else {
      fakeReply = `抱歉，AI 助手出错了：${res.errorMsg || '未知错误'}`
    }
  } catch (error) {
    fakeReply = `抱歉，AI 助手出错了：${error.message || '未知错误'}`
  }
  sending.value = false

  // AI 消息对象
  const aiMsg = {
    id: Date.now() + 1,
    role: 'assistant',
    raw: fakeReply,
    rendered: await renderHTML(fakeReply),
    time: formatTime(),
    isTyping: false,
    like: 0
  }

  messages.value.push(aiMsg)

  // 动态打字
  // await fakeAITyping(fakeReply, aiMsg)
  setSessionMessages(messages.value)

  scrollToBottom()
}

window.addEventListener('resize', scrollToBottom)
</script>

<style lang="stylus">
.chat-wrapper
  display flex
  flex-direction column
  height calc(100vh - 56px - 40px)
  background #f9fafb
  overflow hidden

  .chat-header
    height 56px
    display flex
    align-items center
    padding 0 16px
    background white
    border-bottom 1px solid #eee

  .title
    font-size 18px
    font-weight 600

  .chat-messages
    flex 1
    overflow-y auto
    padding 16px
    box-sizing border-box

  .msg
    display flex
    flex-direction column
    margin-bottom 14px

  .msg.user
    .bubble
      background $accentColor
      color white
      margin-left auto
      pre
        background rgba(255,255,255,.9)
    .meta
      justify-content flex-end
    .time
      margin-right 10px

  .msg.assistant
    .bubble
      max-width 80%
      background white
      border 1px solid #eee
      margin-right auto
      pre
        background #f6f8fa
    .time
      margin-left 10px

  .bubble
    display inline-block
    max-width 50%
    padding 10px 14px
    border-radius 14px
    line-height 1.5
    font-size 15px
    word-break break-word
    box-shadow 0 1px 3px rgba(0,0,0,0.08)
    pre
      margin: 0
      padding: 5px
      border-radius 10px
      & + pre
        margin-top 8px
    pre, code
      white-space: pre-wrap;    /* 允许换行 */
      word-wrap: break-word;    /* 允许长行断开 */
      word-break: break-word;
    h1, h2, h3, h4, h5, h6, p, ul, ol, dl, figure, blockquote
      margin: 0
      padding: 0
    ul, ol
      list-style: none

  .meta
    font-size 12px
    color #888
    margin-top 4px
    display flex
    align-items center

  .actions
    display flex
    gap 10px

  .icon
    cursor pointer
    opacity .5
    transition .2s
    &.active
      opacity 1
      color $accentColor

  .chat-input-bar
    padding 10px
    background white
    border-top 1px solid #eee
    display flex
    align-items flex-end
    justify-content center

  .input-container
    display flex
    align-items flex-end
    width 100%
    background #fff
    border 1px solid rgba(0,0,0,.1)
    border-radius 20px
    padding 8px 12px
    box-shadow 0 2px 8px rgba(0,0,0,.06)
    transition border-color .2s
    &:focus-within
      border-color $accentColor
      box-shadow 0 0 0 2px rgba($accentColor, .2)

  .chat-input
    flex 1
    resize none
    outline none
    border none
    padding 8px 10px
    line-height 1.5
    max-height 160px
    overflow-y auto
    font-size 15px
    transition: height 0.2s;

  .send-btn
    margin-left 8px
    padding 8px 14px
    border none
    border-radius 8px
    background $accentColor
    color white
    font-size 15px
    cursor pointer
    transition: background 0.2s, transform 0.15s;
    &:hover
      background: darken($accentColor, 10%)
    &:active
      transform: scale(0.95)
    &:disabled
      opacity .4

  /* Skeleton shimmer animation */
  @keyframes skeleton-loading
    0%
      background-position: -200px 0
    100%
      background-position: calc(200px + 100%) 0

  .fade-up-enter-active, .fade-up-leave-active
    transition all .25s ease

  .fade-up-enter
    opacity 0
    transform translateY(6px)

  &::-webkit-scrollbar
    width 6px
    height 6px

  &::-webkit-scrollbar-track
    background transparent

  &::-webkit-scrollbar-thumb
    background rgba(0,0,0,.25)
    border-radius 6px

  &::-webkit-scrollbar-thumb:hover
    background rgba(0,0,0,.35)

  /* Firefox */
  scrollbar-width thin
  scrollbar-color rgba(0,0,0,.25) transparent
</style>
