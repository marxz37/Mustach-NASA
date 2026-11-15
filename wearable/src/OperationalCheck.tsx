import { AlertTriangle } from 'lucide-react';
import type { Language } from '@shared/i18n';
import type { OperationalEvent } from '@shared/operational';
import { operationalCopy } from '@shared/operationalCopy';

/** Read-only. The API decides relevance; no checklist or review action on a gloved watch. */
export function OperationalNotice({ language, event, stale }: { language: Language; event?: OperationalEvent; stale: boolean }) {
  if (!stale && !event?.assessment.requires_attention) return null;
  const c = (key: Parameters<typeof operationalCopy>[1]) => operationalCopy(language, key);
  return <div className="watch-operational-notice" role="status" aria-label={c('title')} data-event-id={event?.id}>
    <AlertTriangle size={15}/><div><strong>{c(event?.assessment.requires_attention ? 'watchPending' : 'watchUnknown')}</strong><span>{stale && event ? `${c('stale')} · ` : ''}{c('watchBoard')}</span></div>
  </div>;
}
