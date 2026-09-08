import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  KeyRound,
  Send,
  UserCheck,
  CheckCircle2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  checkActiveAccessGrant,
  requestPatientAccess,
  grantAccess24h,
} from '@/services/access_grants'
import { Patient, AccessGrant } from '@/types/clinical'

interface AccessGrantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  doctorUser?: { id: string; name: string; role?: string } | null
  onGranted?: (grant: AccessGrant) => void
}

export function AccessGrantModal({
  open,
  onOpenChange,
  patient,
  doctorUser,
  onGranted,
}: AccessGrantModalProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState('Consulta de rotina / teleconsulta agendada')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingGrant, setExistingGrant] = useState<AccessGrant | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (open && patient) {
      setChecking(true)
      checkActiveAccessGrant(patient.id, doctorUser?.id)
        .then((res) => {
          if (res.hasAccess && res.grant) {
            setExistingGrant(res.grant)
          } else {
            setExistingGrant(null)
          }
        })
        .finally(() => setChecking(false))
    }
  }, [open, patient, doctorUser?.id])

  // Simular autorização direta (para demonstração ágil ou consentimento assistido com paciente)
  const handleImmediate24hGrant = async () => {
    if (!patient) return
    setIsSubmitting(true)
    try {
      const grant = await grantAccess24h({
        patientId: patient.id,
        userId: doctorUser?.id,
        targetName: doctorUser?.name || 'Dr. Demo Médico',
        targetRole: (doctorUser?.role as any) || 'doctor',
        reason: reason || 'Atendimento clínico autorizado presencialmente',
      })
      toast({
        title: 'Acesso 24h Liberado!',
        description: `Concessão concedida com sucesso para o paciente ${patient.name}.`,
      })
      if (onGranted) onGranted(grant)
      onOpenChange(false)
    } catch {
      toast({
        title: 'Erro ao liberar acesso',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enviar solicitação ao aplicativo do paciente
  const handleSendRequest = async () => {
    if (!patient || !doctorUser) return
    setIsSubmitting(true)
    try {
      const grant = await requestPatientAccess({
        patientId: patient.id,
        doctorUserId: doctorUser.id,
        doctorName: doctorUser.name,
        role: (doctorUser.role as any) || 'doctor',
        reason,
      })
      toast({
        title: 'Solicitação Enviada ao Paciente!',
        description: `${patient.name} recebeu a notificação para autorizar seu acesso de 24 horas no app.`,
      })
      if (onGranted) onGranted(grant)
      onOpenChange(false)
    } catch {
      toast({
        title: 'Erro ao enviar solicitação',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!patient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <KeyRound className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Controle de Acesso 24h (Modelo Aberto)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            O histórico clínico pertence exclusivamente ao paciente <strong>{patient.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {existingGrant ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-bold">Você já possui concessão ativa de 24 horas!</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Válida até: {new Date(existingGrant.expires_at).toLocaleString('pt-BR')}
              </p>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {existingGrant.scope || 'Prontuário e Exames'}
              </Badge>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span className="font-bold">Autorização de Acesso Necessária</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Conforme a arquitetura de Modelo Aberto (ClueMed) e LGPD, para visualizar o
                histórico passado e exames de {patient.name}, você precisa solicitar uma concessão
                de 24 horas.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Motivo do Atendimento / Consulta
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Consulta clínica de rotina, análise de exames..."
              className="h-9 text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Regra de Expiração Automática:</span>
            </div>
            <p className="text-[10px] leading-tight">
              A concessão expira em 24h e todas as consultas são registradas na trilha de auditoria
              do paciente.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs w-full sm:w-auto"
          >
            Fechar
          </Button>

          <Button
            size="sm"
            onClick={handleImmediate24hGrant}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs w-full sm:w-auto"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            {isSubmitting ? 'Processando...' : 'Liberar Acesso 24h (Demo)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
