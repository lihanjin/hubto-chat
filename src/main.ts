import { createApp } from 'vue'
import App from './App.vue'
import { setupI18n } from './locales'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'
import { gptServerStore, type gptServerType } from './store/homeStore'

const DEFAULT_API_BASE_URL = 'http://admin.hubto.ai'
const LEGACY_API_HOSTS = [
  'https://alltoken.co',
  'http://alltoken.co',
  'https://www.alltoken.co',
  'http://www.alltoken.co',
]

const normalizeApiBaseUrl = (baseUrl?: string | null) => {
  const trimmed = (baseUrl || '').trim()

  if (!trimmed)
    return DEFAULT_API_BASE_URL

  if (LEGACY_API_HOSTS.some(host => trimmed.startsWith(host)))
    return trimmed.replace(/^https?:\/\/(www\.)?alltoken\.co/i, DEFAULT_API_BASE_URL)

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

  gptServerStore.setMyData({
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
  })

  // 从 URL 参数读取配置（支持三个API配置）
  const urlParams = new URLSearchParams(window.location.search);
  const getUrlParam = (name: string, index: number) => {
    return urlParams.get(`${name}${index}`) || urlParams.get(`${name}`);
  };

  const key1 = getUrlParam('apikey', 1);
  const key2 = getUrlParam('apikey', 2);
  const key3 = getUrlParam('apikey', 3);
  const url1 = getUrlParam('apiurl', 1);
  const url2 = getUrlParam('apiurl', 2);
  const url3 = getUrlParam('apiurl', 3);

  const urlConfig: Partial<gptServerType> = {}
  if (key1 || url1) {
    if (key1)
      urlConfig.OPENAI_API_KEY = key1
    if (url1)
      urlConfig.OPENAI_API_BASE_URL = normalizeApiBaseUrl(url1)

    Object.assign(urlConfig, syncServerConfigFromPrimaryApi(normalizeApiBaseUrl(url1), key1))
  }
  if (key2 || url2) {
    if (key2)
      urlConfig.OPENAI_API_KEY2 = key2
    if (url2)
      urlConfig.OPENAI_API_BASE_URL2 = normalizeApiBaseUrl(url2)
  }
  if (key3 || url3) {
    if (key3)
      urlConfig.OPENAI_API_KEY3 = key3
    if (url3)
      urlConfig.OPENAI_API_BASE_URL3 = normalizeApiBaseUrl(url3)
  }

  if (Object.keys(urlConfig).length > 0) {
    gptServerStore.setMyData(urlConfig)
  }

  setupI18n(app)

  await setupRouter(app)

  app.mount('#app')
}

bootstrap()
