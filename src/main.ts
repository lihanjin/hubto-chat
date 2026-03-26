import { createApp } from 'vue'
import App from './App.vue'
import { setupI18n } from './locales'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'
import { gptServerStore } from './store/homeStore'

async function bootstrap() {
  const app = createApp(App)
  setupAssets()

  setupScrollbarStyle()

  setupStore(app)

  // 从 URL 参数读取配置
  const urlParams = new URLSearchParams(window.location.search)
  const apikey = urlParams.get('apikey')
  const apiurl = urlParams.get('apiurl')

  if (apikey || apiurl) {
    gptServerStore.setMyData({
      ...(apikey && { OPENAI_API_KEY: apikey }),
      ...(apiurl && { OPENAI_API_BASE_URL: apiurl })
    })
  }

  setupI18n(app)

  await setupRouter(app)

  app.mount('#app')
}

bootstrap()
