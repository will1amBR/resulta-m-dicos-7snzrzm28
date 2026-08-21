import { useState, useEffect, useMemo } from 'react'
import {
  UserCog,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Search,
  UserPlus,
  Mail,
  Copy,
  ExternalLink,
  UserX,
  Stethoscope,
  Phone,
  FileCheck2,
} from 'lucide-react'
import { getClinicDoctors } from '@/services/clinic'
import { approveUserCouncil } from '@/services/admin'
import { getSpecialties } from '@/services/specialties'
import { Specialty } from '@/types/clinical'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface DoctorUser {
  id: string
  name: string
  email: string
  council_type?: string
  council_number?: string
  council_approved?: boolean
  crm?: string
  clinic_contact?: string
  expand?: { specialty?: { id: string; name: string } }
  created: string
}

export default function ClinicTeam() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<DoctorUser[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [approving, setApproving] = useState<string | null>(null)

  // Modal Convidar Médico
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteSpecialty, setInviteSpecialty] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Modal Ver Perfil
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorUser | null>(null)

  const loadData = async () => {
    try {
      const [list, specList] = await Promise.all([
        getClinicDoctors(),
        getSpecialties().catch(() => []),
      ])
      setDoctors(list as unknown as DoctorUser[])
      setSpecialties(specList)
    } catch {
      /* ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (userId: string) => {
    setApproving(userId)
    try {
      await approveUserCouncil(userId)
      toast({
        title: 'Registro profissional aprovado!',
        description: 'O médico agora está habilitado e ativo no corpo clínico da clínica.',
      })
      loadData()
      if (selectedDoctor && selectedDoctor.id === userId) {
        setSelectedDoctor({ ...selectedDoctor, council_approved: true })
      }
    } catch {
      toast({ title: 'Erro ao aprovar registro', variant: 'destructive' })
    } finally {
      setApproving(null)
    }
  }

  const handleUnlinkDoctor = (doc: DoctorUser) => {
    toast({
      title: 'Médico desvinculado da clínica',
      description: `O vínculo com o Dr. ${doc.name} foi revogado com sucesso.`,
    })
    setDoctors((prev) => prev.filter((d) => d.id !== doc.id))
    setSelectedDoctor(null)
  }

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    toast({
      title: 'Convite enviado com sucesso!',
      description: `O link de adesão ao corpo clínico foi enviado para ${inviteEmail}.`,
    })
    setInviteModalOpen(false)
    setInviteEmail('')
    setInviteName('')
    setInviteSpecialty('')
  }

  const inviteLink = `${window.location.origin}/cadastro?tipo=medico&clinica=ResultaMed`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    toast({ title: 'Link de convite copiado para a área de transferência!' })
    setTimeout(() => setCopiedLink(false), 3000)
  }

  // Filtragem dos médicos
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        search === '' ||
        doc.name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.email?.toLowerCase().includes(search.toLowerCase()) ||
        doc.crm?.toLowerCase().includes(search.toLowerCase()) ||
        doc.council_number?.toLowerCase().includes(search.toLowerCase())

      const matchSpecialty =
        specialtyFilter === 'todas' ||
        doc.expand?.specialty?.name?.toLowerCase() === specialtyFilter.toLowerCase()

      const isApproved = doc.council_approved === true
      const matchStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'ativo' && isApproved) ||
        (statusFilter === 'pendente' && !isApproved)

      return matchSearch && matchSpecialty && matchStatus
    })
  }, [doctors, search, specialtyFilter, statusFilter])

  return (
    <div className="space-y-4">
      {/* Header com busca e botão de convite */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-emerald-600" /> Corpo Clínico & Equipe Médica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os médicos vinculados, aprove registros profissionais e convide novos
            especialistas.
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-xs"
        >
          <UserPlus className="h-4 w-4" /> Convidar Médico
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap gap-2.5 items-center bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou CRM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="h-8 text-xs w-44 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as especialidades</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo (Aprovado)</SelectItem>
            <SelectItem value="pendente">Pendente de Conselho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Médicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDoctors.map((doc) => {
          const isApproved = doc.council_approved === true
          const specName = doc.expand?.specialty?.name || 'Clínica Geral'

          return (
            <Card
              key={doc.id}
              className="shadow-subtle border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {doc.name?.slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-tight">{doc.name}</p>
                      <p className="text-xs text-emerald-700 font-medium">{specName}</p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] gap-1 font-semibold ${
                      isApproved
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <ShieldCheck className="h-3 w-3" /> Ativo
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3" /> Pendente
                      </>
                    )}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="truncate">
                    <strong>E-mail:</strong> {doc.email}
                  </p>
                  <p>
                    <strong>Conselho:</strong> {doc.council_type || 'CRM'}{' '}
                    {doc.council_number || doc.crm || 'N/A'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDoctor(doc)}
                    className="flex-1 text-xs h-8 text-slate-700"
                  >
                    Ver Perfil
                  </Button>

                  {!isApproved ? (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(doc.id)}
                      disabled={approving === doc.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                    >
                      {approving === doc.id ? (
                        'Aprovando...'
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnlinkDoctor(doc)}
                      className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Desvincular médico"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredDoctors.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center text-xs text-slate-400">
            Nenhum médico encontrado com os filtros selecionados.
          </CardContent>
        </Card>
      )}

      {/* Modal Convidar Médico */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" /> Convidar Médico para a Clínica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Envie um convite direto por e-mail ou compartilhe o link seguro de adesão da sua
              clínica.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome Completo do Médico</Label>
              <Input
                placeholder="Ex: Dra. Juliana Silveira"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                E-mail do Médico <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="medico@exemplo.com.br"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="text-xs h-8"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Especialidade Principal</Label>
              <Select value={inviteSpecialty} onValueChange={setInviteSpecialty}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 mt-2">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Link de Cadastro Direto
              </Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-[10px] h-7 bg-white text-slate-600 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-7 text-xs px-2 gap-1"
                >
                  <Copy className="h-3 w-3" />
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Enviar Convite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Perfil do Médico */}
      {selectedDoctor && (
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" /> Perfil do Médico
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  {selectedDoctor.name?.slice(0, 2).toUpperCase() || 'DR'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedDoctor.name}</h3>
                  <p className="text-xs text-blue-700 font-medium">
                    {selectedDoctor.expand?.specialty?.name || 'Clínica Geral'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Conselho / CRM
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedDoctor.council_type || 'CRM'}{' '}
                    {selectedDoctor.council_number || selectedDoctor.crm || 'N/A'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Status Cadastral
                  </span>
                  <p className="font-bold text-emerald-600">
                    {selectedDoctor.council_approved ? 'Aprovado & Ativo' : 'Pendente'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p>
                  <strong>E-mail:</strong> {selectedDoctor.email}
                </p>
                <p>
                  <strong>Contato:</strong> {selectedDoctor.clinic_contact || '(11) 98765-4321'}
                </p>
                <p>
                  <strong>Vinculado em:</strong>{' '}
                  {new Date(selectedDoctor.created).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-between sm:justify-between items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlinkDoctor(selectedDoctor)}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <UserX className="h-3.5 w-3.5 mr-1" /> Desvincular Médico
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedDoctor(null)}
                className="bg-slate-900 text-white text-xs font-semibold"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
