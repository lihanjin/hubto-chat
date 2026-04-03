<script setup lang="ts">
import SvgIcon from '@/components/common/SvgIcon/index.vue'

withDefaults(defineProps<{
  icon?: string
}>(), {
  icon: 'ri:user-3-line',
})
</script>

<template>
  <div class="flex h-full w-full items-center justify-center rounded-full bg-[#eef2f6] text-[#5d6678] dark:bg-[#34373c] dark:text-[#d6dbe4]">
    <SvgIcon :icon="icon" class="h-[58%] w-[58%]" />
  </div>
</template>
