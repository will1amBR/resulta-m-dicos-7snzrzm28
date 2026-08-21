import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Building2,
  CreditCard,
  Check,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Save,
  Sparkles,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { updateClinicProfile } from '@/services/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ClinicSettings() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || 'Clínica Demo Resulta')
  const [cnpj, setCnpj] = useState(user?.cpf_cnpj || '12.345.678/0001-90')
  const [address, setAddress] = useState(
    user?.clinic_address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  )
  const [contact, setContact] = useState(
    user?.clinic_contact || '(11) 3000-1000 / contato@resultamed.com.br',
  )
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (user?.id) {
        await updateClinicProfile(user.id, {
          name,
          cpf_cnpj: cnpj,
          clinic_address: address,
          clinic_contact: contact,
        })
        await refreshUser()
      }
      toast({
        title: 'Perfil da clínica atualizado!',
        description: 'Os dados cadastrais da clínica foram salvos com sucesso.',
      })
    } catch {
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-emerald-600" /> Configurações & Perfil da Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie as informações institucionais, dados de contato e plano de assinatura.
          </p>
        </div>

        <Badge className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1 gap-1 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5" /> Clínica Verificada
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal de Perfil (2 Colunas) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Building2 className="h-4 w-4 text-blue-600" /> Dados Cadastrais & Institucionais
              </CardTitle>
              <CardDescription className="text-xs">
                Estas informações aparecem no cabeçalho das prescrições, atestados e faturas
                emitidas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Razão Social / Nome da Clínica <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                    placeholder="Ex: Clínica Médica Especializada Santa Clara"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Endereço Completo da Unidade
                  </Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                    placeholder="Rua / Avenida, Número, Bairro, Cidade - UF, CEP"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> Telefones & E-mails de Contato
                    da Recepção
                  </Label>
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                    placeholder="(11) 3000-0000 / recepcao@suaclinica.com.br"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-5 gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando Alterações...' : 'Salvar Informações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Plano, Assinatura e Segurança (1 Coluna) */}
        <div className="space-y-6">
          {/* Card de Plano */}
          <Card className="border-slate-200 shadow-subtle bg-gradient-to-br from-emerald-50/60 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <CreditCard className="h-4 w-4 text-emerald-600" /> Plano & Gestão
                </CardTitle>
                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                  <Check className="h-3 w-3" /> Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <p className="font-bold text-slate-900 text-sm">Plano Enterprise Clínicas</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Médicos Ilimitados · Prontuário CFM · IA Prescritiva
                </p>
              </div>

              <div className="space-y-2 text-slate-600 text-[11px]">
                <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Cruzamento de Interações com
                  IA Ativo
                </p>
                <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Telemedicina com Sala
                  Virtual Integrada
                </p>
                <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Secretaria Central & Gestão
                  de CRM
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Renovação Automática:</span>
                <span className="font-bold text-slate-800">
                  {new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card de Segurança e Conformidade */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" /> Conformidade & Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] text-slate-500">
              <p>• Dados criptografados em repouso e trânsito (AES-256).</p>
              <p>• Backups automáticos diários em nuvem.</p>
              <p>
                • Em conformidade com a LGPD e resoluções do CFM e Conselhos Regionais de Saúde.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
