import { useState } from 'react'
import {
  Mail,
  MessageCircle,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Send,
  Loader2,
  FileCheck,
  AlertTriangle,
  Info,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { PrescriptionRecord } from '@/types/clinical'
import {
  sendPrescriptionEmail,
  buildWhatsAppPrescriptionUrl,
  buildSmsPrescriptionText,
  updatePrescriptionStatus,
  getVerificationUrl,
} from '@/services/prescriptions'
import { QRCodeSVG } from '@/components/QRCodeSVG'

interface PrescriptionSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prescription: PrescriptionRecord | null
  onSuccess?: () => void
}

export function PrescriptionSendModal({
  open,
  onOpenChange,
  prescription,
  onSuccess,
}: PrescriptionSendModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms'>('email')

  // Patient info defaults
  const patient = prescription?.expand?.patient_id
  const doctor = prescription?.expand?.doctor_id
  const [email, setEmail] = useState(patient?.email || '')
  const [phone, setPhone] = useState(patient?.phone || '')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [copiedSms, setCopiedSms] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!prescription) return null

  const patientName = patient?.name || 'Paciente'
  const doctorName = doctor?.name || 'Médico Prescritor'
  const doctorCrm = doctor?.crm || doctor?.council_number || ''
  const medications = prescription.medications || []
  const verificationCode = prescription.verification_code || prescription.id
  const verificationUrl = getVerificationUrl(verificationCode)

  // WhatsApp URL
  const whatsAppUrl = buildWhatsAppPrescriptionUrl({
    phone,
    patientName,
    doctorName,
    doctorCrm,
    medications,
    prescriptionId: prescription.id,
    verificationCode,
  })

  // SMS Text
  const smsText = buildSmsPrescriptionText({
    patientName,
    doctorName,
    medications,
    verificationCode,
  })

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast({
        title: 'E-mail obrigatório',
        description: 'Por favor informe o endereço de e-mail do paciente.',
        variant: 'destructive',
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const res = await sendPrescriptionEmail({
        prescriptionId: prescription.id,
        email: email.trim(),
        patientName,
        doctorName,
        doctorCrm,
        medications,
      })

      if (res.success) {
        toast({
          title: res.emailSent ? 'E-mail Enviado!' : 'E-mail Processado!',
          description: res.message,
        })
        await updatePrescriptionStatus(prescription.id, {
          status: 'enviada',
          sent_via: 'email',
          sent_at: new Date().toISOString(),
        })
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (err: any) {
      toast({
        title: 'Erro no envio',
        description: err?.message || 'Não foi possível enviar o e-mail.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleOpenWhatsApp = async () => {
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer')
    try {
      await updatePrescriptionStatus(prescription.id, {
        status: 'enviada',
        sent_via: 'whatsapp',
        sent_at: new Date().toISOString(),
      })
      onSuccess?.()
    } catch {
      /* intentionally ignored */
    }

    toast({
      title: 'WhatsApp Aberto',
      description: 'Conversa iniciada com a receita pré-formatada para envio.',
    })
  }

  const handleCopySms = async () => {
    try {
      await navigator.clipboard.writeText(smsText)
      setCopiedSms(true)
      setTimeout(() => setCopiedSms(false), 2500)
      try {
        await updatePrescriptionStatus(prescription.id, {
          status: 'enviada',
          sent_via: 'sms',
          sent_at: new Date().toISOString(),
        })
        onSuccess?.()
      } catch {
        /* intentionally ignored */
      }

      toast({
        title: 'Texto SMS Copiado!',
        description: 'Cole no aplicativo de mensagens ou celular para enviar ao paciente.',
      })
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie o texto manualmente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Enviar Receita Médica Digital
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Receita de <strong>{patientName}</strong> • {medications.length} medicamento(s)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Certificate Alert Warning if not validated */}
        {!prescription.certificate_validated && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-950">Certificado Digital não validado</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                A receita possui QR Code e código de verificação para farmácias, porém sem o selo de
                assinatura ICP-Brasil. Você pode regularizar seu certificado a qualquer momento.
              </p>
            </div>
          </div>
        )}

        {/* QR Code and verification box banner inside send modal */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-slate-300 shrink-0">
              <QRCodeSVG value={verificationUrl} size={48} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Código de Verificação da Farmácia:</p>
              <p className="font-mono text-blue-700 font-bold">{verificationCode}</p>
            </div>
          </div>
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-medium"
          >
            Ver página pública <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'email' | 'whatsapp' | 'sms')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1">
            <TabsTrigger
              value="email"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              <span>E-mail</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
              <span>SMS</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB EMAIL */}
          <TabsContent value="email" className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">E-mail do Paciente</Label>
              <Input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                O paciente receberá a receita completa formatada em HTML com lista posológica e
                instruções de uso.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Prévia do Conteúdo:
              </span>
              <p className="text-slate-800 font-medium">
                Assunto: Sua Receita Médica Digital — Dr(a). {doctorName}
              </p>
              <div className="text-[11px] text-slate-600 space-y-1 pl-2 border-l-2 border-blue-400">
                {medications.slice(0, 3).map((m, idx) => (
                  <p key={idx}>
                    • <strong>{m.medication}</strong> ({m.dosage}){' '}
                    {m.frequency && `- ${m.frequency}`}
                  </p>
                ))}
                {medications.length > 3 && (
                  <p className="text-slate-400 italic">
                    ... e mais {medications.length - 3} medicamento(s)
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando E-mail...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Receita por E-mail
                </>
              )}
            </Button>
          </TabsContent>

          {/* TAB WHATSAPP */}
          <TabsContent value="whatsapp" className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Telefone / WhatsApp do Paciente
              </Label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Gera um link oficial{' '}
                <code className="text-emerald-700 font-mono">https://wa.me/</code> com a mensagem
                pronta.
              </p>
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 text-emerald-950 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                Mensagem Formatada do WhatsApp:
              </span>
              <p className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto bg-white p-2 rounded border border-emerald-100">
                *RECEITA MÉDICA DIGITAL — RESULTA MÉDICOS*{'\n'}
                *Paciente:* {patientName}
                {'\n'}
                *Médico:* Dr(a). {doctorName} ({doctorCrm}){'\n\n'}
                {medications
                  .map(
                    (m, i) =>
                      `${i + 1}. *${m.medication}* - ${m.dosage} (${m.frequency || 'Conforme prescrição'})\n`,
                  )
                  .join('')}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir Conversa no WhatsApp
            </Button>
          </TabsContent>

          {/* TAB SMS */}
          <TabsContent value="sms" className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Texto Otimizado para SMS
              </Label>
              <p className="text-[11px] text-slate-500">
                Texto compacto e direto para envio via operadora pelo smartphone ou gateway de SMS.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {smsText.length} caracteres
                </span>
                <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50">
                  SMS Padrão
                </Badge>
              </div>
              <p className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded border border-slate-200 text-slate-800">
                {smsText}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCopySms}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9"
            >
              {copiedSms ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Texto Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Texto para SMS
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-600"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
