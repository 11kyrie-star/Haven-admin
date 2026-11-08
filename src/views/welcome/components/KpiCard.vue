<template>
    <div class="kpi-card" :class="{ 'is-alert': props.alert }">
        <div class="kpi-card__head">
            <span class="kpi-card__label">{{ props.label }}</span>
            <span v-if="props.alert" class="kpi-card__badge">需关注</span>
        </div>

        <div v-if="props.loading" class="kpi-card__skeleton"></div>

        <template v-else>
            <div class="kpi-card__value">
                <span class="kpi-card__num">{{ displayValue }}</span>
                <span v-if="props.unit" class="kpi-card__unit">{{ props.unit }}</span>
            </div>

            <div class="kpi-card__foot">
                <span v-if="props.delta !== undefined" class="kpi-card__delta" :class="deltaClass">
                    {{ deltaText }}
                </span>

                <!-- 迷你折线：纯 SVG，不为一张卡片单独创建 ECharts 实例 -->
                <svg v-if="points" class="kpi-card__spark" viewBox="0 0 100 28" preserveAspectRatio="none">
                    <polyline :points="points" fill="none" stroke="currentColor" stroke-width="2" />
                </svg>
            </div>

            <button v-if="props.action" class="kpi-card__action" type="button" @click="emit('action')">
                {{ props.action.text }}
            </button>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useTransition, TransitionPresets } from "@vueuse/core";

interface Props {
    label: string;
    /** null 表示没拿到数据，与真实的 0 区分开 */
    value: number | null;
    unit?: string;
    /** 0.32 表示 +32% */
    delta?: number;
    trend?: number[];
    loading?: boolean;
    /** 是否超阈值 */
    alert?: boolean;
    /** 涨是好事还是坏事，默认 up */
    deltaGood?: "up" | "down";
    action?: { text: string };
}

const props = withDefaults(defineProps<Props>(), {
    unit: "",
    trend: () => [],
    loading: false,
    alert: false,
    deltaGood: "up"
});

const emit = defineEmits<{ action: [] }>();

/* ---------------- 数字滚动 ---------------- */
const source = ref(0);
const animated = useTransition(source, {
    duration: 800,
    transition: TransitionPresets.easeOutCubic
});

watch(
    () => props.value,
    v => {
        if (v === null) return;
        // 初值 0 → 真实值触发一次滚动；刷新时 128 → 150 再次滚动
        source.value = v;
    },
    { immediate: true }
);

const displayValue = computed(() => {
    if (props.value === null) return "--";
    // 取整，避免出现 127.9999
    return Math.round(animated.value).toLocaleString();
});

/* ---------------- 环比 ---------------- */
const deltaText = computed(() => {
    const pct = (props.delta ?? 0) * 100;
    const sign = pct > 0 ? "+" : "";
    return `${sign}${Math.round(pct)}%`;
});

const deltaClass = computed(() => {
    if (!props.delta) return "";
    const isUp = props.delta > 0;
    // 有的指标涨是好事（发帖量），有的涨是坏事（待处理举报）
    const isGood = props.deltaGood === "down" ? !isUp : isUp;
    return isGood ? "is-good" : "is-bad";
});

/* ---------------- 迷你折线 ---------------- */
const points = computed(() => {
    const t = props.trend;
    if (t.length < 2) return "";

    const max = Math.max(...t);
    const min = Math.min(...t);
    // 数据全等时 range 为 0，兜底避免除以 0
    const range = max - min || 1;

    return t
        .map((v, i) => {
            const x = (i / (t.length - 1)) * 100;
            const y = 26 - ((v - min) / range) * 24; // 上下各留 2px
            return `${x},${y}`;
        })
        .join(" ");
});
</script>

<style scoped lang="scss">
.kpi-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 132px;
    padding: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &.is-alert {
        background: var(--el-color-warning-light-9);
        border-color: var(--el-color-warning-light-5);
    }

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
    }

    &__badge {
        padding: 0 6px;
        font-size: 12px;
        line-height: 18px;
        color: var(--el-color-warning-dark-2);
        background: var(--el-color-warning-light-8);
        border-radius: 4px;
    }

    &__value {
        display: flex;
        align-items: baseline;
        gap: 4px;
    }

    &__num {
        font-size: 28px;
        font-weight: 600;
        line-height: 1.2;
        color: var(--el-text-color-primary);
        /* 等宽数字：滚动过程中宽度不抖 */
        font-variant-numeric: tabular-nums;
    }

    &__unit {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    &__foot {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
    }

    &__delta {
        font-size: 12px;

        &.is-good {
            color: var(--el-color-success);
        }

        &.is-bad {
            color: var(--el-color-danger);
        }
    }

    &__spark {
        width: 72px;
        height: 24px;
        color: var(--el-color-primary);
        opacity: 0.85;
    }

    &__action {
        align-self: flex-end;
        padding: 0;
        font-size: 13px;
        color: var(--el-color-primary);
        cursor: pointer;
        background: transparent;
        border: none;
    }

    /* 骨架高度固定，避免数据到达时卡片高度跳动 */
    &__skeleton {
        width: 100%;
        height: 84px;
        background: var(--el-fill-color-lighter);
        border-radius: 6px;
    }
}
</style>
