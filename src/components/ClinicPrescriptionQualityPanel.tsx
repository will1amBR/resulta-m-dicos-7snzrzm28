import { useEffect, useMemo, useState } from 'react'
import { ShieldAlert, RefreshCw, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getIgnoredMedicationAlerts } from '@/services/ignored-medication-alerts'
import { getClinicDoctors } from '@/services/clinic'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

/**
 * Painel "Qualidade de Prescrição": por médico do corpo clínico, quantas
 * receitas foram emitidas com alerta de risco alto (contraindicação/precaução)
 * ignorado e a taxa sobre o total de receitas emitidas.
 *
 * Layout SEM tabelas de largura fixa: blocos empilháveis com flex-wrap,
 * min-w-0 e break-words — nenhuma largura de tela gera scroll horizontal.
 */

interface DoctorQuality {
  id: string
  name: string
  crm?: string
  totalPrescriptions: number
  ignoredRiskyAlerts: number
  ignoredContraindications: number
}

function rateTier(
  rate: number,
  total: number,
): {
  label: string
  className: string
  barClassName: string
} {
  if (total === 0)
    return {
      label: 'Sem receitas no período',
      className: 'bg-slate-100 text-slate-500 border border-slate-200',
      barClassName: 'bg-slate-300',
    }
  if (rate >= 20)
    return {
      label: 'Crítico',
      className: 'bg-red-100 text-red-700 border border-red-300',
      barClassName: 'bg-red-500',
    }
  if (rate >= 10)
    return {
      label: 'Atenção',
      className: 'bg-amber-100 text-amber-700 border border-amber-300',
      barClassName: 'bg-amber-500',
    }
  return {
    label: 'Adequado',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    barClassName: 'bg-emerald-500',
  }
}

export default function ClinicPrescriptionQualityPanel() {
  const [doctors, setDoctors] = useState<DoctorQuality[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [docs, alerts, prescriptions] = await Promise.all([
        getClinicDoctors().catch(() => []),
        getIgnoredMedicationAlerts({ limit: 500 }).catch(() => []),
        pb
          .collection('prescriptions')
          .getFullList<{ id: string; doctor_id: string; created?: string }>({
            filter: '',
            sort: '-created',
            limit: 500,
            expand: 'doctor_id',
          })
          .catch(() => []),
      ])

      const counts = new Map<string, DoctorQuality>()
      for (const doc of docs) {
        counts.set(doc.id, {
          id: doc.id,
          name: doc.name || 'Médico',
          crm: doc.crm,
          totalPrescriptions: 0,
          ignoredRiskyAlerts: 0,
          ignoredContraindications: 0,
        })
      }
      // Garante que médicos com dados apareçam mesmo fora da lista do corpo clínico
      for (const rx of prescriptions) {
        const docId = rx.doctor_id
        if (!docId) continue
        if (!counts.has(docId)) {
          counts.set(docId, {
            id: docId,
            name: (rx as any).expand?.doctor_id?.name || 'Médico',
            totalPrescriptions: 0,
            ignoredRiskyAlerts: 0,
            ignoredContraindications: 0,
          })
        }
        const entry = counts.get(docId)!
        entry.totalPrescriptions += 1
      }
      for (const alert of alerts) {
        const entry = counts.get(alert.doctor)
        if (!entry) continue
        entry.ignoredRiskyAlerts += 1
        if (alert.risk_level === 'contraindicacao') entry.ignoredContraindications += 1
      }

      setDoctors(
        Array.from(counts.values()).sort(
          (a, b) =>
            b.ignoredRiskyAlerts / Math.max(b.totalPrescriptions, 1) -
            a.ignoredRiskyAlerts / Math.max(a.totalPrescriptions, 1),
        ),
      )
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('ignored_medication_alerts', () => {
    loadData()
  })
  useRealtime('prescriptions', () => {
    loadData()
  })

  const overall = useMemo(() => {
    const totalRx = doctors.reduce((acc, d) => acc + d.totalPrescriptions, 0)
    const totalIg = doctors.reduce((acc, d) => acc + d.ignoredRiskyAlerts, 0)
    return {
      totalRx,
      totalIg,
      rate: totalRx > 0 ? (totalIg / totalRx) * 100 : 0,
    }
  }, [doctors])

  const overallTier = rateTier(overall.rate, overall.totalRx)

  return (
    <Card className="border-slate-200 shadow-subtle">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <Target className="h-4 w-4 text-violet-600 shrink-0" />
              <span>Qualidade de Prescrição</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Receitas emitidas com alerta de risco alto (contraindicação ou precaução) ignorado,
              por médico do corpo clínico.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn('text-[10px] font-bold', overallTier.className)}>
              Geral: {overall.rate.toFixed(1)}% · {overall.totalIg} de {overall.totalRx} receitas
            </Badge>
            <button
              onClick={loadData}
              className="h-7 w-7 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              title="Atualizar"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-24 w-full max-w-[280px] min-w-[220px]" />
            <Skeleton className="h-24 w-full max-w-[280px] min-w-[220px]" />
            <Skeleton className="h-24 w-full max-w-[280px] min-w-[220px]" />
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Nenhum médico com receitas emitidas ainda.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {doctors.map((d) => {
              const rate =
                d.totalPrescriptions > 0 ? (d.ignoredRiskyAlerts / d.totalPrescriptions) * 100 : 0
              const tier = rateTier(rate, d.totalPrescriptions)
              return (
                <div
                  key={d.id}
                  className="flex-1 basis-[240px] max-w-full min-w-0 bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 break-words leading-snug">
                      {d.name}
                    </p>
                    <p className="text-[10px] text-slate-400 break-words">
                      {d.crm ? `CRM ${d.crm}` : 'Corpo clínico'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {rate.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 break-words">
                      {d.ignoredRiskyAlerts} de {d.totalPrescriptions} receitas com alerta ignorado
                    </span>
                  </div>

                  {/* Barra de taxa (largura % do container, nunca transborda) */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', tier.barClassName)}
                      style={{ width: `${Math.min(Math.max(rate, 2), 100)}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <Badge className={cn('text-[10px] font-bold', tier.className)}>
                      {tier.label}
                    </Badge>
                    {d.ignoredContraindications > 0 ? (
                      <Badge className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 gap-1">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        {d.ignoredContraindications} contraindicaç
                        {d.ignoredContraindications === 1 ? 'ão' : 'ões'}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
