import type { KeyboardEvent } from 'react';
import type { Region } from '@/types/domain';

const anatomy: Record<Region,string> = {
  cabeca: 'Cabeça', torax: 'Tórax', abdomen: 'Abdômen', bracos: 'Braços', pernas: 'Pernas',
};

interface Props { selected: Region; onSelect: (region: Region) => void; }
export const regionLabels = anatomy;

export function HumanBody({ selected, onSelect }: Props) {
  const keySelect = (event: KeyboardEvent<SVGGElement>, region: Region) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(region); }
  };
  const regionProps = (region: Region) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': `Selecionar região: ${anatomy[region]}`,
    className: `body-region ${selected===region?'selected':''}`,
    onClick: () => onSelect(region),
    onKeyDown: (e: KeyboardEvent<SVGGElement>) => keySelect(e, region),
  });

  return <div className="body-illustration">
    <div className="body-radar-ring ring-one"/><div className="body-radar-ring ring-two"/><div className="body-radar-ring ring-three"/>
    <svg className="body-svg" viewBox="0 0 360 475" role="img" aria-label="Silhueta anatômica interativa, sem medições radiológicas">
      <defs>
        <linearGradient id="bodySurface" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#11465e" stopOpacity=".85"/>
          <stop offset=".55" stopColor="#0b243a" stopOpacity=".95"/>
          <stop offset="1" stopColor="#08213a" stopOpacity=".75"/>
        </linearGradient>
        <linearGradient id="bodySelected" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#36d8eb" stopOpacity=".34"/><stop offset="1" stopColor="#168da2" stopOpacity=".15"/>
        </linearGradient>
        <filter id="outlineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g stroke="#18516c" strokeWidth=".7" fill="none" opacity=".45">
        <path d="M180 0V475M0 234H360M40 98H320M40 350H320" strokeDasharray="3 7"/>
        <circle cx="180" cy="234" r="120"/><circle cx="180" cy="234" r="170"/>
      </g>
      <g stroke="#4bc8dc" strokeWidth="1.8" strokeLinejoin="round" fill="url(#bodySurface)" className="body-contours">
        <g {...regionProps('cabeca')}>
          <path d="M180 26C157 26 146 47 147 68c.7 18 5 29 13 38 7 8 14 12 20 12s13-4 20-12c8-9 12-20 13-38 1-21-10-42-33-42Z"/>
          <path d="M167 109v22h26v-22"/>
        </g>
        <g {...regionProps('torax')}>
          <path d="M166 125c-17 0-30 6-47 14-8 4-12 15-13 26 14 7 23 16 36 25l7 45c10 5 20 8 31 8s21-3 31-8l7-45c13-9 22-18 36-25-1-11-5-22-13-26-17-8-30-14-47-14l-14 9Z"/>
        </g>
        <g {...regionProps('abdomen')}>
          <path d="m149 234-6 39c-1 11 7 20 17 27l20 12 20-12c10-7 18-16 17-27l-6-39c-20 10-42 10-62 0Z"/>
        </g>
        <g {...regionProps('bracos')}>
          <path d="M107 163c-7 6-14 17-19 35L70 268l-17 54c-3 9 1 13 6 14 6 2 10-1 14-11l26-58 25-74c-4-14-10-25-17-30Z"/>
          <path d="M253 163c7 6 14 17 19 35l18 70 17 54c3 9-1 13-6 14-6 2-10-1-14-11l-26-58-25-74c4-14 10-25 17-30Z"/>
          <path d="M55 332l-7 18c-2 7 4 10 9 7l8-17M305 332l7 18c2 7-4 10-9 7l-8-17"/>
        </g>
        <g {...regionProps('pernas')}>
          <path d="M159 298c-13 18-18 36-17 62l-3 71-7 22c-2 7 3 10 9 10h15c6 0 7-7 7-14l12-86 5-45-21-20Z"/>
          <path d="M201 298c13 18 18 36 17 62l3 71 7 22c2 7-3 10-9 10h-15c-6 0-7-7-7-14l-12-86-5-45 21-20Z"/>
        </g>
      </g>
      <g fill="none" stroke="#4bc8dc" strokeWidth="1" opacity=".3" pointerEvents="none">
        <path d="M180 140v91m-23-82 23 20 23-20m-50 42 27 18 27-18M164 255h32m-32 12h32"/>
        <path d="M171 51v42M189 51v42M158 69h44" strokeDasharray="2 6"/>
      </g>
      <g fill="none" stroke="#47cce1" strokeWidth="1" opacity=".63" pointerEvents="none">
        <path d="M140 163H74v-14H38"/><path d="M216 269h77v-12h37"/><path d="M206 90h86v-15h38"/>
      </g>
      <g fill="#59e5ed" opacity=".75" pointerEvents="none"><circle cx="140" cy="163" r="3"/><circle cx="216" cy="269" r="3"/><circle cx="206" cy="90" r="3"/></g>
      <g fontSize="9" fill="#7fa8c6" fontFamily="JetBrains Mono, monospace" letterSpacing="1" pointerEvents="none">
        <text x="13" y="144">TORAX</text><text x="292" y="70">CRANIO</text><text x="294" y="250">ABDOMEN</text>
      </g>
    </svg>
    <div className="scanline-overlay" aria-hidden="true"/>
    <div className="body-scan-label"><span className="small-dot cyan"/> MODELO ANATÔMICO • SEM DOSIMETRIA</div>
  </div>;
}
