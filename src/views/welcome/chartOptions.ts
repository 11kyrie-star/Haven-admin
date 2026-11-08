import type { EChartsOption } from "echarts";

/** 坐标轴文字颜色（与 Element Plus 的次要文字色保持一致） */
const AXIS_LABEL_COLOR = "#909399";
/** 分割线颜色 */
const SPLIT_LINE_COLOR = "#EBEEF5";
/** 数值标签颜色 */
const VALUE_LABEL_COLOR = "#606266";
/** 折线默认色（Element Plus 主题蓝） */
const DEFAULT_LINE_COLOR = "#409EFF";

/** 一条折线 / 一组柱子的最小输入：具体业务字段在页面层完成映射 */
export interface ChartSeriesData {
  dates: string[];
  values: number[];
  /** tooltip / 图例中展示的系列名 */
  name: string;
}

/** hex 颜色加透明度，用于折线面积渐变 */
function withAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const baseAxis = {
  axisTick: { show: false },
  axisLine: { lineStyle: { color: SPLIT_LINE_COLOR } },
  axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 12 }
};

const baseValueAxis = {
  type: "value",
  minInterval: 1,
  axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 12 },
  splitLine: { lineStyle: { color: SPLIT_LINE_COLOR, type: "dashed" } }
} as const;

const baseGrid = { left: 8, right: 16, top: 36, bottom: 8, containLabel: true };

/** 通用折线图：待处理 / 新增 类指标 */
export function buildLineOption(
  data: ChartSeriesData,
  color = DEFAULT_LINE_COLOR
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" }
    },
    grid: baseGrid,
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.dates,
      ...baseAxis
    },
    yAxis: { ...baseValueAxis },
    series: [
      {
        name: data.name,
        data: data.values,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: true,
        lineStyle: { width: 2, color },
        itemStyle: {
          color,
          borderColor: "#fff",
          borderWidth: 1
        },
        // 面积渐变：让折线下方有层次感，同时不抢柱状图视觉
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(color, 0.24) },
              { offset: 1, color: withAlpha(color, 0) }
            ]
          }
        },
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          color: VALUE_LABEL_COLOR,
          formatter: "{c}条"
        },
        emphasis: { focus: "series" }
      }
    ]
  };
}

// 随着处理数量的增加柱状图的颜色会改变
function levelColor(value: number) {
  if (value >= 20) {
    return "#0F9D58";
  }
  if (value >= 10 && value < 20) {
    return "#5DD39E";
  }
  return "#D6F5E6";
}

/** 通用柱状图：已处理 / 操作量 类指标 */
export function buildBarOption(data: ChartSeriesData): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    grid: baseGrid,
    xAxis: {
      type: "category",
      data: data.dates,
      ...baseAxis
    },
    yAxis: { ...baseValueAxis },
    series: [
      {
        name: data.name,
        data: data.values,
        type: "bar",
        barMaxWidth: 36,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params: any) => levelColor(params.value)
        },
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          color: VALUE_LABEL_COLOR
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: "rgba(15, 157, 88, 0.25)"
          }
        }
      }
    ]
  };
}
