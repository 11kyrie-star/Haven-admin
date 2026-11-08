<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { getDashBoard, getDesApi } from "@/api/welcome";
import { buildBarOption, buildLineOption } from "./chartOptions";
import type { ChartSeriesData } from "./chartOptions";
import type { EChartsOption } from "echarts";
import KpiCard from "./components/KpiCard.vue";
import ChartPanel from "./components/ChartPanel.vue";

defineOptions({
  name: "Welcome"
});

/* ---------------- 接口数据类型（从 api 定义里推导，避免重复声明） ---------------- */
type DashboardData = Awaited<ReturnType<typeof getDashBoard>>["data"];
type DescriptionData = Awaited<ReturnType<typeof getDesApi>>["data"];

const router = useRouter();
const { nickname } = storeToRefs(useUserStoreHook());

/* ---------------- 职位描述 ---------------- */
const descLoading = ref(true);
const descData = ref<DescriptionData | null>(null);
const descError = ref("");

async function loadDescription() {
  descLoading.value = true;
  descError.value = "";
  try {
    const res = await getDesApi();
    if (res.status === 0) {
      descData.value = res.data;
    } else {
      descError.value = res.msg || "职位信息加载失败";
    }
  } catch {
    descError.value = "服务器或者网络异常";
  } finally {
    descLoading.value = false;
  }
}

/* ---------------- 首页看板 ---------------- */
const dashLoading = ref(true);
const dashData = ref<DashboardData | null>(null);
const dashError = ref("");

async function loadDashboard() {
  dashLoading.value = true;
  dashError.value = "";
  try {
    const res = await getDashBoard();
    if (res.status === 0) {
      dashData.value = res.data;
    } else {
      dashError.value = res.msg || "看板数据加载失败";
    }
  } catch {
    dashError.value = "服务器或者网络异常";
  } finally {
    dashLoading.value = false;
  }
}

onMounted(() => {
  loadDescription();
  loadDashboard();
});

/* ---------------- 问候语 ---------------- */
const greetingText = computed(() => descData.value?.greeting || "欢迎回来");
const displayName = computed(
  () => descData.value?.nickname || nickname.value || "管理员"
);

/** 职位方框的配色（Element Plus 主题色变量，自动适配明暗主题） */
const DUTY_THEMES = [
  "--el-color-primary",
  "--el-color-success",
  "--el-color-warning",
  "--el-color-danger",
  "--el-color-info"
];

function dutyStyle(index: number) {
  const theme = DUTY_THEMES[index % DUTY_THEMES.length];
  return {
    color: `var(${theme})`,
    background: `var(${theme}-light-9)`
  };
}

const WEEK_TEXT = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六"
];
const now = new Date();
const dateText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${
  WEEK_TEXT[now.getDay()]
}`;

/* ---------------- 看板配置表（按管理员等级） ----------------
   后端 /dashboard 按等级覆盖式返回 stats + trend；
   前端按 level 查表决定「哪些卡片、哪些图表、什么标题」，
   新增等级 = 加一段配置，渲染逻辑不变 */
interface KpiDef {
  key: string;
  label: string;
  unit: string;
  /** 从 stats 里取数字 */
  stat?: string;
  /** 或者把 trend 里某个序列求和作为数值（如近七天总量） */
  trendSum?: string;
  /** 卡片底部迷你折线使用的 trend 序列 */
  trendSeries?: string;
  action?: { text: string; name: string };
}

interface ChartDef {
  key: string;
  title: string;
  type: "line" | "bar";
  seriesName: string;
  /** 仅折线生效，默认主题蓝 */
  color?: string;
  /** trend 中的序列字段名 */
  series: string;
}

interface LevelBoardDef {
  kpis: KpiDef[];
  charts: ChartDef[];
}

const DASHBOARD_BY_LEVEL: Record<number, LevelBoardDef> = {
  // 一级：举报处理
  1: {
    kpis: [
      {
        key: "pending",
        label: "待处理举报",
        unit: "条",
        stat: "pending_reports",
        trendSeries: "pending_reports",
        action: { text: "去处理", name: "ReportAppending" }
      },
      {
        key: "today_new",
        label: "今日新增举报",
        unit: "条",
        stat: "today_new_reports"
      },
      {
        key: "today_handled",
        label: "今日已处理举报",
        unit: "条",
        stat: "today_handled_reports",
        action: { text: "查看记录", name: "ReportRecord" }
      },
      {
        key: "week_handled",
        label: "近七天已处理举报",
        unit: "条",
        trendSum: "handled_reports",
        trendSeries: "handled_reports"
      }
    ],
    charts: [
      {
        key: "pending",
        title: "近七天待处理举报",
        type: "line",
        color: "#409EFF",
        seriesName: "待处理举报",
        series: "pending_reports"
      },
      {
        key: "handled",
        title: "近七天举报处理量",
        type: "bar",
        seriesName: "已处理举报",
        series: "handled_reports"
      }
    ]
  },
  // 二级：下架申请审批
  2: {
    kpis: [
      {
        key: "pending",
        label: "待审批下架申请",
        unit: "条",
        stat: "pending_applications",
        trendSeries: "submitted",
        action: { text: "去审批", name: "PostExame" }
      },
      {
        key: "pending_reports",
        label: "待处理举报",
        unit: "条",
        stat: "pending_reports",
        action: { text: "去处理", name: "ReportAppending" }
      },
      {
        key: "week_new",
        label: "近七天新增申请",
        unit: "条",
        trendSum: "submitted",
        trendSeries: "submitted"
      },
      {
        key: "week_handled",
        label: "近七天已审批",
        unit: "条",
        trendSum: "handled",
        trendSeries: "handled",
        action: { text: "审批记录", name: "ExamineRecord" }
      }
    ],
    charts: [
      {
        key: "submitted",
        title: "近七天新增下架申请",
        type: "line",
        color: "#E6A23C",
        seriesName: "新增申请",
        series: "submitted"
      },
      {
        key: "handled",
        title: "近七天审批处理量",
        type: "bar",
        seriesName: "已审批申请",
        series: "handled"
      }
    ]
  },
  // 三级及以上：用户与封禁
  3: {
    kpis: [
      {
        key: "active_bans",
        label: "当前封禁用户",
        unit: "个",
        stat: "active_bans",
        trendSeries: "banned",
        action: { text: "封禁管理", name: "UserBan" }
      },
      {
        key: "pending_appeals",
        label: "待处理申诉",
        unit: "条",
        stat: "pending_appeals",
        trendSeries: "appeals"
      },
      {
        key: "week_bans",
        label: "近七天封禁操作",
        unit: "次",
        trendSum: "banned",
        trendSeries: "banned"
      },
      {
        key: "week_appeals",
        label: "近七天新增申诉",
        unit: "条",
        trendSum: "appeals",
        trendSeries: "appeals"
      }
    ],
    charts: [
      {
        key: "appeals",
        title: "近七天新增申诉",
        type: "line",
        color: "#F56C6C",
        seriesName: "新增申诉",
        series: "appeals"
      },
      {
        key: "banned",
        title: "近七天封禁操作量",
        type: "bar",
        seriesName: "封禁操作",
        series: "banned"
      }
    ]
  }
};

function trendValues(d: DashboardData, key: string): number[] {
  const series = d.trend[key];
  return Array.isArray(series) ? (series as number[]) : [];
}

/** 解析后的看板：按 level 查表 + 数据求值，模板只负责渲染 */
const board = computed(() => {
  const d = dashData.value;
  // 未设计的等级（如四级）复用三级配置，与后端 level>=3 的返回保持一致
  const level = Math.max(1, Math.min(d?.level ?? 1, 3));
  const def = DASHBOARD_BY_LEVEL[level];
  return {
    kpis: def.kpis.map(k => ({
      ...k,
      resolvedValue: !d
        ? null
        : k.stat
          ? (d.stats[k.stat] ?? null)
          : k.trendSum
            ? trendValues(d, k.trendSum).reduce((a, b) => a + b, 0)
            : null,
      resolvedTrend: d && k.trendSeries ? trendValues(d, k.trendSeries) : []
    })),
    charts: def.charts.map(c => {
      const input: ChartSeriesData = {
        dates: d?.trend.dates ?? [],
        values: d ? trendValues(d, c.series) : [],
        name: c.seriesName
      };
      const option: EChartsOption =
        c.type === "line"
          ? buildLineOption(input, c.color)
          : buildBarOption(input);
      return { ...c, option, empty: input.dates.length === 0 };
    })
  };
});

function handleCardAction(kpi: { action?: { name: string } }) {
  if (!kpi.action) return;
  router.push({ name: kpi.action.name });
}
</script>

<template>
  <div class="welcome-container">
    <!-- 问候语 + 职位描述 -->
    <section class="greet-word">
      <div v-if="descLoading" class="greet-card is-skeleton">
        <div class="skeleton-line w40" />
        <div class="skeleton-line w20" />
        <div class="skeleton-line w60" />
      </div>

      <div v-else class="greet-card">
        <div class="greet-main">
          <div class="greet-title">
            <span class="greet-name">{{ displayName }}</span>
            <span class="role-badge">{{
              descData?.role_name || "管理员"
            }}</span>
          </div>

          <p class="greet-greeting">{{ greetingText }}</p>

          <div v-if="descData?.duties?.length" class="duties">
            <span
              v-for="(duty, index) in descData.duties"
              :key="`${index}-${duty}`"
              class="duty-chip"
              :style="dutyStyle(index)"
            >
              {{ duty }}
            </span>
          </div>
          <div v-else-if="descError" class="duties-error">{{ descError }}</div>
        </div>

        <div class="greet-date">{{ dateText }}</div>
      </div>
    </section>

    <!-- KPI 数字卡片 -->
    <section class="panel-block">
      <div class="section-head">
        <span class="section-title">数据概览</span>
      </div>

      <div class="kpi-container">
        <KpiCard
          v-for="kpi in board.kpis"
          :key="kpi.key"
          :label="kpi.label"
          :value="kpi.resolvedValue"
          :unit="kpi.unit"
          :trend="kpi.resolvedTrend"
          :loading="dashLoading"
          :action="kpi.action"
          @action="handleCardAction(kpi)"
        />
      </div>
    </section>

    <!-- 近七天趋势图表 -->
    <section class="panel-block">
      <div class="section-head">
        <span class="section-title">近七天趋势</span>
      </div>

      <div class="chart-container">
        <ChartPanel
          v-for="chart in board.charts"
          :key="chart.key"
          :title="chart.title"
          :option="chart.option"
          :loading="dashLoading"
          :empty="!dashLoading && !dashError && chart.empty"
          :error="dashError"
          height="320px"
        />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">


@media (width <= 1280px) {
  .kpi-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 960px) {
  .chart-container {
    grid-template-columns: 1fr;
  }

  .greet-card {
    flex-direction: column;
    gap: 12px;
  }

  .greet-date {
    padding-top: 0;
  }
}

@media (width <= 640px) {
  .kpi-container {
    grid-template-columns: 1fr;
  }
}

.welcome-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 95%;
  height: 100%;
  padding-bottom: 8px;
}

/* ---------------- 问候区 ---------------- */
.greet-card {
  position: relative;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px;
  overflow: hidden;
  background: linear-gradient(
    120deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color) 62%
  );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  /* 右侧装饰圆形，增加一点层次但不抢内容 */
  &::after {
    position: absolute;
    top: -70px;
    right: -40px;
    width: 190px;
    height: 190px;
    pointer-events: none;
    content: "";
    background: var(--el-color-primary-light-8);
    border-radius: 50%;
    opacity: 0.35;
  }

  &.is-skeleton {
    flex-direction: column;
    gap: 12px;
    min-height: 128px;
  }
}

.greet-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.greet-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.greet-name {
  color: var(--el-color-primary);
}

.greet-greeting {
  max-width: 72ch;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.role-badge {
  padding: 2px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 999px;
}

.duties {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.duty-chip {
  padding: 4px 12px;
  font-size: 13px;
  line-height: 20px;
  border-radius: 6px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
    transform: translateY(-1px);
  }
}

.duties-error {
  font-size: 13px;
  color: var(--el-color-danger);
}

.greet-date {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.skeleton-line {
  height: 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;

  &.w20 {
    width: 20%;
  }

  &.w40 {
    width: 40%;
  }

  &.w60 {
    width: 60%;
  }
}

/* ---------------- 区块标题 ---------------- */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  position: relative;
  padding-left: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 3px;
    height: 14px;
    content: "";
    background: var(--el-color-primary);
    border-radius: 2px;
    transform: translateY(-50%);
  }
}

/* ---------------- 卡片与图表布局 ---------------- */
.kpi-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
</style>
