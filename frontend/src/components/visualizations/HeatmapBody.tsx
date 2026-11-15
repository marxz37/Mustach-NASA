import { useId, type KeyboardEvent } from 'react';

export type BodyTarget = 'cerebro' | 'pulmoes' | 'coracao' | 'figado' | 'estomago' | 'medula';
export const targetInfo: Record<BodyTarget, { name: string; region: string; description: string; zoomPath: string }> = {
  cerebro: { name: 'Cérebro', region: 'Cabeça', description: 'Região craniana e sistema nervoso central.', zoomPath: 'M65 110C30 96 26 48 56 32c12-30 54-32 68-12 38-10 56 17 51 43 20 26 4 59-23 60-18 24-53 25-66 8-10 3-17-1-21-21Z' },
  pulmoes: { name: 'Pulmões', region: 'Tórax', description: 'Tecido pulmonar e estruturas torácicas.', zoomPath: 'M86 20c-25 8-48 47-49 82-2 32 18 48 44 37 13-6 19-33 21-70L101 24M115 24l-1 45c2 37 8 64 21 70 26 11 46-5 44-37-1-35-24-74-49-82Z' },
  coracao: { name: 'Coração', region: 'Tórax', description: 'Estruturas cardíacas e sistema circulatório.', zoomPath: 'M108 148C76 121 39 93 42 60c2-24 18-39 38-39 14 0 25 6 31 17 9-11 20-17 34-17 20 0 36 15 38 39 3 33-34 61-75 88Z' },
  figado: { name: 'Fígado', region: 'Abdômen', description: 'Tecido hepático e região abdominal superior.', zoomPath: 'M24 57c35-31 112-41 161-17l-9 48c-9 35-42 64-73 61-44-5-74-39-79-92Z' },
  estomago: { name: 'Estômago', region: 'Abdômen', description: 'Região gástrica e trato digestivo.', zoomPath: 'M95 16c19 10 20 29 21 45 5 10 24 0 36 12 24 21 14 58-11 71-36 19-84-3-83-31 2-33 32-27 35-54 1-16-4-28 2-43Z' },
  medula: { name: 'Medula óssea', region: 'Estrutura óssea', description: 'Órgãos hematopoiéticos; requer avaliação dosimétrica validada.', zoomPath: 'M92 15c-18 5-19 29-4 40l-12 16c-25 0-33 28-16 44 12 12 25 9 39-1l11 15 12-15c14 10 27 13 39 1 17-16 9-44-16-44l-12-16c15-11 14-35-4-40-15-5-22 5-27 18-5-13-12-23-27-18Z' },
};

const hotspots: { id: BodyTarget; cx: number; cy: number; radius: number; labelX: number; labelY: number }[] = [
  { id: 'cerebro', cx: 180, cy: 67, radius: 18, labelX: 212, labelY: 67 },
  { id: 'pulmoes', cx: 172, cy: 177, radius: 24, labelX: 216, labelY: 167 },
  { id: 'coracao', cx: 190, cy: 211, radius: 12, labelX: 222, labelY: 212 },
  { id: 'figado', cx: 158, cy: 244, radius: 16, labelX: 78, labelY: 246 },
  { id: 'estomago', cx: 194, cy: 263, radius: 14, labelX: 232, labelY: 266 },
  { id: 'medula', cx: 180, cy: 315, radius: 12, labelX: 211, labelY: 314 },
];

interface Props { selected: BodyTarget | null; onSelect: (organ: BodyTarget) => void; }

export function HeatmapBody({ selected, onSelect }: Props) {
  const id = useId().replaceAll(':', '');
  const selectOnKey = (event: KeyboardEvent<SVGGElement>, target: BodyTarget) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(target); }
  };
  return <div className="heatmap-stage">
    <span className="coordinate coord-nw">VISTA ANTERIOR / 2D</span><span className="coordinate coord-ne">SELECIONE UM PONTO</span>
    <div className="heatmap-rings" aria-hidden="true"/>
    <svg className="human-heatmap" viewBox="0 0 360 470" role="group" aria-label="Mapa corporal interativo sem medições de exposição">
      <defs><linearGradient id={`${id}-neutral`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60666c"/><stop offset=".52" stopColor="#373c43"/><stop offset="1" stopColor="#20262d"/></linearGradient></defs>
      <g fill="none" stroke="#776d64" strokeWidth=".7" opacity=".25" pointerEvents="none"><path d="M180 0V470M0 230H360M40 97H320M40 359H320" strokeDasharray="4 8"/><circle cx="180" cy="238" r="125"/><circle cx="180" cy="238" r="174"/></g>
      <g fill={`url(#${id}-neutral)`} stroke="#9b938b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M180 26C157 26 146 47 147 68c.7 18 5 29 13 38 7 8 14 12 20 12s13-4 20-12c8-9 12-20 13-38 1-21-10-42-33-42ZM167 108v23h26v-23"/>
        <path d="M166 125c-17 0-30 6-47 14-8 4-12 15-13 26 14 7 23 16 36 25l7 45c10 5 20 8 31 8s21-3 31-8l7-45c13-9 22-18 36-25-1-11-5-22-13-26-17-8-30-14-47-14l-14 9Z"/>
        <path d="m149 234-6 39c-1 11 7 20 17 27l20 12 20-12c10-7 18-16 17-27l-6-39c-20 10-42 10-62 0Z"/>
        <path d="M107 163c-7 6-14 17-19 35L70 268l-17 54c-3 9 1 13 6 14 6 2 10-1 14-11l26-58 25-74c-4-14-10-25-17-30Z M253 163c7 6 14 17 19 35l18 70 17 54c3 9-1 13-6 14-6 2-10-1-14-11l-26-58-25-74c4-14 10-25 17-30Z M55 332l-7 18c-2 7 4 10 9 7l8-17 M305 332l7 18c2 7-4 10-9 7l-8-17"/>
        <path d="M159 298c-13 18-18 36-17 62l-3 71-7 22c-2 7 3 10 9 10h15c6 0 7-7 7-14l12-86 5-45-21-20Z M201 298c13 18 18 36 17 62l3 71 7 22c2 7-3 10-9 10h-15c-6 0-7-7-7-14l-12-86-5-45 21-20Z"/>
      </g>
      <g fill="none" stroke="#b6aba0" strokeWidth="1" opacity=".34" pointerEvents="none"><path d="M180 143v89m-23-83 23 20 23-20m-51 40 28 18 28-18M163 254h34m-33 12h32M169 318l-9 45M191 318l9 45"/></g>
      {hotspots.map(({id: organ,cx,cy,radius,labelX,labelY}) => <g key={organ} role="button" tabIndex={0} aria-label={`Ampliar órgão: ${targetInfo[organ].name}`} aria-pressed={selected === organ} className={`heatmap-hotspot ${selected===organ?'hotspot-selected':''}`} onClick={() => onSelect(organ)} onKeyDown={event => selectOnKey(event, organ)}>
        <circle cx={cx} cy={cy} r={radius + 7} fill="transparent" stroke="none"/>
        <circle cx={cx} cy={cy} r={radius} fill="rgba(17,19,23,.12)" stroke={selected===organ?'#e8c49a':'#a59b92'} strokeWidth={selected===organ?2:1} strokeDasharray={selected===organ?'0':'3 5'} opacity=".9"/>
        <circle data-focus-organ={organ} cx={cx} cy={cy} r="3.8" fill="#d9bd9c" stroke="#25231f" strokeWidth="1"/>
        <path d={`M${cx+radius*.65} ${cy} L${labelX} ${labelY}`} stroke="#a59b92" strokeWidth=".8" opacity=".7" pointerEvents="none"/>
        <text x={labelX+3} y={labelY-3} className="organ-point-label" pointerEvents="none">{targetInfo[organ].name.toUpperCase()}</text>
      </g>)}
    </svg>
    <div className="heatmap-bottom-tag"><span className="status-dot"/> SEM DADOS · ESCALA DESATIVADA</div>
  </div>;
}
