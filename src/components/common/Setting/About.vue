<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import { NSpin } from 'naive-ui'
import pkg from '../../../../package.json'
import { fetchChatConfig ,getLastVersion} from '@/api'
import { useAuthStore } from '@/store'
import { gptUsage  } from "@/api";
import { getStorageItem, setStorageItem } from '@/utils/storage'

interface ConfigState {
  timeoutMs?: number
  reverseProxy?: string
  apiModel?: string
  socksProxy?: string
  httpsProxy?: string
  usage?: string
  remaining?: string
  hard_limit_usd?: string
}

const authStore = useAuthStore()

const loading = ref(false)

const config = ref<ConfigState>()
const st = ref({lastVersion:''})

const isChatGPTAPI = computed<boolean>(() => !!authStore.isChatGPTAPI)

async function fetchConfig() {
  try {
    loading.value = true
    // const { data } = await fetchChatConfig<ConfigState>()
    // config.value = data


    const dd= await gptUsage();
    config.value= {usage:dd.usage?`${dd.usage}`:'-'
      ,remaining:dd.remaining?`${dd.remaining}`:'-'
      ,hard_limit_usd:dd.hard_limit_usd?`${dd.hard_limit_usd}`:'-'
      , "apiModel": "ChatGPTAPI",
        "reverseProxy": "-",
        "timeoutMs": 100000,
        "socksProxy": "-",
        "httpsProxy": "-", } ;

  }
  finally {
    loading.value = false
  }
}
const getLastFrom= ()=>{
  const str = getStorageItem('lastVersion');
  if(!str) return '';
  try {
    const obj = JSON.parse(str);
    if( Date.now()- obj.t>1000*60*60 ){
      return '';
    }
    return obj.v;
  } catch (error) {
    return '';
  }
}
onMounted( () => {
  fetchConfig();

  let t = getLastFrom();
  if(t){
     st.value.lastVersion = t ;
  }else {
    getLastVersion().then(res=>{
      if(  res[0] && res[0].name ){
        st.value.lastVersion = res[0].name;
        setStorageItem('lastVersion',JSON.stringify( {v:  res[0].name,t: Date.now() } ))
      }
    });
  }
})
const  isShow = computed(()=>{
  return st.value.lastVersion && st.value.lastVersion != `v${pkg.version}`
});
</script>

<template>
  <NSpin :show="loading">
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-bold">
        Version - {{ pkg.version }}
        <a class="text-red-500" href="https://github.com/Dooy/chatgpt-web-midjourney-proxy" target="_blank" v-if=" isShow  "> ({{ $t('mj.findVersion') }} {{ st.lastVersion }})</a>
        <a class="text-gray-500" href="https://github.com/Dooy/chatgpt-web-midjourney-proxy" target="_blank" v-else-if="st.lastVersion"> ({{ $t('mj.yesLastVersion') }})</a>
      </h2>
      <div class="p-2 space-y-2 rounded-md bg-neutral-100 dark:bg-neutral-700">
      </div>
      <p>{{ $t("setting.api") }}：{{ config?.apiModel ?? '-' }}</p>
      <p v-if="isChatGPTAPI" class=" flex items-center justify-between">
        <div>
        {{ $t("setting.monthlyUsage") }}：{{ config?.usage ?? '-' }}
        </div>
        <div>
        {{ $t("mj.totalUsage") }}：{{ config?.hard_limit_usd ?(+config?.hard_limit_usd).toFixed(2): '-' }}
        </div>
        <div>
        {{ $t("setting.balance") }}：{{ config?.remaining ?? '-' }}
        </div>
      </p>
      <p v-if="!isChatGPTAPI">
        {{ $t("setting.reverseProxy") }}：{{ config?.reverseProxy ?? '-' }}
      </p>

      <!-- <p>{{ $t("setting.timeout") }}：{{ config?.timeoutMs ?? '-' }}</p>  -->
      <!-- <p>{{ $t("setting.socks") }}：{{ config?.socksProxy ?? '-' }}</p>
      <p>{{ $t("setting.httpsProxy") }}：{{ config?.httpsProxy ?? '-' }}</p> -->
    </div>
  </NSpin>
</template>
