import { createApp } from 'vue'
import App from './App.vue'
import { setupI18n } from './locales'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'
import { gptServerStore, type gptServerType } from './store/homeStore'

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
      urlConfig.OPENAI_API_BASE_URL = url1

    Object.assign(urlConfig, syncServerConfigFromPrimaryApi(url1, key1))
  }
  if (key2 || url2) {
    if (key2)
      urlConfig.OPENAI_API_KEY2 = key2
    if (url2)
      urlConfig.OPENAI_API_BASE_URL2 = url2
  }
  if (key3 || url3) {
    if (key3)
      urlConfig.OPENAI_API_KEY3 = key3
    if (url3)
      urlConfig.OPENAI_API_BASE_URL3 = url3
  }

  if (Object.keys(urlConfig).length > 0) {
    gptServerStore.setMyData(urlConfig)
  }

  setupI18n(app)

  await setupRouter(app)

  app.mount('#app')
}

bootstrap()
