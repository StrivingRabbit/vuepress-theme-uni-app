<template>
  <div class="chat-wrapper">
    <main ref="msgList" class="chat-messages" :style="{ 'padding-bottom': msgListPaddingBottom + 'px' }">
      <div class="title">
        <span>DCloud 文档 AI 助手</span>
      </div>
      <transition-group name="fade-up" tag="div">

        <div v-for="m in messages" :key="m.id" :class="['msg', m.role]">

          <div class="bubble">
            <div v-if="m.raw" class="bubble-content" v-html="m.rendered"></div>
            <div v-else-if="m.streaming" class="thinking-placeholder">
              <Skeleton />
            </div>
          </div>

          <div class="meta">
            <span class="time">{{ m.time }}</span>
            <span v-if="m.streaming" class="stream-status">{{ getDocSearchGenerationText(m, 'streaming') }}</span>
            <span v-else-if="m.stopped" class="stream-status">{{ getDocSearchGenerationText(m, 'stopped') }}</span>

            <div class="actions" v-if="m.role === 'assistant' && !m.streaming && typeof m.uni_ai_feedback_id === 'string' && m.uni_ai_feedback_id.length > 0">
              <AIFeedback :like="m.like" :dislike="m.dislike" :uni_ai_feedback_id="m.uni_ai_feedback_id" @action="data => feedbackAction(m.id, data)"/>
            </div>
          </div>

        </div>
      </transition-group>
    </main>
    <footer ref="footer" class="chat-input-bar"
      :style="{ top: !hasMessage ? '50%' : 'auto', bottom: !hasMessage ? 'auto' : '0' }">
      <div class="input-container"
        :class="{ 'not-support-backdrop-filter': notSupportBackdrop, 'error-border': inputError }">
        <form>
          <textarea ref="input" v-model="inputText" name="input-container_input" class="chat-input" required rows="1"
            :minlength="MAX_AI_ANSWER_LENGTH" placeholder="请输入内容…" @input="answerInput"
            @keydown.enter.exact.prevent="send" inputmode="text" enterkeyhint="newline" :disabled="sending"></textarea>
        </form>

        <div class="footer-toolbar" @click.self="inputBottomClick">
          <div class="footer-toolbar_left">
            <SelectPlatform :currentCategory="currentCategory" :platforms="aiPlatforms" :disabled="sending" @change="platformChange" />
          </div>
          <div class="footer-toolbar_right">
            <span v-if="inputError" class="error-tips">
              不少于 {{ MAX_AI_ANSWER_LENGTH }} 个字符且包含中文
            </span>
            <span class="tips">
              ↵ 发送 / shift + ↵ 换行
            </span>
            <button v-if="isThinking" type="button" class="stop-btn" @click="stopGeneration">
              {{ getDocSearchGenerationText(activeRequest.message, 'stop') }}
            </button>
            <button v-else type="button" class="send-btn" :disabled="sending" @click="send">
              发送
            </button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, watchEffect, onMounted, onBeforeUnmount, computed } from 'vue'
import searchPageConfig from '@theme-config/searchPage';
import { renderMarkdown } from "./markdown-loader";
import { MAX_AI_ANSWER_LENGTH, AI_CHAT_FOR_DOC_SEARCH_STREAM_URL, AI_STOP_CHAT_FOR_DOC_SEARCH_STREAM_URL } from '../constants';
import { normalizeAIClassification } from '../utils/postDcloudServer';
import { createDocSearchAIRequest, getDocSearchGenerationText } from '../utils/aiStream';
import SelectPlatform from '../components/SelectPlatform.vue';
import AIFeedback from '../components/AIFeedback.vue';
import Skeleton from '../components/Skeleton.vue';

const { aiPlatforms = [], aiChatForDocSearchStream = AI_CHAT_FOR_DOC_SEARCH_STREAM_URL, stopChatForDocSearchStream = AI_STOP_CHAT_FOR_DOC_SEARCH_STREAM_URL } = searchPageConfig;
const SESSION_KEY = '__UNIDOC_MESSAGES__';

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
const conversations = ref({})
const activeRequest = ref(null)
const requests = new Set()
let messageSequence = 0
let scrollFrame = 0

const msgList = ref(null)
const input = ref(null)
const footer = ref(null)

const hasMessage = computed(() => messages.value.length > 0)
const isThinking = computed(() => {
  const request = activeRequest.value
  return !!(request && request.message.streaming)
})
const inputError = computed(() => {
	const inputTextTrimmed = inputText.value.trim();
	if (inputTextTrimmed.length === 0) return false
	return inputTextTrimmed.length < MAX_AI_ANSWER_LENGTH || !/[\u4e00-\u9fa5]/.test(inputTextTrimmed);
})

const notSupportBackdrop = ref(false);
if (!(typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('backdrop-filter', 'blur(10px)'))) {
  // 不支持 backdrop-filter，则使用更简单的样式
  notSupportBackdrop.value = true;
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    messages: messages.value,
    conversations: conversations.value
  }));
}

onMounted(() => {
  const savedSession = sessionStorage.getItem(SESSION_KEY)
  if (savedSession) {
    try {
      const data = JSON.parse(savedSession)
      if (Array.isArray(data)) {
        messages.value = data
      } else if (data && Array.isArray(data.messages)) {
        messages.value = data.messages
        conversations.value = data.conversations || {}
      }
      messages.value.forEach(message => {
        if (typeof message.raw !== 'string') message.raw = ''
        if (message.streaming) {
          message.streaming = false
          message.stopped = true
        }
      })
      saveSession()
      scrollToBottom()
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }
})

watchEffect(() => {
  if (props.visible) {
    nextTick(() => {
      scrollToBottom()
      autoGrow()
      if (input.value) input.value.focus()
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
  if (!el) return
  el.style.height = 'auto'
  scrollToBottom()
  // 空内容和首行内容使用同一高度，避免输入后工具栏产生轻微位移。
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
  if (scrollFrame) return
  scrollFrame = scheduleFrame(() => {
    scrollFrame = 0
    const el = msgList.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function scheduleFrame(callback) {
  return typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback)
    : setTimeout(callback, 0)
}

function cancelFrame(frame) {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame)
  } else {
    clearTimeout(frame)
  }
}

function platformChange(newPlatform) {
  sendPlatform.value = newPlatform
}

function createMessageId() {
  messageSequence += 1
  return `${Date.now()}-${messageSequence}`
}

// 创建用户消息
function createUserMessage(text) {
  return {
    id: createMessageId(),
    role: 'user',
    raw: text,
    rendered: renderMarkdown(text),
    time: formatTime(),
  }
}

// 创建 AI 消息
function createAIMessage() {
  return {
    id: createMessageId(),
    role: 'assistant',
    raw: '',
    uni_ai_feedback_id: '',
    rendered: '',
    time: formatTime(),
    streaming: false,
    stopped: false,
    like: false,
    dislike: false
  }
}

// 添加消息并保存到会话
function addMessage(message) {
  messages.value.push(message)
  saveSession()
}

function renderStreamMessage(message) {
  message.rendered = renderMarkdown(message.raw)
  saveSession()
  scrollToBottom()
}

function removeMessage(message) {
  const index = messages.value.indexOf(message)
  if (index !== -1) messages.value.splice(index, 1)
  saveSession()
}

function createStreamRequest(message, platform) {
  const request = createDocSearchAIRequest({
    message,
    conversationId: conversations.value[platform] || '',
    streamUrl: aiChatForDocSearchStream,
    stopUrl: stopChatForDocSearchStream,
    isActive: request => requests.has(request),
    render: request => renderStreamMessage(request.message),
    onMetadata(request) {
      conversations.value[platform] = request.conversationId
      saveSession()
    },
    onCompleted(request) {
      if (activeRequest.value === request) sending.value = false
    },
    onError(request, error) {
      if (!request.message.raw && !request.pendingText) {
        request.message.raw = `抱歉，AI 助手出错了：${error || '未知错误'}`
      }
    },
    onFinish(request) {
      requests.delete(request)
      if (activeRequest.value === request) {
        activeRequest.value = null
        sending.value = false
      }
    }
  })
  requests.add(request)
  return request
}

function send() {
  const userText = inputText.value.trim()

  if (!userText || sending.value) return
  if (inputError.value) return

  inputText.value = ''
  answerInput()

  addMessage(createUserMessage(userText))
  const aiMessage = createAIMessage()
  aiMessage.streaming = true
  addMessage(aiMessage)
  sending.value = true

  const platform = sendPlatform.value
  const request = createStreamRequest(aiMessage, platform)
  activeRequest.value = request
  request.start({
    question: userText,
    classification: normalizeAIClassification(platform),
    conversation_id: request.conversationId
  })
}

function stopGeneration() {
  const request = activeRequest.value
  if (!request) return
  if (!request.stop()) removeMessage(request.message)
}

function stopAllGenerations() {
  Array.from(requests).forEach(request => {
    const hasContent = request.stop()
    if (!hasContent) removeMessage(request.message)
  })
}

function feedbackAction(messageId, data) {
  // 更新对应消息的反馈状态
  const msg = messages.value.find(m => m.id === messageId);
  if (msg) {
    msg.like = data.like;
    msg.dislike = data.dislike;
    saveSession()
  }
}

onMounted(() => window.addEventListener('resize', scrollToBottom))
onBeforeUnmount(() => {
  stopAllGenerations()
  if (scrollFrame) cancelFrame(scrollFrame)
  window.removeEventListener('resize', scrollToBottom)
})

defineExpose({ stopAllGenerations })
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
      background white
      border 1px solid #eee
      margin-right auto
      pre
        background #f6f8fa
    .time
      margin-left 10px

  .bubble
    display inline-block
    max-width 80%
    padding 0px 14px
    border-radius 14px
    line-height 1.5
    font-size 15px
    word-break break-word
    box-shadow 0 1px 3px rgba(0,0,0,0.08)
    & > pre
      margin-top 14px
    @extend .ai-answer-style-reset

  .thinking-placeholder
    width 260px
    max-width 100%

  .meta
    font-size 12px
    color #888
    margin-top 4px
    display flex
    align-items center

  .actions
    margin-left 20px
    display flex

  .stream-status
    margin-left 8px
    color $accentColor

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
      cursor not-allowed

  .stop-btn
    margin-left 8px
    padding 5px 10px
    border 1px solid #d94b45
    border-radius 8px
    background #fff
    color #c83d38
    font-size 14px
    cursor pointer
    transition background .2s, color .2s
    &:hover
      background #fff1f0

    &:focus-visible
      outline 2px solid rgba($accentColor, .35)
      outline-offset 2px

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

@media (max-width: 600px)
  .chat-wrapper
    .tips
      display none
</style>
