<template>
    <div class="chartpanel-container">
        <div v-if="props.title" class="title">{{ props.title }}</div>
        <div class="table-container" :style="{height:props.height}">
            <div class="table-body" ref="chartRef"></div>
            <div v-show="!safeshow" class="status">
                <div v-if="props.loading" class="skeleton"></div>
                <span v-else-if="props.empty" class="status-text">暂无数据</span>
                <span v-else class="status-text">{{ props.error || "加载失败" }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.chartpanel-container {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
}

.title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
}

.table-container {
    position: relative;
    width: 100%;
}

.table-body {
    width: 100%;
    height: 100%;
}

.status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-bg-color);
}

.skeleton {
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
}

.status-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}
</style>

<script setup lang="ts">
import echarts from '@/plugins/echarts';
import type { EChartsOption } from "echarts";
import { ref, shallowRef, watch,onMounted,onBeforeUnmount,computed } from 'vue';
import { useResizeObserver } from '@vueuse/core';
interface Props{
    title?:string,
    option:EChartsOption,
    loading?:boolean,
    empty?:boolean,
    error?:string,
    height?:string
}
const props=withDefaults(defineProps<Props>(),{
    title:"",
    loading:false,
    empty:false,
    error:"",
    height:"300px"
})
const safeshow=computed(()=>!props.loading && !props.error && !props.empty)
const chartRef=ref<HTMLDivElement>()
const chart=shallowRef<ReturnType<typeof echarts.init>>() //图表实例

//图表渲染
function render(){
    if(!chart.value){return}
    chart.value.setOption(props.option,true)
}    
//图表初始化    
function init(){
    if(!chartRef.value || chart.value){return}
    //容器还没拿到尺寸（布局动画/隐藏挂载）时跳过，
    //交给 ResizeObserver 在第一次拿到非零尺寸时再初始化
    if(chartRef.value.clientWidth===0 || chartRef.value.clientHeight===0){return}
    chart.value=echarts.init(chartRef.value)
    render()
}
//监听option的变化，如果变了那么就render
watch(()=>props.option,render,{deep:true})
onMounted(init)
//用于当布局发生变化的时候，echarts也能跟着变
let rafId=0 //用于防止一帧可能变化多次，避免重复变化
useResizeObserver(chartRef,()=>{
    if(rafId){return}
    rafId=requestAnimationFrame(()=>{
        rafId=0
        if(!chart.value){init();return}
        chart.value.resize()
    })
})
onBeforeUnmount(()=>{
    cancelAnimationFrame(rafId)
    chart.value?.dispose()
})
</script>