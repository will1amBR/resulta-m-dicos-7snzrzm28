import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ShieldCheck } from 'lucide-react'
import { MedicationAlert, normalizeMedicationAlert } from '@/types/clinical'

const LEVEL_STYLES: Record<
  string,
  { label: string; badge: string; box: string; icon: React.ReactNode }
> = {
  contraindicacao: {
    label: 'CONTRAINDICAÇÃO',
    badge: 'bg-red-100 text-red-800 border-red-300',
    box: 'bg-red-50 border-red-300',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  precaucao: {
    label: 'PRECAUÇÃO',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    box: 'bg-amber-50 border-amber-300',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  atencao: {
    label: 'ATENÇÃO',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    box: 'bg-orange-50 border-orange-200',
    icon: <Info className="h-3.5 w-3.5" />,
  },
  ok: {
    label: 'SEM CONFLITOS',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    box: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
}

interface MedicationAlertsProps {
  alerts: MedicationAlert[]
  loading?: boolean
}

const MedicationAlerts = ({ alerts, loading }: MedicationAlertsProps) => {
  if (loading) {
    return (
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2 min-w-0">
        <span className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin shrink-0" />
        Analisando cruzamento de medicamentos com o quadro clínico do paciente...
      </div>
    )
  }

  if (!alerts || alerts.length === 0) return null

  const sorted = [...alerts].map(normalizeMedicationAlert).sort((a, b) => {
    const rank: Record<string, number> = { contraindicacao: 3, precaucao: 2, atencao: 1, ok: 0 }
    return (
      (rank[(b.risk_level || 'ok') as string] ?? 0) - (rank[(a.risk_level || 'ok') as string] ?? 0)
    )
  })

  return (
    <div className="space-y-2 min-w-0">
      {sorted.map((a, idx) => {
        const lvl = (a.risk_level || 'ok') as string
        const style = LEVEL_STYLES[lvl] || LEVEL_STYLES.ok
        const reason = a.reason || a.message || ''
        const suggestion = a.suggestion || a.suggested_alternative || ''
        return (
          <div
            key={idx}
            className={`p-3 rounded-xl border text-xs space-y-1.5 break-words min-w-0 ${style.box}`}
          >
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold text-[10px] shrink-0 ${style.badge}`}
              >
                {style.icon}
                {style.label}
              </span>
              <span className="font-bold text-slate-900 break-words min-w-0">{a.medication}</span>
              {a.source === 'ia' && (
                <span className="text-[9px] text-slate-400 italic shrink-0">via IA</span>
              )}
            </div>

            {reason && (
              <p className="text-slate-700 leading-relaxed break-words">
                <strong>Por quê:</strong> {reason}
              </p>
            )}
            {suggestion && (
              <p className="text-slate-600 leading-relaxed break-words">
                <strong>Sugestão:</strong> {suggestion}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MedicationAlerts
export { MedicationAlerts }
