<template>
  <div v-if="hasMessage || item.streaming" class="ai-answer-card">
    <div class="ai-answer-header">
      <span class="ai-answer-icon">🤖</span>
      <span class="ai-answer-title">{{ item.title }}</span>
      <span v-if="item.streaming" class="ai-answer-status">{{ getDocSearchGenerationText(item, 'streaming') }}</span>
      <span v-else-if="item.stopped" class="ai-answer-status">{{ getDocSearchGenerationText(item, 'stopped') }}</span>
      <button v-if="item.streaming" type="button" class="ai-answer-stop" @click="$emit('stop')">
        {{ getDocSearchGenerationText(item, 'stop') }}
      </button>
    </div>

    <div v-if="hasMessage" class="ai-answer-msg">
      <div v-html="item.msg" />
    </div>
    <Skeleton v-else />

    <div class="ai-answer-footer">
      <div class="ai-answer-footer_left">
        本回答由 AI 生成，可能已过期、失效或不适用于当前情形，仅供参考
      </div>

      <div v-show="hasMessage && !item.streaming && item.uni_ai_feedback_id">
        <AIFeedback :uni_ai_feedback_id="props.item.uni_ai_feedback_id"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Skeleton from './Skeleton.vue';
import AIFeedback from './AIFeedback.vue';
import { getDocSearchGenerationText } from '../utils/aiStream';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['stop'])

const hasMessage = computed(() => {
  return props.item.msg && props.item.msg.length > 0;
})
</script>

<style lang="stylus">
@import '../ai-answer-style-reset.styl'

.ai-answer-card
  padding 14px 16px
  margin-top 12px
  background #fff
  border-radius 12px
  border 1px solid rgba(0,0,0,0.06)
  box-shadow 0 2px 8px rgba(0,0,0,0.04)
  transition box-shadow .25s //, transform .2s

  &:hover
    box-shadow 0 4px 14px rgba(0,0,0,0.08)
    // transform translateY(-1px)

.ai-answer-header
  display flex
  align-items center
  gap 6px
  flex-wrap wrap
  margin-bottom 8px

.ai-answer-icon
  font-size 18px

.ai-answer-title
  font-weight 600
  font-size 15px
  color #333

.ai-answer-status
  color $accentColor
  font-size 12px

.ai-answer-stop
  margin-left auto
  padding 4px 8px
  border 1px solid #d94b45
  border-radius 5px
  background #fff
  color #c83d38
  font-size 12px
  cursor pointer
  transition background .2s, color .2s

  &:hover
    background #fff1f0

  &:focus-visible
    outline 2px solid rgba($accentColor, .35)
    outline-offset 2px

.ai-answer-msg
  font-size 14px
  line-height 1.6
  color #444
  word-break break-word
  animation fadeIn .25s ease

  /* --- reset 内容区 --- */
  @extend .ai-answer-style-reset

@keyframes fadeIn
  from
    opacity 0
    transform translateY(4px)
  to
    opacity 1
    transform translateY(0)

.ai-answer-footer
  margin-top 12px
  padding-top 10px
  border-top 1px solid rgba(0,0,0,.06)
  display flex
  align-items center
  gap 8px
  flex-wrap wrap
  justify-content space-between
  font-size 12px
  color #888
</style>
