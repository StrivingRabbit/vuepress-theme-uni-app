<template>
  <div class="chat-wrapper">
    <main ref="msgList" class="chat-messages" :style="{ 'padding-bottom': msgListPaddingBottom + 'px' }">
      <div class="title">
        <span>DCloud 文档 AI 助手</span>
      </div>
      <transition-group name="fade-up" tag="div">

        <div v-for="m in messages" :key="m.id" :class="['msg', m.role]">

          <div class="bubble" v-html="m.rendered"></div>

          <div class="meta">
            <span class="time">{{ m.time }}</span>

            <!-- <div class="actions" v-if="m.role === 'assistant'">
              <LikeButton :active="!!m.like" type="like" @click.stop="like(m)" />
              <LikeButton :active="!!m.dislike" type="dislike" @click.stop="dislike(m)" />
            </div> -->
          </div>

        </div>
      </transition-group>

      <Skeleton style="width: 60%" v-if="sending" />
    </main>
    <footer ref="footer" class="chat-input-bar"
      :style="{ top: !hasMessage ? '50%' : 'auto', bottom: !hasMessage ? 'auto' : '0' }">
      <div class="input-container"
        :class="{ 'not-support-backdrop-filter': notSupportBackdrop, 'error-border': inputError }">
        <form>
          <textarea ref="input" v-model="inputText" name="input-container_input" class="chat-input" required rows="1"
            :minlength="MAX_AI_ANSWER_LENGTH" placeholder="请输入内容…" @input="answerInput"
            @keydown.enter.exact.prevent="send" inputmode="text" enterkeyhint="newline"></textarea>
        </form>

        <div class="footer-toolbar" @click.self="inputBottomClick">
          <div class="footer-toolbar_left">
            <SelectPlatform :currentCategory="currentCategory" :platforms="aiPlatforms" @change="platformChange" />
          </div>
          <div class="footer-toolbar_right">
            <span v-if="inputError" class="error-tips">
              输入内容不少于 {{ MAX_AI_ANSWER_LENGTH }} 个字符
            </span>
            <span class="tips">
              ↵ 发送 / shift + ↵ 换行
            </span>
            <button class="send-btn" :disabled="sending" @click="send">
              发送
            </button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, watchEffect, onMounted, computed } from 'vue'
import searchPageConfig from '@theme-config/searchPage';
import { renderMarkdown } from "./markdown-loader";
import { MAX_AI_ANSWER_LENGTH } from '../constants';
import { ajax } from '../utils/postDcloudServer';
import SelectPlatform from '../components/SelectPlatform.vue';
import LikeButton from '../components/LikeButton.vue';
import Skeleton from '../components/Skeleton.vue';

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
const footer = ref(null)

const hasMessage = computed(() => messages.value.length > 0)
const inputError = computed(() => {
  return inputText.value.length > 0 && inputText.value.trim().length < MAX_AI_ANSWER_LENGTH;
})

const notSupportBackdrop = ref(false);
if (!(CSS && typeof CSS.supports === 'function' && CSS.supports('backdrop-filter', 'blur(10px)'))) {
  // 不支持 backdrop-filter，则使用更简单的样式
  notSupportBackdrop.value = true;
}

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

const msgListPaddingBottom = ref(120);
function changeMsgListPadding() {
  nextTick(() => {
    const footerHeight = footer.value ? footer.value.offsetHeight : 0;
    msgListPaddingBottom.value = footerHeight + 20; // 20px 额外空间
  });
}

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
  // TODO +2 是解决在输入第一行时有滚动条的问题，需进一步优化
  el.style.height = el.scrollHeight + 2 + 'px'
}

function answerInput() {
  autoGrow()
  changeMsgListPadding()
}

function inputBottomClick() {
  nextTick(() => {
    input.value.focus()
    input.value.scrollTo({ top: input.value.scrollHeight, behavior: 'smooth' })
  })
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
  const userText = inputText.value.trim()

  if (!userText || sending.value) return
  if (inputError.value) return

  inputText.value = ''
  answerInput()

  // 用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    raw: userText,
    rendered: await renderHTML(userText),
    time: formatTime(),
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
    like: false,
    dislike: false
  }

  messages.value.push(aiMsg)

  // 动态打字
  // await fakeAITyping(fakeReply, aiMsg)
  setSessionMessages(messages.value)

  scrollToBottom()
}

function like(m) {
  console.log('like');
  m.like = !m.like;
  if (m.like) {
    m.dislike = false;
  }
}

function dislike(m) {
  console.log('dislike');
  m.dislike = !m.dislike;
  if (m.dislike) {
    m.like = false;
  }
}

window.addEventListener('resize', scrollToBottom)
</script>

<style lang="stylus">
@import '../ai-answer-style-reset.styl'

.__backdrop-filter__
  backdrop-filter blur(15px)
.__not-support-backdrop-filter__
  background-color: #fff

.chat-wrapper
  display flex
  position relative
  flex-direction column
  height calc(100vh - 56px - 40px)
  background #f9fafb
  overflow hidden

  /* .chat-header
    height 56px
    display flex
    align-items center
    padding 0 16px
    background white
    border-bottom 1px solid #eee */

  .title
    margin 30px auto
    text-align center
    font-size 30px
    font-weight 600
    color #cecece

  .chat-messages
    flex 1
    overflow-y auto
    padding 16px 16px 120px
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
    padding 0 14px
    border-radius 14px
    line-height 1.5
    font-size 15px
    word-break break-word
    box-shadow 0 1px 3px rgba(0,0,0,0.08)
    @extend .ai-answer-style-reset

  .meta
    font-size 12px
    color #888
    margin-top 4px
    display flex
    align-items center

  .actions
    margin-left 20px
    display flex

  .chat-input-bar
    padding 10px
    position absolute
    left 10px
    right 10px
    bottom 0
    display flex
    align-items flex-end
    justify-content center

  .input-container
    width 100%
    border 1px solid rgba(0,0,0,.2)
    border-radius 20px
    padding 8px 12px
    box-shadow 0 2px 10px rgba(0,0,0,.2)
    transition border-color .2s
    @extend .__backdrop-filter__
    &:focus-within
      border-color $accentColor
      box-shadow 0 0 0 2px rgba($accentColor, .2)
    &.error-border, &.error-border:focus-within
      border-color: #e00 !important;
      box-shadow 0 0 0 2px rgba(#e00, .2)
    &.not-support-backdrop-filter
      @extend .__not-support-backdrop-filter__

    .footer-toolbar
      display flex
      align-items center
      justify-content space-between
      .footer-toolbar_left, .footer-toolbar_right
        display flex
        align-items center
        justify-content center
        .error-tips
          margin-right 12px
          font-size 12px
          color #e00
        .tips
          font-size 12px
          color #888

  .chat-input
    width 100%
    box-sizing border-box
    resize none
    outline none
    border none
    padding 8px 10px
    line-height 1.2
    max-height 160px
    overflow-y auto
    font-size 15px
    transition: height 0.2s;
    background-color transparent
    -webkit-user-select: auto;
    -webkit-touch-callout: auto;
    word-break: break-word;

  .send-btn
    margin-left 8px
    padding 6px 10px
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
