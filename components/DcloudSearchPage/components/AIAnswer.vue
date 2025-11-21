<template>
  <div class="ai-answer-card">
    <div class="ai-answer-header">
      <span class="ai-answer-icon">🤖</span>
      <span class="ai-answer-title">{{ item.title }}</span>
    </div>

    <div v-if="hasMessage" class="ai-answer-msg" v-html="item.msg" />
    <Skeleton v-else />

    <div class="ai-answer-footer">
      <div class="ai-answer-footer_left">
        本回答由 AI 生成，可能已过期、失效或不适用于当前情形，仅供参考
      </div>

      <div v-show="hasMessage" class="ai-answer-footer_right">
        <LikeButton :active="status.like" type="like" @click.stop="like" />
        <LikeButton :active="status.dislike" type="dislike" @click.stop="dislike" />
      </div>
    </div>
  </div>
</template>

<script setup>
import searchPageConfig from '@theme-config/searchPage';
import Skeleton from './Skeleton.vue';
import LikeButton from './LikeButton.vue';
import { computed, reactive } from 'vue';

const {
  aiChatForDocSearch = 'https://ai-assist-api.dcloud.net.cn/tbox/chatForDocSearch'
} = searchPageConfig;

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const hasMessage = computed(() => {
  return props.item.msg && props.item.msg.length > 0;
})

const status = reactive({
  like: false,
  dislike: false
})

function like() {
  console.log('like');
  status.like = !status.like;
  if (status.like) {
    status.dislike = false;
  }
}

function dislike() {
  console.log('dislike');
  status.dislike = !status.dislike;
  if (status.dislike) {
    status.like = false;
  }
}
</script>

<style lang="stylus">
.ai-answer-card
  padding 14px 16px
  margin-top 12px
  background #fff
  border-radius 12px
  border 1px solid rgba(0,0,0,0.06)
  box-shadow 0 2px 8px rgba(0,0,0,0.04)
  transition box-shadow .25s //, transform .2s
  cursor pointer

  &:hover
    box-shadow 0 4px 14px rgba(0,0,0,0.08)
    // transform translateY(-1px)

.ai-answer-header
  display flex
  align-items center
  margin-bottom 8px

.ai-answer-icon
  font-size 18px
  margin-right 6px

.ai-answer-title
  font-weight 600
  font-size 15px
  color #333

.ai-answer-msg
  font-size 14px
  line-height 1.6
  color #444
  word-break break-word
  animation fadeIn .25s ease

  /* --- reset 内容区 --- */
  pre
    margin 0
    padding 6px 8px
    border-radius 10px
    background #f6f8fa
    white-space pre-wrap
    word-break break-word

    & + pre
      margin-top 8px

  code
    white-space pre-wrap
    word-break break-word

  h1, h2, h3, h4, h5, h6, p, ul, ol, dl, figure, blockquote
    margin 0
    padding 0

  ul, ol
    list-style none

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
  justify-content space-between
  font-size 12px
  color #888

  .ai-answer-footer_right
    display flex
</style>