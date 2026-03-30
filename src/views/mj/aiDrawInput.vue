<script setup lang="ts">
import aiDall from './aiDall.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { SvgIcon } from '@/components/common'
import { onMounted } from 'vue';
import { gptServerStore } from '@/store';

const $emit=defineEmits(['drawSent','close']);
const {isMobile}= useBasicLayout()

onMounted(()=>{
  gptServerStore.setMyData({ DRAW_TYPE: 'dall.e' })
})

</script>
<template>
<div class="overflow-y-auto bg-[#fafbfc] pt-2 dark:bg-[#18181c] h-full ">
  <div class="px-4 pb-2 flex items-center justify-between">
    <div class="text-[16px] font-medium">
      {{ '通用生图' }}
    </div>
    <div v-if="isMobile" class="text-center flex justify-center items-center cursor-pointer" @click="$emit('close')">
      <SvgIcon icon="ri:close-circle-line"></SvgIcon>
    </div>
  </div>
  <div class="p-4 pt-2">
    <aiDall />
  </div>
</div>
</template>
