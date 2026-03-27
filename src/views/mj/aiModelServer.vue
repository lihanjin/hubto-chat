<script setup lang="ts">
//NInfiniteScroll
import {NSelect, NInput,NSlider, NButton, useMessage,NTag,NEmpty,NModal,NDivider
} from "naive-ui"
//import type { SelectRenderLabel, SelectRenderTag } from 'naive-ui'
import { ref ,computed,watch, onMounted,h} from "vue";
import { SvgIcon } from '@/components/common'
import { gptFetch, mlog } from "@/api";
import { gptServerStore } from '@/store';

const st= ref({ server:'',isShow:false,isLoadData:0 ,"search":''});
const ms= useMessage();

const emit= defineEmits(['success']);
interface modelType{
    model:string
    //maxToken:Number
}
interface modelGroup{
    name:string
    key:string[]
    data:modelType[]
    class?:string[]
    icon?:string
    isClosed?:boolean
}

const mGroup= ref<modelGroup[]>([])

const appendModels=(models:any[])=>{
    models.forEach((v:any) => {
        let is=false
        for(let a of mGroup.value){
            if(a.key.length==0 && !is){
                let model= v.id as string
                a.data.push({model})
                break;
            }
            for(let b of a.key){
                if(v.id && v.id.includes(b)){
                    let model= v.id as string
                    a.data.push({model})
                    is=true
                    break;
                }
            }
        }
    });
}

// 从 new-api 获取模型列表
const loadModelFromNewApi=async ()=>{
    try {
        const newApiUrl = gptServerStore.myData.NEW_API_URL;
        const newApiKey = gptServerStore.myData.NEW_API_KEY;
        if(!newApiUrl || !newApiKey){
            mlog('NEW_API_URL or NEW_API_KEY not configured');
            return false;
        }
        const response = await fetch(`${newApiUrl}/api/public/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${newApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const rd = await response.json();
        mlog('new api models>> ', rd);
        const modelList = Array.isArray(rd?.data?.data) ? rd.data.data : Array.isArray(rd?.data) ? rd.data : [];
        if(rd.success && modelList.length>0){
            appendModels(modelList);
            return true;
        }
        return false;
    } catch (error) {
        mlog('new api error>> ', error);
        return false;
    }
}

const loadModel=async ()=>{
    // 先尝试从 new-api 获取
    const success = await loadModelFromNewApi();
    if(success){
        st.value.isLoadData=1;
        return;
    }
    // 降级到原来的方式
    try {
         const modelsData = await gptFetch('/v1/models');
          mlog('asdsd>> ', modelsData )
        appendModels(modelsData.data || []);
        st.value.isLoadData=1
    } catch (error) {
        st.value.isLoadData=-1
        ms.error('Loading Models Error!')
    }
}

const initGroup=()=>{
    // {name:'OpenAi',key:['gpt-'],data:[]}
    // ,{name:'OpenAi O',key:['o1-','o3-'],data:[]}
    // ,{name:'Deepseek',key:['deepseek'],data:[]}
    mGroup.value.push( {name:'Deepseek',key:['deepseek'],data:[],icon:"arcticons:deepseek"} )
    mGroup.value.push({name:'OpenAi',key:['gpt-'],data:[],'icon':'ri:openai-fill'})
    mGroup.value.push( {name:'OpenAi O',key:['o1','o3'],data:[],'icon':'ri:openai-fill'} )
    mGroup.value.push( {name:'Claude',key:['claude','c-3'],data:[],icon:"ri:claude-fill"} )
    mGroup.value.push( {name:'Gemini',key:['gemini'],data:[],icon:"cbi:gemini"} )
    mGroup.value.push( {name:'Grok',key:['grok'],data:[],icon:"token:xai"} )
    mGroup.value.push( {name:'MiniMax',key:['MiniMax'],data:[],icon:"logos:minimax"} )
    mGroup.value.push( {name:'Other',key:[],data:[],isClosed:true } )
}

onMounted(()=>{
 initGroup();
 loadModel()
})

const successClick=(md:any)=> {
    emit('success', md)
    st.value.isShow=false
}

//const usageData = await gptFetch(urlUsage);
const modellist = computed(() => {
    let rz: any[]=[];
    for(let o of mGroup.value){
        if(o.data.length<=0) continue
        for(let v of o.data){
         rz.push({label:v.model,value:v.model})
        }
    }
    return rz;
});
const abc=()=>{
    //console.log('abc>> ',st.value.search)
    if(st.value.search=='') return;
    for(let o of mGroup.value){
        if(o.data.length<=0) continue
        for(let v of o.data){
         //rz.push({label:v.model,value:v.model})
         if(v.model==st.value.search) successClick( v)
        }
    }
}
</script>
<template>
<div @click="st.isShow=true">
<NTag  type="primary" round size="small" :bordered="false" class="!cursor-pointer">
            {{ $t('mj.server_load') }}  </NTag>

</div>
<NModal  v-model:show="st.isShow"  preset="card"  :title="$t('mj.model_select')" class="!max-w-[620px]" @close="st.isShow=false" >
     <NEmpty v-if="st.isLoadData==0">Loading....</NEmpty>
     <NEmpty v-else-if="st.isLoadData==-1">Loaded Fail ....</NEmpty>
     <div   class=" overflow-y-auto max-h-[400px]" v-else >
        <div>

            <n-select v-model:value="st.search" @update:value="abc" clearable :options="modellist" size="small" placeholder="search and select your model"  filterable   />

        </div>
        <div v-for="mg in mGroup">
            <template v-if="mg.data.length>0">
            <div class="  relative"  >
                <n-divider title-placement="left">
                    <div class="flex justify-start items-center space-x-2" @click="mg.isClosed=!mg.isClosed">
                        <SvgIcon :icon="mg.icon" v-if="mg.icon"/>
                        <span>{{ mg.name }} </span>
                    </div>
                </n-divider>
                <div class="absolute right-3 top-[5px] rounded-full bg-white/10 cursor-pointer " @click="mg.isClosed=!mg.isClosed" :class="{'rotate-180':mg.isClosed}">
                   <SvgIcon icon="ri:arrow-up-s-line" />
                </div>
                <div class="absolute right-10 top-[2px]"  @click="mg.isClosed=!mg.isClosed">
                    <NTag  size="small" round   :bordered="false">
                        <span class=" cursor-pointer">{{ mg.data.length }}</span>
                    </NTag>
                </div>
            </div>
            <div v-if="mg.data.length>0 && !mg.isClosed" class="grid   gap-2 grid-cols-2">
                <div v-for="md in mg.data" >
                    <!-- <template v-if="st.search=='' || md.model.includes(st.search)"></template> -->
                   <NTag type="info" size="small" round>
                     <span class="cursor-pointer" @click="successClick(md)" >{{ md.model }}</span>
                   </NTag>

                </div>
            </div>
            </template>
        </div>
     </div>
 </NModal>
</template>
