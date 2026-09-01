import { AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { MedicationAlert } from '@/types/clinical'

interface MedicationAlertsProps {
  alerts: MedicationAlert[]
  loading: boolean
}

export function MedicationAlerts({ alerts, loading }: MedicationAlertsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-md text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        Analisando interações medicamentosas com IA...
      </div>
    )
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Análise de Interações Medicamentosas
      </h3>
      {alerts.map((alert, idx) => {
        const config = {
          high: {
            icon: AlertCircle,
            bg: 'bg-red-50 border-red-200',
            text: 'text-red-800',
            label: 'Alto Risco',
            labelBg: 'bg-red-100 text-red-700',
          },
          medium: {
            icon: AlertTriangle,
            bg: 'bg-amber-50 border-amber-200',
            text: 'text-amber-800',
            label: 'Precaução',
            labelBg: 'bg-amber-100 text-amber-700',
          },
          none: {
            icon: CheckCircle,
            bg: 'bg-green-50 border-green-200',
            text: 'text-green-800',
            label: 'Sem Conflito',
            labelBg: 'bg-green-100 text-green-700',
          },
        }
        const c = config[alert.severity] || config.none
        const Icon = c.icon

        return (
          <div key={idx} className={`p-2.5 border rounded-md ${c.bg} animate-fade-in space-y-1.5`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <Icon className={`h-4 w-4 ${c.text} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`font-semibold ${c.text}`}>{alert.medication}</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">{alert.message}</p>
                  {alert.suggestion && (
                    <div className="mt-1.5 p-1.5 bg-white/80 rounded border border-slate-200/60 text-[11px] text-slate-800">
                      <strong className="text-blue-700">💡 Sugestão / Alternativa: </strong>
                      <span>{alert.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.labelBg} shrink-0`}>
                {c.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
