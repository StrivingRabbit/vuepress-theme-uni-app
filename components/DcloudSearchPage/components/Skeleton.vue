<template>
  <div class="chat-skeleton chat-skeleton-left">
    <div class="content">
      <div class="line"></div>
      <div class="line"></div>
      <div class="line short"></div>
    </div>
  </div>
</template>

<style lang="stylus" scope>
/* Skeleton base style */
.skeleton
  background: #eee
  background-image: linear-gradient(
    90deg,
    #eee 0px,
    #f5f5f5 40px,
    #eee 80px
  )
  background-size: 200px 100%
  animation: skeleton-loading 1.4s ease-in-out infinite
  border-radius: 8px

/* 消息骨架 */
.chat-skeleton
  display: flex
  flex-direction: column
  gap: 12px
  padding: 12px 0

.chat-skeleton .line
  height: 14px
  border-radius: 6px
  @extend .skeleton

.chat-skeleton .line.short
  width: 40%

/* 左侧消息骨架（AI） */
.chat-skeleton-left
  display: flex
  flex-direction: row
  gap: 10px
  .content
    flex: 1
    display: flex
    flex-direction: column
    gap: 10px

</style>