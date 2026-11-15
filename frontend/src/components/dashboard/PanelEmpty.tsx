import type { ReactNode } from 'react';
import { DatabaseZap } from 'lucide-react';
export function PanelEmpty({title='Aguardando integração',message='Nenhuma medição foi importada.',children}: {title?: string; message?: string; children?: ReactNode}) {
  return <div className="panel-empty">
    <div className="empty-icon"><DatabaseZap size={21}/></div>
    <strong>{title}</strong><p>{message}</p>{children}
  </div>;
}
