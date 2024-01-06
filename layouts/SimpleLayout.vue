<template>
    <div class="theme-container">
        <Content class="theme-default-content" />
        <PageEdit />

        <slot name="bottom" />
    </div>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue'
export default {
    name: 'SimpleLayout',
    components: {
        PageEdit,
    },
}
</script>
