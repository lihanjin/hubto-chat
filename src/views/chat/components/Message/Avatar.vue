<script lang="ts" setup>
import { computed } from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import { isString } from '@/utils/is'
import defaultAvatar from '@/assets/avatar.jpg'
import BrandMark from '@/components/common/BrandMark.vue'

interface Props {
  image?: boolean
  logo?:string
}
defineProps<Props>()

const userStore = useUserStore()

const avatar = computed(() => userStore.userInfo.avatar)
</script>

<template>
  
   <NAvatar v-if="logo"     :src="logo" />
  <template v-else-if="image">
    <NAvatar v-if="isString(avatar) && avatar.length > 0" :src="avatar" :fallback-src="defaultAvatar" />
    <NAvatar v-else round :src="defaultAvatar" />
  </template>
  <span v-else class="flex h-full w-full items-center justify-center">
    <BrandMark />
  </span>
</template>
