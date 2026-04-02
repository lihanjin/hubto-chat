<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useMessage, NButton, NSelect, NInput, NImage } from 'naive-ui';
import { chatSetting, gptFetch, mlog, upImg } from '@/api'
import { gptConfigStore, homeStore, useChatStore } from '@/store';
import { SvgIcon } from '@/components/common';
import { t } from '@/locales';

const ms = useMessage();
const chatStore = useChatStore();
interface myFile{
    file:any
    base64:string
}
const st =ref({isGo:false,quality:'medium' }); 
const fsRef= ref() ; 
const base64Array= ref<myFile[]>([]);    
const f = ref({size:'1024x1024', prompt:'',"model": "","n": 1});
const serverModelState = ref({ loading: false, error: '', loaded: false });
const imageModels = ref<string[]>([]);
const IMAGE_GENERATION_ENDPOINT = 'image-generation';
const DEFAULT_IMAGE_MODEL = 'minimax-image-01';
const IMAGE_MODEL_WHITELIST = ['image-01', 'minimax-image-01'];

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

const isImageModelName = (model: string) => {
    const lower = model.toLowerCase();
    if (/^image-\d+(\.\d+)?$/.test(lower))
        return true;

    return [
        'dall-e',
        'gpt-image',
        'flux',
        'banana',
        'ideogram',
        'recraft',
        'seedream',
        'imagen',
    ].some(keyword => lower.includes(keyword));
}

const hasImageGenerationCapability = (item: any) => {
    const modelId = getModelId(item);
    if (!modelId)
        return false;
    const lowerModelId = modelId.toLowerCase();

    if (lowerModelId.includes('gemini'))
        return false;

    if (
        IMAGE_MODEL_WHITELIST.includes(lowerModelId)
        || /^(minimax-)?image-\d+(\.\d+)?$/.test(lowerModelId)
    )
        return true;

    const endpointTypes = Array.isArray(item?.supported_endpoint_types)
        ? item.supported_endpoint_types
        : [];

    if (endpointTypes.length > 0)
        return endpointTypes.includes(IMAGE_GENERATION_ENDPOINT);

    return isImageModelName(modelId);
}

const modelOptions = computed(() => imageModels.value.map(model => ({ label: model, value: model })));

const getCurrentChatModel = () => {
    const uuid = Number(chatStore.active ?? 1002);
    const currentChatConfig = new chatSetting(uuid).getGptConfig();
    return currentChatConfig.model || '';
}

const syncModelWithChatSetting = () => {
    const chatModel = getCurrentChatModel();
    if (chatModel && imageModels.value.includes(chatModel)) {
        f.value.model = chatModel;
        return;
    }
    if (imageModels.value.length > 0)
        f.value.model = imageModels.value[0];
    else
        f.value.model = '';
}

const loadImageModels = async () => {
    serverModelState.value.loading = true;
    serverModelState.value.error = '';
    serverModelState.value.loaded = false;
    try {
        const modelsData = await gptFetch('/v1/models');
        const nextModels = getModelItems(modelsData)
            .filter((item: any) => hasImageGenerationCapability(item))
            .map((item: any) => getModelId(item))
            .filter((item: string) => !!item);

        imageModels.value = Array.from(new Set(nextModels)).sort((a, b) => a.localeCompare(b));

        if (imageModels.value.length === 0)
            imageModels.value = [DEFAULT_IMAGE_MODEL];

        if (nextModels.length === 0)
            serverModelState.value.error = `No image models returned from server, fallback to ${DEFAULT_IMAGE_MODEL}`;

        syncModelWithChatSetting();
    } catch (error) {
        imageModels.value = [];
        f.value.model = '';
        serverModelState.value.error = 'Loading image models failed';
        ms.error('Loading image models failed');
    } finally {
        serverModelState.value.loaded = true;
        serverModelState.value.loading = false;
    }
}

const isDisabled= computed(()=>{
    if(st.value.isGo) {
        //console.log('st.value.isGo',st.value.isGo);
        return true;
    }
    if(f.value.prompt.trim()=='') {
        //console.log('prompt',"空");
        return true;
    }
    if(!f.value.model) {
        return true;
    }
    return false;
});
const create= async ()=>{
    // const d= await gptFetch('/v1/embeddings',{
    // "input":  f.value.prompt,
    // "model": "text-embedding-ada-002"
    // });
    // mlog('test',d );
    //return ;
    let obj= {
        action:'gpt.dall-e-3',
        data:{} //f.value
    }
    obj.data= { ...f.value}
    if(isCanImageEdit.value){
        obj.data= {...obj.data ,quality:st.value.quality};
    }
    if (isCanImageEdit.value && base64Array.value.length>0){ 
         
        obj.data= {...obj.data, 'base64Array':base64Array.value,quality:st.value.quality};
        mlog("data", '我加东西了：',  base64Array.value  )
    }
    homeStore.setMyData({act:'draw', actData:obj});
    st.value.isGo=true;
}
watch(()=>homeStore.myData.act,(n)=>{
    if(n=='dallReload') {
        st.value.isGo=false;
        f.value.prompt='';
    }
    if(n=='updateChat')  st.value.isGo=false;  
})

 
const qualityOption=  computed(()=>{ 
    return [
{label:'High',value: 'high'}
,{label:'Medium',value: 'medium'}
,{label:'Low',value: 'low'}
 
]
});
const modelPlaceholder = computed(() => {
    if (serverModelState.value.loading) return 'Loading image models...';
    if (serverModelState.value.loaded && modelOptions.value.length === 0) return serverModelState.value.error || 'No image models available';
    return t('mjset.model');
});
const dimensionsList= computed(()=>{
    if(f.value.model=='dall-e-2'){
        return [{ 
                "label": "1024px*1024px",
                "value": "1024x1024"
            }, {
                "label": "512px*512px",
                "value": "512x512"
            }, {
                "label": "256px*256px",
                "value": "256x256"
            }
    ];
    } 
    if(f.value.model=='gpt-image-1'){
        return [{ 
                    "label": "1024px*1024px",
                    "value": "1024x1024"
                }, {
                    "label": "1536px*1024px",
                    "value": "1536x1024"
                }, {
                    "label": "1024px*1536px",
                    "value": "1024x1536"
                }
        ];
    }
    if(f.value.model.includes('banana')){ //auto
     return [{ 
                    "label": "auto",
                    "value": "auto"
                }, { 
                    "label": "4:3",
                    "value": "4x3"
                },{
                    "label": "3:4",
                    "value": "3x4"
                }, {
                    "label": "16:9",
                    "value": "16x9"
                }, {
                    "label": "9:16",
                    "value": "9x16"
                }, {
                    "label": "2:3",
                    "value": "2x3"
                }, {
                    "label": "3:2",
                    "value": "3x2"
                }
                , {
                    "label": "1:1",
                    "value": "1024x1024"
                }
        ];
    }
    return [{ 
                "label": "1024px*1024px",
                "value": "1024x1024"
            }, {
                "label": "1792px*1024px",
                "value": "1792x1024"
            }, {
                "label": "1024px*1792px",
                "value": "1024x1792"
            }
     ]
     
})
watch(()=>f.value.model,(n)=>{
    f.value.size='1024x1024';
})
watch(() => chatStore.active, () => {
    syncModelWithChatSetting();
})
watch(() => gptConfigStore.myData.model, () => {
    syncModelWithChatSetting();
})
const isCanImageEdit= computed(()=>{
    if(f.value.model=='dall-e-2') return true;
    if(f.value.model=='gpt-image-1') return true;
    if(f.value.model.indexOf('kontext')>-1) return true;
    if(f.value.model.indexOf('banana')>-1) return true;
    return false;
})

const selectFile=(input:any)=>{
    const ff=input.target.files[0];
    upImg(input.target.files[0]).then(d=>{
        fsRef.value.value='';
        const index = base64Array.value.findIndex(item => item.base64 == d);
        if(index>-1){
            ms.error(t('mjchat.no2add') )
            return ;
        }
        base64Array.value.push({file: ff ,base64:d});
        //if(base64Array.value.length>1) st.value.isGo=true;
        //if(st)
    }).catch(e=>ms.error(e));
}

onMounted(() => {
    loadImageModels();
})

</script>
<template>
<section class="mb-4 flex justify-between items-center"  >
     <div>{{ $t('mjset.model') }} </div>
    <n-select
      v-model:value="f.model"
      :options="modelOptions"
      :loading="serverModelState.loading"
      :placeholder="modelPlaceholder"
      filterable
      size="small"
      class="!w-[70%]"
      :clearable="false"
    />
</section>
<section class="mb-4 flex justify-between items-center"  >
     <div>{{ $t('mjchat.size') }}</div>
    <n-select v-model:value="f.size" :options="dimensionsList"  filterable tag size="small"  class="!w-[70%]" :clearable="false" />
</section>
<section class="mb-4 flex justify-between items-center" v-if="isCanImageEdit" >
     <div>Quality</div>
    <n-select v-model:value="st.quality" :options="qualityOption"  filterable tag size="small"  class="!w-[70%]" :clearable="false" />
</section>

<div class="mb-1">
     <n-input    type="textarea"  v-model:value="f.prompt"   :placeholder="$t('mjchat.prompt')" round clearable maxlength="500" show-count 
      :autosize="{   minRows:3, maxRows:10 }" />
</div>
<div class="mb-1" v-if="isCanImageEdit"> 
    <div class="flex justify-start items-center flex-wrap myblend">

    <div class="w-[var(--my-blend-img-size)] h-[var(--my-blend-img-size)] mr-2 mt-2 bg-[#ddd] overflow-hidden rounded-sm relative group " v-for="item in base64Array">
        <NImage :src="item.base64" object-fit="cover"></NImage>
        <SvgIcon icon="fluent:delete-12-filled"
        class="absolute top-0 right-0 text-red-600 text-[20px] cursor-pointer hidden group-hover:block "
        @click="base64Array.splice(base64Array.indexOf(item),1)"></SvgIcon>
    </div>

        <div   @click="fsRef.click()" v-if="base64Array.length<3"
         class="w-[var(--my-blend-img-size)] h-[var(--my-blend-img-size)] mt-2 bg-[#999] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <SvgIcon icon="mdi:add-bold" class="text-[40px] text-[#fff]"></SvgIcon>
        </div>
         
    </div>   
</div>

<div class="mb-4 flex justify-end items-center">
    <div class="flex ">
         <n-button type="primary" :block="true" :disabled="isDisabled" @click="create()"  >
            <SvgIcon icon="mingcute:send-plane-fill" />   
             {{ $t('mjchat.imgcreate') }} 
        </n-button>
    </div>
</div>

<input type="file"  @change="selectFile"  ref="fsRef" style="display: none" accept="image/jpeg, image/jpg, image/png, image/gif"/>

</template>

<style scoped>
.myblend{
    --my-blend-img-size:75px
}
</style>
