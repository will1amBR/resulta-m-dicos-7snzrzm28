import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  UserCheck,
  ShieldCheck,
  FileText,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getDoctorPrescriptions } from '@/services/prescriptions'

interface DoctorOnboardingTourProps {
  user: any
}

export function DoctorOnboardingTour({ user }: DoctorOnboardingTourProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [firstRxIssued, setFirstRxIssued] = useState(false)
  const [checkingRx, setCheckingRx] = useState(true)

  const storageKey = user?.id
    ? `doctor_onboarding_dismissed_${user.id}`
    : 'doctor_onboarding_dismissed'

  // Verificar se o médico já emitiu ao menos 1 receita
  useEffect(() => {
    let isMounted = true
    const checkPrescriptions = async () => {
      if (!user?.id) {
        setCheckingRx(false)
        return
      }
      try {
        const list = await getDoctorPrescriptions(user.id)
        if (isMounted) {
          setFirstRxIssued(list.length > 0)
        }
      } catch {
        if (isMounted) setFirstRxIssued(false)
      } finally {
        if (isMounted) setCheckingRx(false)
      }
    }

    checkPrescriptions()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Checar se foi descartado manualmente no localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === 'true'
    setDismissed(isDismissed)
  }, [storageKey])

  // Avaliação do Passo 1: Perfil Completo
  // (dados: nome, especialidade, registro no conselho - CRM/council_number)
  const hasName = !!user?.name && user.name.trim().length > 3
  const hasCouncil = !!(user?.council_number || user?.crm)
  const hasSpecialty = !!user?.specialty
  const isStep1Done = hasName && hasCouncil

  // Avaliação do Passo 2: Certificado Digital
  // (status: nao_enviado / pendente / validado)
  const rawStatus = (user?.certificate_status || '').toLowerCase()
  const certStatusLabel =
    rawStatus === 'validado' || rawStatus === 'active'
      ? 'validado'
      : rawStatus === 'pendente' || rawStatus === 'pending' || rawStatus === 'pending_validation'
        ? 'pendente'
        : 'nao_enviado'

  const hasCertificateFile = !!user?.certificate_file
  const isStep2Done =
    certStatusLabel === 'validado' || certStatusLabel === 'pendente' || hasCertificateFile

  // Avaliação do Passo 3: Emitir primeira receita
  const isStep3Done = firstRxIssued

  // Cálculo de progresso
  const completedStepsCount = (isStep1Done ? 1 : 0) + (isStep2Done ? 1 : 0) + (isStep3Done ? 1 : 0)
  const progressPercent = Math.round((completedStepsCount / 3) * 100)
  const isAllDone = completedStepsCount === 3

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  const handleReset = () => {
    localStorage.removeItem(storageKey)
    setDismissed(false)
  }

  if (dismissed) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900">
        <span className="flex items-center gap-1.5 text-[11px] font-medium">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          Onboarding de boas-vindas concluído ou ocultado ({completedStepsCount}/3 etapas).
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] underline flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reabrir tour guiado
        </button>
      </div>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white shadow-sm overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Cabeçalho do Onboarding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Onboarding do Médico — Primeiros Passos
                </h3>
                <Badge
                  variant={isAllDone ? 'default' : 'secondary'}
                  className={`text-[10px] font-bold ${
                    isAllDone ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isAllDone ? '✓ 100% Concluído' : `${completedStepsCount} de 3 passos`}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Configure sua conta médica para emitir receitas com validade legal e atender
                pacientes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
            >
              {collapsed ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" /> Expandir
                </>
              ) : (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" /> Recolher
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
              title="Ocultar onboarding"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-slate-700">Progresso de ativação profissional</span>
            <span className="font-bold text-blue-700">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-blue-100" />
        </div>

        {/* Lista de Passos Guiados (visível quando não colapsado) */}
        {!collapsed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* ETAPA 1: COMPLETAR PERFIL */}
            <div
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isStep1Done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-white border-blue-200 text-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Etapa 1
                  </span>
                  {isStep1Done ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3" /> Concluído
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] px-1.5 py-0"
                    >
                      Pendente
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isStep1Done ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Completar Perfil Profissional
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Informe nome completo, especialidade e registro de conselho (CRM, CRM-UF).
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-600 space-y-0.5 bg-white/60 p-2 rounded-lg border border-slate-100">
                  <p className="flex items-center justify-between">
                    <span>Nome:</span>
                    <strong className="text-slate-900">{user?.name || 'Não informado'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Conselho:</span>
                    <strong className="text-slate-900">
                      {user?.council_type || 'CRM'}:{' '}
                      {user?.council_number || user?.crm || 'Pendente'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  size="sm"
                  variant={isStep1Done ? 'outline' : 'default'}
                  onClick={() => navigate('/configuracoes')}
                  className={`w-full text-xs h-8 ${
                    isStep1Done
                      ? 'border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white font-semibold'
                  }`}
                >
                  {isStep1Done ? 'Editar Dados' : 'Completar Perfil'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            {/* ETAPA 2: SUBIR CERTIFICADO DIGITAL */}
            <div
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isStep2Done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-white border-blue-200 text-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Etapa 2
                  </span>
                  {certStatusLabel === 'validado' ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3" /> Validado ICP
                    </Badge>
                  ) : certStatusLabel === 'pendente' ? (
                    <Badge className="bg-amber-500 text-white text-[10px] gap-1 px-1.5 py-0">
                      Pendente de Validação
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-300 text-slate-600 text-[10px] px-1.5 py-0"
                    >
                      Não Enviado
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isStep2Done
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Certificado Digital ICP-Brasil
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Envie seu certificado A1/A3 (.pfx, .p12 ou PDF) em Configurações.
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-600 space-y-0.5 bg-white/60 p-2 rounded-lg border border-slate-100">
                  <p className="flex items-center justify-between">
                    <span>Status atual:</span>
                    <strong className="capitalize text-slate-900">
                      {certStatusLabel === 'validado'
                        ? 'Validado'
                        : certStatusLabel === 'pendente'
                          ? 'Pendente'
                          : 'Não Enviado'}
                    </strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {certStatusLabel === 'validado'
                      ? 'Prescrições assinadas com validade legal plena.'
                      : 'Emissão flexível permitida até validação.'}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  size="sm"
                  variant={isStep2Done ? 'outline' : 'default'}
                  onClick={() => navigate('/configuracoes')}
                  className={`w-full text-xs h-8 ${
                    isStep2Done
                      ? 'border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold'
                  }`}
                >
                  {isStep2Done ? 'Gerenciar Certificado' : 'Subir Certificado'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            {/* ETAPA 3: EMITIR PRIMEIRA RECEITA */}
            <div
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isStep3Done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-white border-blue-200 text-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Etapa 3
                  </span>
                  {isStep3Done ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3" /> Receita Emitida
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] px-1.5 py-0"
                    >
                      Aguardando
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isStep3Done ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Emitir a Primeira Receita
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Prescreva com validação cruzada por IA, QR Code e envio multicanal.
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-600 space-y-0.5 bg-white/60 p-2 rounded-lg border border-slate-100">
                  <p className="flex items-center justify-between">
                    <span>Estado:</span>
                    <strong className="text-slate-900">
                      {isStep3Done ? 'Primeira prescrição ativa' : 'Nenhuma receita ainda'}
                    </strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Gera QR Code e código RX-XXXX-XXXX para validação em farmácias.
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  size="sm"
                  variant={isStep3Done ? 'outline' : 'default'}
                  onClick={() => navigate('/doctor/receitas')}
                  className={`w-full text-xs h-8 ${
                    isStep3Done
                      ? 'border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                  }`}
                >
                  {isStep3Done ? 'Nova Receita Médica' : 'Emitir 1ª Receita'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
