import { ss } from '@/utils/storage'
import { t } from '@/locales'
import { homeStore } from "@/store";
const LOCAL_NAME = 'userStorage'
const backgroundImage = homeStore.myData.session.backgroundImage ?? "https://t.alcy.cc/fj/"
const LEGACY_DEFAULT_AVATARS = [
  'https://raw.githubusercontent.com/Dooy/chatgpt-web-midjourney-proxy/main/src/assets/avatar.jpg',
]

export interface UserInfo {
  avatar: string
  name: string
  backgroundImage: string
  description: string
}

export interface UserState {
  userInfo: UserInfo
}

export function normalizeUserAvatar(avatar?: string): string {
  const value = avatar?.trim() ?? ''
  if (LEGACY_DEFAULT_AVATARS.includes(value))
    return ''
  return value
}

export function defaultSetting(): UserState {
  return {
    userInfo: {
      avatar: '',
      name:  t('mjset.sysname'),//'AI绘图',
      description: 'Star on <a href="https://github.com/Dooy/chatgpt-web-midjourney-proxy" class="text-blue-500" target="_blank" >GitHub</a>',
    },
  }
}

export function getLocalState(): UserState {
  const localSetting: UserState | undefined = ss.get(LOCAL_NAME)
  const defaults = defaultSetting()
  const userInfo = {
    ...defaults.userInfo,
    ...localSetting?.userInfo,
    avatar: normalizeUserAvatar(localSetting?.userInfo?.avatar),
  }
  return {
    ...defaults,
    ...localSetting,
    userInfo,
  }
}

export function setLocalState(setting: UserState): void {
  ss.set(LOCAL_NAME, {
    ...setting,
    userInfo: {
      ...setting.userInfo,
      avatar: normalizeUserAvatar(setting.userInfo.avatar),
    },
  })
}
