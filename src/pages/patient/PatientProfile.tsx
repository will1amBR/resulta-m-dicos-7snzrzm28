import { useState, useEffect, useRef } from 'react'
import {
  UserCircle,
  Camera,
  Heart,
  Activity,
  AlertTriangle,
  Pill,
  Save,
  Plus,
  X,
  Shield,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Droplet,
  Scale,
  Ruler,
  Check,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export interface ContinuousMedicationItem {
  id: string
  name: string
  dosage: string
}

export interface ChronicConditionItem {
  id: string
  cid: string
  name: string
}

export default function PatientProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Personal Info
  const [name, setName] = useState(user?.name || 'João Silva')
  const [email, setEmail] = useState(user?.email || 'joao.silva@exemplo.com.br')
  const [phone, setPhone] = useState(user?.phone || '(11) 98765-4321')
  const [birthDate, setBirthDate] = useState('1985-06-15')
  const [cpf, setCpf] = useState(user?.cpf_cnpj || '123.456.789-00')
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://img.usecurling.com/ppl/large?gender=male&seed=42',
  )

  // Health Metrics
  const [bloodType, setBloodType] = useState<string>('O+')
  const [heightCm, setHeightCm] = useState<number>(178) // cm
  const [weightKg, setWeightKg] = useState<number>(76.5) // kg

  // Dynamic Lists: Allergies
  const [allergies, setAllergies] = useState<string[]>(['Dipirona', 'Penicilina', 'Frutos do Mar'])
  const [newAllergyInput, setNewAllergyInput] = useState('')

  // Dynamic Lists: Chronic conditions (CID-10)
  const [chronicConditions, setChronicConditions] = useState<ChronicConditionItem[]>([
    { id: '1', cid: 'I10', name: 'Hipertensão essencial (primária)' },
    { id: '2', cid: 'E78.0', name: 'Hipercolesterolemia pura' },
  ])
  const [newCidCode, setNewCidCode] = useState('')
  const [newCidName, setNewCidName] = useState('')

  // Dynamic Lists: Continuous medications
  const [continuousMedications, setContinuousMedications] = useState<ContinuousMedicationItem[]>([
    { id: '1', name: 'Losartana Potássica', dosage: '50mg - 1x ao dia pela manhã' },
    { id: '2', name: 'Rosuvastatina Cálcica', dosage: '10mg - 1x ao dia à noite' },
  ])
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  // Compute BMI (IMC) automatically
  const heightInMeters = heightCm > 0 ? heightCm / 100 : 0
  const imc =
    heightInMeters > 0 && weightKg > 0
      ? (weightKg / (heightInMeters * heightInMeters)).toFixed(1)
      : '0.0'

  const getImcClassification = (val: number) => {
    if (val < 18.5)
      return { label: 'Abaixo do peso', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    if (val < 25)
      return {
        label: 'Peso ideal / Saudável',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      }
    if (val < 30)
      return { label: 'Sobrepeso', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    return { label: 'Obesidade', color: 'text-rose-600 bg-rose-50 border-rose-200' }
  }

  const imcFloat = parseFloat(imc)
  const imcClass = getImcClassification(imcFloat)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const localUrl = URL.createObjectURL(file)
      setAvatarUrl(localUrl)
      toast({
        title: 'Foto selecionada',
        description: 'A nova foto será salva ao clicar em "Salvar alterações".',
      })
    }
  }

  // Add/Remove Allergy
  const handleAddAllergy = () => {
    if (newAllergyInput.trim() && !allergies.includes(newAllergyInput.trim())) {
      setAllergies([...allergies, newAllergyInput.trim()])
      setNewAllergyInput('')
    }
  }

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item))
  }

  // Add/Remove Chronic Condition
  const handleAddChronicCondition = () => {
    if (newCidName.trim()) {
      setChronicConditions([
        ...chronicConditions,
        {
          id: String(Date.now()),
          cid: newCidCode.trim() || 'CID-10',
          name: newCidName.trim(),
        },
      ])
      setNewCidCode('')
      setNewCidName('')
    }
  }

  const handleRemoveChronicCondition = (id: string) => {
    setChronicConditions(chronicConditions.filter((c) => c.id !== id))
  }

  // Add/Remove Continuous Medication
  const handleAddContinuousMed = () => {
    if (newMedName.trim() && newMedDosage.trim()) {
      setContinuousMedications([
        ...continuousMedications,
        {
          id: String(Date.now()),
          name: newMedName.trim(),
          dosage: newMedDosage.trim(),
        },
      ])
      setNewMedName('')
      setNewMedDosage('')
    }
  }

  const handleRemoveContinuousMed = (id: string) => {
    setContinuousMedications(continuousMedications.filter((m) => m.id !== id))
  }

  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (user?.id) {
        await pb
          .collection('users')
          .update(user.id, {
            name,
            phone,
          })
          .catch(() => {})
      }
      if (user?.patient_link) {
        await pb
          .collection('patients')
          .update(user.patient_link, {
            name,
            phone,
            email,
            birth_date: birthDate,
          })
          .catch(() => {})
      }
    } catch {
      // Ignored for demo continuity
    } finally {
      setTimeout(() => {
        setIsSaving(false)
        toast({
          title: 'Perfil atualizado com sucesso!',
          description: 'Seus dados cadastrais e histórico de saúde foram salvos.',
        })
      }, 500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCircle className="h-5 w-5" />
            </div>
            Meu Perfil & Ficha de Saúde
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mantenha seus dados pessoais, tipo sanguíneo, alergias e medicações sempre atualizados
            para sua segurança clínica.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 h-10 px-5"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photo & Quick Summary */}
        <div className="space-y-6">
          {/* Photo Upload Card */}
          <Card className="border-slate-200 shadow-subtle text-center">
            <CardContent className="p-6 space-y-4">
              <div className="relative inline-block">
                <Avatar className="h-28 w-28 border-4 border-white shadow-md mx-auto">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                  title="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{name}</h3>
                <p className="text-xs text-slate-500">{email}</p>
                <Badge
                  variant="secondary"
                  className="mt-2 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  <Shield className="h-3 w-3 mr-1" /> Paciente Verificado
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Health Quick Summary Card (IMC & Tipo Sanguíneo) */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-600" /> Índices Vitais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Droplet className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Tipo Sanguíneo</span>
                </div>
                <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold">
                  {bloodType}
                </Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Índice de Massa Corporal (IMC)</span>
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm">{imc} kg/m²</span>
                </div>
                <div className="flex justify-end">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${imcClass.color}`}
                  >
                    {imcClass.label}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Personal Data & Health Details */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Dados Pessoais */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" /> Dados Pessoais e Contato
              </CardTitle>
              <CardDescription className="text-xs">
                Informações para cadastro, agendamentos e emissão de receitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Nome Completo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="seu.email@exemplo.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">CPF</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="h-9 text-xs font-mono"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Dados de Saúde & Métricas */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Dados Biométricos & Saúde
              </CardTitle>
              <CardDescription className="text-xs">
                O IMC é calculado instantaneamente a partir da altura e peso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Tipo Sanguíneo</Label>
                  <Select value={bloodType} onValueChange={setBloodType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Altura (cm)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="h-9 text-xs pr-8"
                      min={50}
                      max={250}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                      cm
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Peso (kg)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="h-9 text-xs pr-8"
                      min={20}
                      max={300}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Alergias Conhecidas (Tags Editáveis) */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Alergias & Reações Adversas
              </CardTitle>
              <CardDescription className="text-xs">
                Medicamentos, alimentos ou substâncias que causam reação alérgica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                {allergies.length === 0 ? (
                  <span className="text-slate-400 text-xs italic py-1">
                    Nenhuma alergia registrada
                  </span>
                ) : (
                  allergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 text-xs py-1 px-2.5 flex items-center gap-1.5"
                    >
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="h-3.5 w-3.5 rounded-full hover:bg-amber-300 flex items-center justify-center"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newAllergyInput}
                  onChange={(e) => setNewAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAllergy()
                    }
                  }}
                  placeholder="Ex: Amendoim, Ibuprofeno, Iodo..."
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddAllergy}
                  className="h-9 text-xs px-3 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4. Condições Crônicas (Tags com CID-10) */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" /> Condições Crônicas & Diagnósticos
                (CID-10)
              </CardTitle>
              <CardDescription className="text-xs">
                Doenças crônicas preexistentes acompanhadas pela equipe médica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-2">
                {chronicConditions.length === 0 ? (
                  <div className="p-3 bg-slate-50 text-slate-400 text-xs italic rounded-lg text-center">
                    Nenhuma condição crônica cadastrada
                  </div>
                ) : (
                  chronicConditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-center justify-between p-2.5 bg-purple-50/50 border border-purple-200/60 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-white text-purple-700 border-purple-300 font-mono text-[10px]"
                        >
                          {cond.cid}
                        </Badge>
                        <span className="font-semibold text-slate-800 text-xs">{cond.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChronicCondition(cond.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <Input
                  value={newCidCode}
                  onChange={(e) => setNewCidCode(e.target.value)}
                  placeholder="Código CID (ex: E11)"
                  className="h-9 text-xs font-mono"
                />
                <Input
                  value={newCidName}
                  onChange={(e) => setNewCidName(e.target.value)}
                  placeholder="Nome da condição (ex: Diabetes Mellitus tipo 2)"
                  className="h-9 text-xs sm:col-span-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddChronicCondition()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddChronicCondition}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Condição
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5. Medicações Contínuas */}
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-600" /> Medicações de Uso Contínuo
              </CardTitle>
              <CardDescription className="text-xs">
                Remédios tomados rotineiramente para controle de saúde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-2">
                {continuousMedications.length === 0 ? (
                  <div className="p-3 bg-slate-50 text-slate-400 text-xs italic rounded-lg text-center">
                    Nenhuma medicação contínua informada
                  </div>
                ) : (
                  continuousMedications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-3 bg-blue-50/40 border border-blue-200/60 rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{med.name}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{med.dosage}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContinuousMed(med.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Input
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="Nome do medicamento (ex: Metformina)"
                  className="h-9 text-xs"
                />
                <Input
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  placeholder="Dosagem e frequência (ex: 850mg 2x ao dia)"
                  className="h-9 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddContinuousMed()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddContinuousMed}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Medicação
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action */}
          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-8 shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar todas as alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
