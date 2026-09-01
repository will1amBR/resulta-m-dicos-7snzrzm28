import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileCheck,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { CouncilType, CertificateStatus } from '@/types/clinical'
import { CertificateStatusBadge } from '@/components/CertificateStatusBadge'
import {
  uploadDoctorCertificate,
  updateCertificateStatus,
  removeDoctorCertificate,
} from '@/services/certificates'
import pb from '@/lib/pocketbase/client'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [crm, setCrm] = useState(user?.crm || '')
  const [councilType, setCouncilType] = useState<CouncilType>(
    (user?.council_type as CouncilType) || 'CRM',
  )
  const [councilNumber, setCouncilNumber] = useState(user?.council_number || '')

  // Certificate state
  const rawStatus = (user?.certificate_status || '').toLowerCase()
  const certStatus: CertificateStatus =
    rawStatus === 'validado' || rawStatus === 'active'
      ? 'validado'
      : rawStatus === 'pendente' || rawStatus === 'pending' || rawStatus === 'pending_validation'
        ? 'pendente'
        : 'nao_enviado'
  const certFile = user?.certificate_file || ''
  const [isUploadingCert, setIsUploadingCert] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (user?.id) {
        await pb.collection('users').update(user.id, {
          name,
          crm,
          council_type: councilType,
          council_number: councilNumber,
        })
        await refreshUser()
      }
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O certificado digital deve ter no máximo 10MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingCert(true)
    try {
      await uploadDoctorCertificate(user.id, file, 'pendente')
      await refreshUser()
      toast({
        title: 'Certificado enviado com sucesso!',
        description: 'Seu arquivo foi anexado e está pendente de validação ICP-Brasil.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar certificado',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingCert(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleQuickValidate = async (status: CertificateStatus) => {
    if (!user?.id) return
    try {
      await updateCertificateStatus(user.id, status)
      await refreshUser()
      toast({
        title: status === 'validado' ? 'Certificado Validado!' : 'Status atualizado',
        description:
          status === 'validado'
            ? 'Seu certificado ICP-Brasil agora está ativo para assinatura digital.'
            : `Status alterado para: ${status}`,
      })
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleRemoveCert = async () => {
    if (!user?.id) return
    try {
      await removeDoctorCertificate(user.id)
      await refreshUser()
      toast({
        title: 'Certificado removido',
        description: 'Você pode enviar um novo arquivo a qualquer momento.',
      })
    } catch {
      toast({ title: 'Erro ao remover certificado', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Perfil e Registro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            Perfil e Preferências Clínicas
          </CardTitle>
          <CardDescription className="text-xs">
            Mantenha seus dados profissionais atualizados para constarem nas receitas e prontuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Nome Profissional</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">CRM / UF (deprecated)</Label>
              <Input
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo de Conselho</Label>
                <Select value={councilType} onValueChange={(v) => setCouncilType(v as CouncilType)}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['CRM', 'CRN', 'CRP', 'CRO', 'COREN', 'CREFITO'] as CouncilType[]).map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Número do Conselho</Label>
                <Input
                  value={councilNumber}
                  onChange={(e) => setCouncilNumber(e.target.value)}
                  className="mt-1 text-xs"
                  placeholder="123456-SP"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border">
              {user?.council_approved ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    Registro profissional aprovado
                  </span>
                  <Badge className="bg-green-100 text-green-700 text-[10px] ml-auto">
                    Aprovado
                  </Badge>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span className="text-xs text-amber-700 font-medium">
                    Registro pendente de aprovação
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-auto">
                    Pendente
                  </Badge>
                </>
              )}
            </div>

            <div>
              <Label className="text-xs">E-mail de Cadastro</Label>
              <Input value={user?.email || ''} disabled className="mt-1 text-xs bg-slate-100" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/councils')}
                className="text-xs"
              >
                Painel Admin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Certificado Digital */}
      <Card className="border-slate-200 shadow-subtle overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Certificado Digital ICP-Brasil
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Gerencie sua assinatura digital para emissão de receitas e laudos médicos com
                validade jurídica.
              </CardDescription>
            </div>
            <div>
              <CertificateStatusBadge status={certStatus} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Informative banner about flexible emission */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950">Regra de Emissão Flexível</p>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Você <strong>pode emitir receitas normalmente</strong> mesmo sem o certificado
                validado. Nesse caso, a receita é emitida com um lembrete no sistema para
                regularizar o envio posteriormente.
              </p>
            </div>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors bg-slate-50/40">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.pfx,.p12,.crt,.cer"
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">
                  {certFile ? 'Substituir Certificado Digital' : 'Enviar Certificado Digital'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceitos: <strong>.pdf, .pfx, .p12, .crt</strong> (Certificados A1/A3
                  ICP-Brasil, máx. 10MB)
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingCert}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {isUploadingCert ? 'Enviando...' : 'Selecionar Arquivo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Current file details & actions */}
          {certFile && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {certFile}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Arquivo de certificado associado à conta
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCert}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                </Button>
              </div>

              {/* Status Simulator/Validator for Demo & Compliance */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Ambiente de validação da autoridade certificadora:
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={certStatus === 'validado' ? 'default' : 'outline'}
                    onClick={() => handleQuickValidate('validado')}
                    className={`text-xs h-7 ${certStatus === 'validado' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Validar ICP-Brasil
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={certStatus === 'pendente' ? 'default' : 'outline'}
                    onClick={() => handleQuickValidate('pendente')}
                    className={`text-xs h-7 ${certStatus === 'pendente' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Manter Pendente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Steps & Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                1. Padrão ICP-Brasil
              </span>
              <p className="text-slate-600 text-[11px]">
                Aceitamos certificados A1 (arquivo .pfx/.p12) e declarações assinadas digitalmente
                em PDF.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                2. Validação Rápida
              </span>
              <p className="text-slate-600 text-[11px]">
                A conferência dos dados criptográficos é realizada pela equipe técnica e validadores
                integrados.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">3. Emissão Segura</span>
              <p className="text-slate-600 text-[11px]">
                Suas prescrições recebem assinatura com carimbo do tempo e QR Code para verificação
                em farmácias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
