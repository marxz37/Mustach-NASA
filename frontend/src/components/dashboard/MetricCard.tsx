import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
interface Props { icon: LucideIcon; label: string; unit: string; hint: string; variant?: 'aqua'|'blue'|'violet'; }
export function MetricCard({ icon: Icon, label, unit, hint, variant = 'aqua' }: Props) {
  return <Card className={`metric-card metric-${variant}`}>
    <div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Icon size={18}/></span></div>
    <div className="metric-value"><strong>—</strong><span>{unit}</span></div>
    <div className="metric-footer"><span className="small-dot"/><span>{hint}</span><ArrowUpRight size={14} className="ml-auto opacity-40"/></div>
  </Card>;
}
