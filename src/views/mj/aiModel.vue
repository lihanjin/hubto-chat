<script setup lang="ts">
import { NSelect, NInput, NSlider, NButton, useMessage, NTag } from "naive-ui"
import { ref, computed, watch, onMounted } from "vue";
import {gptConfigStore, homeStore,useChatStore} from '@/store'
import { gptFetch, chatSetting } from "@/api";
import { t } from '@/locales'
 

const emit = defineEmits(['close']);
const chatStore = useChatStore();
const uuid = chatStore.active;
//mlog('uuid', uuid );
const chatSet = new chatSetting( uuid==null?1002:uuid);

const nGptStore = ref(  chatSet.getGptConfig() );

const config = ref({
maxToken:16384
}); 
const st= ref({openMore:false });
const serverModels = ref<string[]>([]);
const modelLoadState = ref({ loading: false, loaded: false, error: '' });
const voiceList= computed(()=>{
    let rz=[];
    for(let o of "alloy,echo,fable,onyx,nova,shimmer".split(/[ ,]+/ig))rz.push({label:o,value:o}) 
    return rz;
});
const modellist = computed(() => { //
    return serverModels.value.map((model) => ({ label: model, value: model }));
});
const modelPlaceholder = computed(() => {
    if (modelLoadState.value.loading) return 'Loading models...';
    if (modellist.value.length === 0) return modelLoadState.value.error || 'No models available';
    return 'search and select your model';
});
const ms= useMessage();
const getModelItems = (payload: any) => {
    if (Array.isArray(payload?.data))
        return payload.data;
    if (Array.isArray(payload))
        return payload;
    return [];
}

const getModelId = (item: any) => {
    if (typeof item === 'string')
        return item.trim();

    return typeof item?.id === 'string' ? item.id.trim() : '';
}
const loadModels = async () => {
    modelLoadState.value.loading = true;
    modelLoadState.value.error = '';
    try {
        const modelsData = await gptFetch('/v1/models');
        const nextModels: string[] = getModelItems(modelsData)
            .map((item: any) => getModelId(item))
            .filter((item: string): item is string => !!item);

        serverModels.value = Array.from(new Set(nextModels)).sort((a, b) => a.localeCompare(b));
        modelLoadState.value.loaded = true;

        if (!nGptStore.value.model?.trim() && serverModels.value.length > 0)
            nGptStore.value.model = serverModels.value[0];

        if (serverModels.value.length === 0)
            modelLoadState.value.error = 'No models returned from server';
    } catch (error) {
        serverModels.value = [];
        modelLoadState.value.loaded = true;
        modelLoadState.value.error = 'Loading Models Error!';
        ms.error('Loading Models Error!');
    } finally {
        modelLoadState.value.loading = false;
    }
}

const saveChat=(type:string)=>{
     chatSet.save(  nGptStore.value );
     gptConfigStore.setMyData( nGptStore.value );
     homeStore.setMyData({act:'saveChat'}); 
     if(type!='hide')ms.success( t('common.saveSuccess'));
     emit('close');
}
 
watch(()=>nGptStore.value.model,(n)=>{
    nGptStore.value.gpts=undefined;
    let max=16384 *2;
    if( n.indexOf('gpt-3.5')>-1){
        max=4096*2;
    }else if(  n.indexOf('o1-mini')>-1){  
        max=65536 *2;
    }else if(  n.indexOf('o1-')>-1 || n=='o1' ){  
        max=65536 ;
    }else if( n=='gpt-4o-2024-08-06' || n=='chatgpt-4o-latest' || n.indexOf('gpt-4o')>-1 || n.indexOf('gpt-4.5')>-1){  
        max=16384 *2;
    }else if( n.indexOf('gpt-4')>-1 ||  n.indexOf('16k')>-1 ||  n.indexOf('o1-')>-1 ){ //['16k','8k','32k','gpt-4'].indexOf(n)>-1
        max=4096*2;
    }else if( n.toLowerCase().includes('claude-3-5')|| n.toLowerCase().includes('sonnet') 
        ||n.toLowerCase().includes('grok-3')
     ||  n.toLowerCase().includes('deepseek') ){ //deepseek
        max=4096*2*2;
    }else if( n.toLowerCase().includes('claude-3') ){
         max=4096*2;
    }

    config.value.maxToken=max/2;
    if(nGptStore.value.max_tokens> config.value.maxToken ) nGptStore.value.max_tokens= config.value.maxToken;
})

const reSet=()=>{
    gptConfigStore.setInit();
    nGptStore.value= gptConfigStore.myData;
}

onMounted(() => {
    loadModels()
});
</script>
<template>
<section class="mb-4 flex justify-between items-center"  >
    <div class=" flex space-x-2 justify-between items-center">
     <div class="flex justify-start items-center">
        <span class="text-red-500">*</span>  
        {{ $t('mjset.model') }}
        
     </div>
     
    </div>
    <div  class="!w-[70%] flex justify-end items-center " >
       <div> 
        <n-select
          v-model:value="nGptStore.model"
          :options="modellist"
          :loading="modelLoadState.loading"
          :placeholder="modelPlaceholder"
          size="small"
          filterable
        />
       </div>
       <div class=" pl-2" > 
        <NTag type="primary" round size="small" :bordered="false" class="!cursor-pointer" @click="loadModels">
          {{ $t('mj.server_load') }}
        </NTag>
       </div>
    </div>
</section>
 <section class=" flex justify-between items-center"  >
     <div> {{ $t('mjchat.historyCnt') }}
     </div>
     <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
        <div class=" w-[200px]"><n-slider v-model:value="nGptStore.talkCount" :step="1" :max="50" /></div>
        <div  class="w-[50px] text-right">{{ nGptStore.talkCount }}</div>
    </div>
</section>
<div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20">{{ $t('mjchat.historyToken') }}</div>

 <section class=" flex justify-between items-center"  >
     <div> {{ $t('mjchat.historyTCnt') }} 
     </div>
     <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
        <div class=" w-[200px]"><n-slider v-model:value="nGptStore.max_tokens" :step="1" :max="config.maxToken" :min="1" /></div>
        <div  class="w-[50px] text-right">{{ nGptStore.max_tokens }}</div>
    </div>
</section>
<div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20">{{ $t('mjchat.historyTCntInfo') }}  </div>

 <section class="mb-4"  >
    <div>{{ $t('mjchat.role') }}</div>
    <div>
     <n-input  type="textarea"  :placeholder=" $t('mjchat.rolePlaceholder') "   v-model:value="nGptStore.systemMessage" :autosize="{ minRows: 3 }"
    />
    </div>
 </section>

<template v-if="st.openMore">
    <section class=" flex justify-between items-center "  >
        <div>{{ $t('mj.temperature') }}</div>
        <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
            <div class=" w-[200px]"><n-slider v-model:value="nGptStore.temperature" :step="0.01" :max="1" /></div>
            <div  class="w-[40px] text-right">{{ nGptStore.temperature }}</div>
        </div>
    </section>
    <div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20"> {{ $t('mj.temperatureInfo') }}</div>


    <section class=" flex justify-between items-center "  >
        <div> {{ $t('mj.top_p') }}</div>
        <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
            <div class=" w-[200px]"><n-slider v-model:value="nGptStore.top_p" :step="0.01" :max="1" /></div>
            <div  class="w-[40px] text-right">{{ nGptStore.top_p }}</div>
        </div>
    </section>
    <div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20">{{ $t('mj.top_pInfo') }}</div>

    <section class=" flex justify-between items-center "  >
        <div> {{ $t('mj.presence_penalty') }}</div>
        <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
            <div class=" w-[200px]"><n-slider v-model:value="nGptStore.presence_penalty" :step="0.01" :max="1" /></div>
            <div  class="w-[40px] text-right">{{ nGptStore.presence_penalty }}</div>
        </div>
    </section>
    <div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20">{{ $t('mj.presence_penaltyInfo') }} </div>


    <section class=" flex justify-between items-center "  >
        <div>{{ $t('mj.frequency_penalty') }}</div>
        <div class=" flex justify-end items-center w-[80%] max-w-[240px]">
            <div class=" w-[200px]"><n-slider v-model:value="nGptStore.frequency_penalty" :step="0.01" :max="1" /></div>
            <div  class="w-[40px] text-right">{{ nGptStore.frequency_penalty }}</div>
        </div>
    </section>
    <div class="mb-4 text-[12px] text-gray-300 dark:text-gray-300/20">{{ $t('mj.frequency_penaltyInfo') }}</div>

    <section class="mb-4 flex justify-between items-center"  >
        <div >{{ $t('mj.tts_voice') }}</div>
        <n-select v-model:value="nGptStore.tts_voice" :options="voiceList" size="small"  class="!w-[50%]"   />
    </section>


</template>
<div v-else class="text-right cursor-pointer mb-4" @click="st.openMore=true">
    <NTag  type="primary" round size="small" :bordered="false" class="!cursor-pointer">More...</NTag>
</div>

 <section class=" text-right flex justify-end space-x-2"  >
    <NButton   @click="reSet()">{{ $t('mj.setBtBack') }}</NButton>
    <!-- <NButton type="primary" @click="saveChat">{{ $t('mj.setBtSaveChat') }}</NButton>
    <NButton type="primary" @click="save">{{ $t('mj.setBtSaveSys') }}</NButton> -->
    <NButton type="primary" @click="saveChat('no')">{{ $t('common.save') }}</NButton>
 </section>

 <!-- <NModal  v-model:show="st.isShow"  preset="card"  :title="$t('mjchat.modelChange')" class="!max-w-[820px]" @close="st.isShow=false" >
    Model内容
 </NModal> -->
</template>
