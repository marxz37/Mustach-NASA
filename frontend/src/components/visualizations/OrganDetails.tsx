import { useEffect, useId, useRef, useState } from 'react';
import { X, Info } from 'lucide-react';
import { type BodyTarget, targetInfo } from './HeatmapBody';
import { organLabels } from './organLabels';
import { useApp } from '@/context/AppContext';

interface Props { target: BodyTarget | null; onClose: () => void; }
interface Point { x: number; y: number; edgeX: number; edgeY: number; }

export function OrganDetails({ target, onClose }: Props) {
  const {t}=useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [origin, setOrigin] = useState<Point | null>(null);
  const titleId = useId();
  const gradientId = useId().replaceAll(':', '');
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!target) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const locate = () => {
      const marker = document.querySelector(`[data-focus-organ="${target}"]`);
      if (!marker) { setOrigin(null); return; }
      const rect = marker.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const edgeX = window.innerWidth - Math.min(530, window.innerWidth);
      const edgeY = Math.min(355, window.innerHeight * .45);
      setOrigin(x < edgeX - 16 && y >= 0 && y <= window.innerHeight ? { x, y, edgeX, edgeY } : null);
    };
    locate();
    window.addEventListener('resize', locate);
    return () => window.removeEventListener('resize', locate);
  }, [target]);

  if (!target) return null;
  const organ = targetInfo[target];
  const organText=organLabels[target];
  return <div className="organ-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    {origin && <svg className="organ-connector" aria-hidden="true">
      <path d={`M${origin.x} ${origin.y} C${origin.x + 100} ${origin.y}, ${origin.edgeX - 75} ${origin.edgeY}, ${origin.edgeX} ${origin.edgeY}`}/>
      <circle cx={origin.x} cy={origin.y} r="5"/>
      <circle cx={origin.edgeX} cy={origin.edgeY} r="3"/>
    </svg>}
    <section className="organ-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="drawer-header"><span className="section-kicker">{t('regionTitle')}</span><button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label={t('close')}><X size={19}/></button></div>
      <div className="drawer-title"><span>{t(organText.region)}</span><h2 id={titleId}>{t('detailsOf')} {t(organText.name)}</h2><p>{t(organText.description)}</p></div>
      <div className="organ-zoom">
        <span>{t('schematicZoom')}</span>
        <div className="zoom-comparison">
          <div className="zoom-origin" aria-hidden="true"><span className="zoom-origin-point"/><small>{t(organText.region)}</small></div>
          <div className="zoom-connection" aria-hidden="true"/>
          <div className="zoom-lens">
            <svg viewBox="0 0 210 180" role="img" aria-label={`${t('schematicZoom')} ${t(organText.name)}`}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#437a9e"/><stop offset="1" stopColor="#102b47"/></linearGradient></defs>
              <path d={organ.zoomPath} transform="translate(0 9)" fill={`url(#${gradientId})`} stroke="#75dfff" strokeWidth="2.3" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <span>{t('noMapReadings')}</span>
      </div>
      <dl className="drawer-measurements">
        <div><dt>{t('organReading')}</dt><dd>— <small>µGy/h</small></dd></div>
        <div><dt>{t('organTotal')}</dt><dd>— <small>mSv</small></dd></div>
        <div><dt>{t('status')}</dt><dd>{t('noData')}</dd></div>
        <div><dt>{t('source')}</dt><dd>{t('organNoSource')}</dd></div>
      </dl>
      <div className="drawer-observations"><h3>{t('organNotes')}</h3><p>{t('organWarning')}</p></div>
      <p className="drawer-notice"><Info size={16}/> {t('organMedical')}</p>
    </section>
  </div>;
}
