<script setup>
import { reactive, computed, ref } from 'vue';
import searchPageConfig from '@theme-config/searchPage';
import LikeButton from './LikeButton.vue';
import { sendFeedback } from '../utils/aiUtils';
import { AI_UPDATE_FEEDBACK_URL } from '../constants';
import { usePopoverDirective } from '../../../util'

const { aiUpdateFeedbackUrl = AI_UPDATE_FEEDBACK_URL, } = searchPageConfig;
const reasons = [
  { label: '字数太长' },
  { label: '常识错误' },
  { label: '与提问不符' },
  { label: '产品体验差' }
];
const { mouseEnter, directive: vPopover } = usePopoverDirective('#search-container')

const props = defineProps({
  uni_ai_feedback_id: {
    type: String,
    default: ''
  },
  like: {
    type: Boolean,
    default: false
  },
  dislike: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['action'])

const status = reactive({
  like: props.like,
  dislike: props.dislike
})
const selectedReasons = ref([]);
const comment = ref('');
const aiFeedbackVisible = ref(false);
const feedbackStatus = computed(() => {
  if (!status.dislike && !status.like) {
    return ''
  }
  if (status.like) {
    return true
  } else {
    return false
  }
})
const lastStatus = reactive({
  like: false,
  dislike: false
})

function setLastStatus() {
  lastStatus.like = status.like;
  lastStatus.dislike = status.dislike;
}
function resetStatus() {
  status.like = lastStatus.like;
  status.dislike = lastStatus.dislike;
}
function feedback() {
  sendFeedback(aiUpdateFeedbackUrl, {
    uni_ai_feedback_id: props.uni_ai_feedback_id,
    comment: `${selectedReasons.value.join(';')} ${comment.value}`.trim(),
    status: feedbackStatus.value
  })
    .then((response) => {
      emit('action', status)
      if (!response) {
        resetStatus()
      }
    })
    .catch(() => {
      resetStatus()
    })
}

function like() {
  if (props.uni_ai_feedback_id) {
    setLastStatus()
    status.like = !status.like;
    if (status.like) {
      status.dislike = false;
    }
    feedback()
  }
}

function dislike() {
  if (props.uni_ai_feedback_id) {
    setLastStatus()
    status.dislike = !status.dislike;
    aiFeedbackVisible.value = status.dislike
    if (status.dislike) {
      status.like = false;
    }
    feedback()
  }
}

function toggleReason(text) {
  const index = selectedReasons.value.indexOf(text);
  if (index > -1) {
    selectedReasons.value.splice(index, 1);
  } else {
    selectedReasons.value.push(text);
  }
}

function closeComment() {
  selectedReasons.value = [];
  comment.value = '';
  aiFeedbackVisible.value = false
}
function sendComment() {
  feedback()
  if (aiFeedbackVisible.value) {
    selectedReasons.value = [];
    comment.value = '';
    aiFeedbackVisible.value = false;
  }
}
</script>

<template>
  <div style="display: flex;">
    <LikeButton :active="status.like" type="like" @click.stop="like" />
    <div class="dislike_container" @mouseenter="mouseEnter">
      <LikeButton :active="status.dislike" type="dislike" @click="dislike" />

      <div class="ai-feedback" v-show="aiFeedbackVisible" v-popover>
        <div class="ai-feedback-header">进一步反馈</div>

        <div class="tags">
          <div v-for="item in reasons" :key="item.label" class="tag"
            :class="{ active: selectedReasons.includes(item.label) }" @click="toggleReason(item.label)">
            {{ item.label }}
          </div>
        </div>

        <textarea v-model="comment" class="feedback-input" placeholder="具体原因和建议"></textarea>

        <div class="footer">
          <button class="btn cancel" @click="closeComment">关闭</button>
          <button class="btn submit" @click="sendComment">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.ai-feedback
  position absolute
  width 300px
  background #fff
  border-radius 14px
  padding 18px
  box-shadow 0 8px 28px rgba(0,0,0,0.12)
  border 1px solid rgba(0,0,0,0.06)
  animation fadeIn .2s ease
  box-sizing border-box

.ai-feedback-header
  font-size 16px
  font-weight 600
  margin-bottom 14px
  color #222

.tags
  width 100%
  display flex
  flex-wrap wrap
  justify-content space-between

.tag
  width calc(50% - 8px)
  background #f2f3f5
  border-radius 8px
  padding 8px 0
  margin-bottom 8px
  text-align center
  font-size 14px
  color #444
  cursor pointer
  transition all .2s ease

.tag.active
  background $accentColor
  color #fff

.feedback-input
  width 100%
  box-sizing border-box
  padding 10px 12px
  border 1px solid #e5e5e5
  border-radius 10px
  font-size 14px
  color #333
  min-height 60px
  resize none
  transition border .2s
  outline none

  &:focus
    border 1px solid $accentColor

.footer
  display flex
  justify-content flex-end
  margin-top 8px

.btn
  padding 8px 16px
  border-radius 8px
  font-size 14px
  border none
  cursor pointer
  transition background .2s

.cancel
  background #f2f3f5
  color #333

.cancel:hover
  background #e5e6e7

.submit
  margin-left 8px
  background rgba($accentColor, .9)
  color #fff

.submit:hover
  background $accentColor

@keyframes fadeIn
  from
    opacity 0
    transform translateY(-4px)
  to
    opacity 1
    transform translateY(0)
</style>