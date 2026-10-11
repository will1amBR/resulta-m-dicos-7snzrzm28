import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Stethoscope,
  Building2,
  Heart,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  FileBadge,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { getSpecialties } from '@/services/specialties'
import { Specialty, CouncilType, UserRole } from '@/types/clinical'
import { cn } from '@/lib/utils'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialRoleParam = searchParams.get('tipo') || searchParams.get('role')
  const defaultRole: UserRole =
    initialRoleParam === 'clinic' || initialRoleParam === 'patient' ? initialRoleParam : 'doctor'

  const [role, setRole] = useState<UserRole>(defaultRole)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [councilType, setCouncilType] = useState<CouncilType>('CRM')
  const [councilNumber, setCouncilNumber] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [lgpdAccepted, setLgpdAccepted] = useState(true)
  const [cnpj, setCnpj] = useState('')
  const [clinicAddress, setClinicAddress] = useState('')
  const [clinicContact, setClinicContact] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lgpdAccepted) {
      setError('É necessário concordar com os termos da LGPD para prosseguir.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (role === 'doctor' && !councilNumber.trim()) {
      setError('Informe o número do seu conselho profissional (CRM, CRN, etc.).')
      return
    }

    if (role === 'patient' && !cpf.trim()) {
      setError('Informe o CPF para vinculação dos seus exames e prontuários.')
      return
    }

    setError('')
    setLoading(true)

    const data: any = { role, email, password, name }

    if (role === 'doctor') {
      data.councilType = councilType
      data.councilNumber = councilNumber
      data.crm = `${councilType} ${councilNumber}`
      data.specialty = specialtyId || undefined
    } else if (role === 'clinic') {
      data.cnpj = cnpj
      data.clinicAddress = clinicAddress
      data.clinicContact = clinicContact
    } else if (role === 'patient') {
      data.cpf = cpf
      data.phone = phone
      data.birthDate = birthDate || undefined
    }

    const { error: err } = await signUp(data)
    setLoading(false)

    if (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Erro ao criar conta. Verifique se o e-mail já não está cadastrado.'
      setError(
        msg.includes('UNIQUE') || msg.includes('existing') || msg.includes('email')
          ? 'Este e-mail ou documento já possui cadastro. Faça login ou use outro.'
          : msg,
      )
    } else {
      if (role === 'clinic') {
        navigate('/clinic')
      } else if (role === 'patient') {
        navigate('/patient')
      } else {
        navigate('/dashboard')
      }
    }
  }

  const roleCards = [
    {
      id: 'doctor' as UserRole,
      title: 'Médico / Especialista',
      desc: 'Prescrições digitais, prontuário SOAP, teleconsulta e agenda.',
      icon: Stethoscope,
      badge: 'Atendimento',
      activeClass: 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-1 ring-blue-500',
    },
    {
      id: 'clinic' as UserRole,
      title: 'Clínica / Consultório',
      desc: 'Gestão de equipe, recepção, estoque e aprovação de conselhos.',
      icon: Building2,
      badge: 'Gestão',
      activeClass:
        'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm ring-1 ring-emerald-500',
    },
    {
      id: 'patient' as UserRole,
      title: 'Paciente',
      desc: 'Acesso soberano ao histórico, receitas com QR code e concessões 24h.',
      icon: Heart,
      badge: 'Soberania',
      activeClass:
        'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-1 ring-indigo-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-3 sm:p-6">
      {/* Brand Header */}
      <div className="text-center mb-5 space-y-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur border border-blue-400/30 transition-all"
        >
          <Stethoscope className="h-4 w-4 text-blue-300" />
          <span>Resulta Médicos • Ecossistema Unificado</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Crie sua Conta Gratuita
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
          Escolha seu perfil abaixo e acesse imediatamente o modelo aberto de saúde.
        </p>
      </div>

      <Card className="w-full max-w-xl bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="text-center space-y-1 pb-3 pt-5 px-4 sm:px-6">
          <CardTitle className="text-lg font-bold text-slate-900">
            Selecione seu Tipo de Conta
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            A plataforma adapta formulários, ferramentas e fluxos de acordo com seu perfil.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 space-y-4">
          {/* Role selector cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {roleCards.map((opt) => {
              const Icon = opt.icon
              const isSelected = role === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={cn(
                    'flex flex-col text-left p-3 rounded-xl border-2 transition-all relative overflow-hidden group',
                    isSelected
                      ? opt.activeClass
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-600',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? opt.id === 'doctor'
                            ? 'bg-blue-600 text-white'
                            : opt.id === 'clinic'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                  </div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight">
                    {opt.title}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {opt.desc}
                  </p>
                </button>
              )
            })}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {/* Nome / Razão Social */}
            <div>
              <Label className="text-xs text-slate-700 font-semibold">
                {role === 'clinic' ? 'Razão Social ou Nome Fantasia' : 'Nome Completo'}
              </Label>
              <div className="relative mt-1">
                <User className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder={
                    role === 'clinic'
                      ? 'Clínica Saúde & Vida Ltda'
                      : role === 'doctor'
                        ? 'Dr. Lucas Ferreira'
                        : 'Ana Carolina Silva'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* CAMPOS ESPECÍFICOS DE MÉDICO */}
            {role === 'doctor' && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <FileBadge className="h-4 w-4 text-blue-600" />
                  <span>Dados do Registro Profissional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-700">Conselho de Classe</Label>
                    <Select
                      value={councilType}
                      onValueChange={(v) => setCouncilType(v as CouncilType)}
                    >
                      <SelectTrigger className="mt-1 text-xs h-9 bg-white">
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
                    <Label className="text-xs text-slate-700">Número do Registro / UF</Label>
                    <Input
                      placeholder="Ex.: 123456-SP"
                      value={councilNumber}
                      onChange={(e) => setCouncilNumber(e.target.value)}
                      className="mt-1 text-xs h-9 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-700">Especialidade Principal</Label>
                  <Select value={specialtyId} onValueChange={setSpecialtyId}>
                    <SelectTrigger className="mt-1 text-xs h-9 bg-white">
                      <SelectValue placeholder="Selecione sua especialidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Isso ativará automaticamente os modelos de prontuário SOAP especializados na sua
                    tela.
                  </p>
                </div>
              </div>
            )}

            {/* CAMPOS ESPECÍFICOS DE CLÍNICA */}
            {role === 'clinic' && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>Dados do Consultório / Estabelecimento</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-700">CNPJ</Label>
                    <Input
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="mt-1 text-xs h-9 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-700">Telefone / WhatsApp</Label>
                    <Input
                      placeholder="(11) 3456-7890"
                      value={clinicContact}
                      onChange={(e) => setClinicContact(e.target.value)}
                      className="mt-1 text-xs h-9 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-700">Endereço Completo</Label>
                  <Input
                    placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="mt-1 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            )}

            {/* CAMPOS ESPECÍFICOS DE PACIENTE */}
            {role === 'patient' && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                  <Heart className="h-4 w-4 text-indigo-600" />
                  <span>Identificação do Paciente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-700">
                      CPF (Obrigatório para receitas)
                    </Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="mt-1 text-xs h-9 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-700">Celular / WhatsApp</Label>
                    <Input
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 text-xs h-9 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-700">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            )}

            {/* E-mail e Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <Label className="text-xs text-slate-700 font-semibold">E-mail de Acesso</Label>
                <div className="relative mt-1">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="voce@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-700 font-semibold">
                  Senha (mín. 8 dígitos)
                </Label>
                <div className="relative mt-1">
                  <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {/* Checkbox LGPD */}
            <div className="flex items-start gap-2 pt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <Checkbox
                id="lgpd"
                checked={lgpdAccepted}
                onCheckedChange={(c) => setLgpdAccepted(!!c)}
                className="mt-0.5"
              />
              <label
                htmlFor="lgpd"
                className="text-[11px] text-slate-600 cursor-pointer leading-tight"
              >
                Declaro conformidade com a <strong>LGPD</strong> e autorizo o tratamento de dados
                clínicos de acordo com o <strong>Modelo Aberto de Saúde</strong> e termos de
                segurança.
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 mt-3 shadow-md shadow-blue-600/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Criando sua conta...' : 'Concluir Cadastro e Acessar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t pt-3.5 pb-4 px-4 sm:px-6">
          <span>
            Já possui uma conta ativa?{' '}
            <Link to="/entrar" className="text-blue-600 font-bold ml-1 hover:underline">
              Fazer Login
            </Link>
          </span>
          <Link to="/" className="text-slate-400 hover:text-slate-600 text-[11px]">
            ← Voltar para a Landing
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
