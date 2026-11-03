<template>
  <div class="banmanagement-container">
    <!-- 顶部导航条：左侧展示入口，切换后渲染对应页面 -->
    <el-tabs v-model="activeTab" class="banmanagement-nav">
      <el-tab-pane label="用户申诉" name="complain" />
      <el-tab-pane label="封禁记录" name="record" />
    </el-tabs>

    <div class="banmanagement-content">
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from "vue";
import Complain from "./components/Complain.vue";
import Record from "./components/Record.vue";

defineOptions({
  name: "BanManagement"
});

type TabName = "complain" | "record";

/** 当前选中的导航项，默认展示第一个「用户申诉」 */
const activeTab = ref<TabName>("complain");

/** 导航项与页面组件的映射：markRaw 避免组件被响应式代理，减少无谓开销 */
const tabComponents = {
  complain: markRaw(Complain),
  record: markRaw(Record)
};

/** 动态组件：导航项变化时自动切换页面 */
const currentComponent = computed(() => tabComponents[activeTab.value]);
</script>

<style lang="scss" scoped>
.banmanagement-container {
  width: 100%;
  height: 100%;

  /* 与其他页面保持一致的左右留白 */
  .banmanagement-nav {
    width: 95%;

    :deep(.el-tabs__header) {
      margin-bottom: 15px;
    }
  }

  .banmanagement-content {
    width: 100%;
  }
}
</style>
