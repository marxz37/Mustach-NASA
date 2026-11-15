import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BarChart3 } from 'lucide-react';
interface Props { height?: number; label?: string; }
export function EmptyChart({ height = 165, label = 'Nenhuma medição disponível' }: Props) {
  const options: EChartsOption = {
    animation: false,
    backgroundColor: 'transparent',
    grid: { top: 12, bottom: 12, left: 22, right: 10 },
    xAxis: { type: 'category', data: [], axisLine: { show: true, lineStyle: { color: '#46413c' } }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, splitNumber: 4, axisLine: { show: false }, axisLabel: { show: false }, splitLine: { lineStyle: { color: '#343236', type: 'dashed' } } },
    series: [{ type: 'line', data: [], smooth: true, lineStyle: { color: '#caa880' } }],
  };
  return <div className="empty-chart" style={{ height }}>
    <ReactECharts option={options} style={{ height: '100%', width: '100%' }} notMerge lazyUpdate />
    <div className="empty-chart-label"><BarChart3 size={17}/><span>{label}</span></div>
  </div>;
}
