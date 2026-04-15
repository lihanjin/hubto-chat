import { createApp } from 'vue'
import App from './App.vue'
import { setupI18n } from './locales'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'
import { gptServerStore, type gptServerType } from './store/homeStore'
import { readUrlApiConfig } from './utils/urlApiConfig'

const DEFAULT_API_BASE_URL = 'http://admin.hubto.ai'
const LEGACY_API_HOSTS = [
  'https://alltoken.co',
  'http://alltoken.co',
  'https://api.alltoken.co',
  'http://api.alltoken.co',
  'https://www.alltoken.co',
  'http://www.alltoken.co',
]

const normalizeApiBaseUrl = (baseUrl?: string | null) => {
  const trimmed = (baseUrl || '').trim()

  if (!trimmed)
    return DEFAULT_API_BASE_URL

  if (LEGACY_API_HOSTS.some(host => trimmed.startsWith(host)))
    return trimmed.replace(/^https?:\/\/(?:api\.|www\.)?alltoken\.co/i, DEFAULT_API_BASE_URL)

  return trimmed
}

const syncServerConfigFromPrimaryApi = (
  baseUrl?: string | null,
  apiKey?: string | null,
): Partial<gptServerType> => {
  if (gptServerStore.myData.IS_SET_SYNC === false)
    return {}

  const syncedConfig: Partial<gptServerType> = {}

  if (baseUrl) {
    Object.assign(syncedConfig, {
      MJ_SERVER: baseUrl,
      SUNO_SERVER: baseUrl,
      LUMA_SERVER: baseUrl,
      VIGGLE_SERVER: baseUrl,
      RUNWAY_SERVER: baseUrl,
      IDEO_SERVER: baseUrl,
      KLING_SERVER: baseUrl,
      PIKA_SERVER: baseUrl,
      PIXVERSE_SERVER: baseUrl,
      UDIO_SERVER: baseUrl,
      RIFF_SERVER: baseUrl,
    })
  }

  if (apiKey) {
    Object.assign(syncedConfig, {
      MJ_API_SECRET: apiKey,
      SUNO_KEY: apiKey,
      LUMA_KEY: apiKey,
      VIGGLE_KEY: apiKey,
      RUNWAY_KEY: apiKey,
      IDEO_KEY: apiKey,
      KLING_KEY: apiKey,
      PIKA_KEY: apiKey,
      PIXVERSE_KEY: apiKey,
      UDIO_KEY: apiKey,
      RIFF_KEY: apiKey,
    })
  }

  return syncedConfig
}

async function bootstrap() {
  const app = createApp(App)
  setupAssets()

  setupScrollbarStyle()

  setupStore(app)

  const urlApiConfig = readUrlApiConfig()
  const hasUrlConfig = urlApiConfig.hasConfig

  const normalizedServerConfig: Partial<gptServerType> = {
    OPENAI_API_BASE_URL: normalizeApiBaseUrl(gptServerStore.myData.OPENAI_API_BASE_URL),
    MJ_SERVER: normalizeApiBaseUrl(gptServerStore.myData.MJ_SERVER),
    SUNO_SERVER: normalizeApiBaseUrl(gptServerStore.myData.SUNO_SERVER),
    LUMA_SERVER: normalizeApiBaseUrl(gptServerStore.myData.LUMA_SERVER),
    VIGGLE_SERVER: normalizeApiBaseUrl(gptServerStore.myData.VIGGLE_SERVER),
    RUNWAY_SERVER: normalizeApiBaseUrl(gptServerStore.myData.RUNWAY_SERVER),
    IDEO_SERVER: normalizeApiBaseUrl(gptServerStore.myData.IDEO_SERVER),
    KLING_SERVER: normalizeApiBaseUrl(gptServerStore.myData.KLING_SERVER),
    PIKA_SERVER: normalizeApiBaseUrl(gptServerStore.myData.PIKA_SERVER),
    PIXVERSE_SERVER: normalizeApiBaseUrl(gptServerStore.myData.PIXVERSE_SERVER),
    UDIO_SERVER: normalizeApiBaseUrl(gptServerStore.myData.UDIO_SERVER),
    RIFF_SERVER: normalizeApiBaseUrl(gptServerStore.myData.RIFF_SERVER),
  }

  if (hasUrlConfig)
    Object.assign(gptServerStore.myData, normalizedServerConfig)
  else
    gptServerStore.setMyData(normalizedServerConfig)

  // 从 URL 参数读取配置（支持三个 API 配置）
  // 只要 URL 中携带 apikey/apiurl，就以 URL 为准，不再依赖本地缓存值。
  if (hasUrlConfig) {
    const key1 = urlApiConfig.key1
    const key2 = urlApiConfig.key2
    const key3 = urlApiConfig.key3
    const baseUrl1Raw = urlApiConfig.url1
    const baseUrl1 = normalizeApiBaseUrl(baseUrl1Raw)
    const baseUrl2Raw = urlApiConfig.url2
    const baseUrl3Raw = urlApiConfig.url3
    const hasPrimaryConfig = Boolean(key1 || baseUrl1Raw)

    const urlConfig: Partial<gptServerType> = {
      OPENAI_API_KEY: key1 || '',
      OPENAI_API_BASE_URL: baseUrl1,
      OPENAI_API_KEY2: key2 || '',
      OPENAI_API_BASE_URL2: baseUrl2Raw ? normalizeApiBaseUrl(baseUrl2Raw) : '',
      OPENAI_API_KEY3: key3 || '',
      OPENAI_API_BASE_URL3: baseUrl3Raw ? normalizeApiBaseUrl(baseUrl3Raw) : '',
      ...(hasPrimaryConfig ? syncServerConfigFromPrimaryApi(baseUrl1, key1) : {}),
    }

    // URL 参数仅用于当前会话，避免再次写入本地缓存。
    Object.assign(gptServerStore.myData, urlConfig)
  }

  setupI18n(app)

  await setupRouter(app)

  app.mount('#app')
}

bootstrap()
