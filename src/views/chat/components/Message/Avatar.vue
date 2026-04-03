<script lang="ts" setup>
import { computed } from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import BrandMark from '@/components/common/BrandMark.vue'
import UserMark from '@/components/common/UserMark.vue'
import { normalizeUserAvatar } from '@/store/modules/user/helper'

interface Props {
  image?: boolean
  logo?:string
}
defineProps<Props>()

const userStore = useUserStore()

const avatar = computed(() => normalizeUserAvatar(userStore.userInfo.avatar))
</script>

<template>
  
  <NAvatar v-if="logo"     :src="logo" />
  <template v-else-if="image">
    <NAvatar v-if="avatar.length > 0" round :src="avatar" />
    <UserMark v-else />
  </template>
  <span v-else class="flex h-full w-full items-center justify-center">
    <BrandMark />
  </span>
</template>
