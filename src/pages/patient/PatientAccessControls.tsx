import { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  UserX,
  History,
  AlertTriangle,
  RefreshCw,
  Plus,
  KeyRound,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AccessGrant, AccessAuditLog } from '@/types/clinical'
import {
  getPatientAccessGrants,
  grantAccess24h,
  revokeAccessGrant,
  getAccessAuditLogs,
} from '@/services/access_grants'
import { LgpdAuditReportModal } from '@/components/LgpdAuditReportModal'
import { FileSpreadsheet, Printer } from 'lucide-react'

export default function PatientAccessControls() {
  const { user } = useAuth()
  const { toast } = useToast()

  const patientId = user?.patient_link || '6ct3xtcobw4xmkm' // fallback demo paciente

  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [auditLogs, setAuditLogs] = useState<AccessAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'concessoes' | 'auditoria'>('concessoes')

  // Modal de Conceder Novo Acesso 24h
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [newTargetName, setNewTargetName] = useState('')
  const [newTargetRole, setNewTargetRole] = useState<'doctor' | 'clinic'>('doctor')
  const [newReason, setNewReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false)

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [grantsData, auditData] = await Promise.all([
        getPatientAccessGrants(patientId),
        getAccessAuditLogs(patientId),
      ])
      setGrants(grantsData)
      setAuditLogs(auditData)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  // Contagem regressiva / cálculo de tempo restante em horas e minutos
  const getRemainingTime = (expiresAt: string) => {
    const totalMs = new Date(expiresAt).getTime() - new Date().getTime()
    if (totalMs <= 0) return { expired: true, text: 'Expirada' }

    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    return {
      expired: false,
      text: `${hours}h ${minutes}m restantes`,
      hours,
    }
  }

  // Revogar concessão
  const handleRevoke = async (grantId: string, targetName: string) => {
    try {
      await revokeAccessGrant(grantId, patientId)
      toast({
        title: 'Acesso Revogado com Sucesso!',
        description: `O profissional/clínica ${targetName} não possui mais acesso ao seu prontuário.`,
      })
      loadData()
    } catch {
      toast({
        title: 'Erro ao revogar acesso',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // Conceder Acesso 24h
  const handleCreateGrant = async () => {
    if (!newTargetName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do médico ou clínica a autorizar.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await grantAccess24h({
        patientId,
        targetName: newTargetName.trim(),
        targetRole: newTargetRole,
        reason: newReason.trim() || 'Consulta médica ou exame presencial',
      })
      toast({
        title: 'Acesso de 24h Autorizado!',
        description: `${newTargetName} poderá consultar seus registros pelas próximas 24 horas.`,
      })
      setGrantModalOpen(false)
      setNewTargetName('')
      setNewReason('')
      loadData()
    } catch {
      toast({
        title: 'Erro ao autorizar acesso',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Aceitar solicitação pendente
  const handleAcceptPending = async (grant: AccessGrant) => {
    try {
      await grantAccess24h({
        patientId,
        userId: grant.granted_to_user,
        targetName: grant.target_name || 'Profissional',
        targetRole: grant.target_role || 'doctor',
        reason: grant.reason || 'Solicitação clínica aceita pelo paciente',
      })
      // Marcar anterior como ativa ou remover
      await revokeAccessGrant(grant.id, patientId)
      toast({
        title: 'Solicitação Autorizada por 24h!',
        description: `Acesso liberado com sucesso para ${grant.target_name}.`,
      })
      loadData()
    } catch {
      toast({ title: 'Erro ao aceitar solicitação', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Banner Principal de Modelo Aberto (ClueMed) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ecossistema Aberto • Seus Dados Pertencem a Você
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Controles de Acesso & Consentimento (24h)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              No modelo aberto Resulta Médicos, o seu histórico clínico é de sua propriedade
              exclusiva. Cada profissional ou clínica só acessa seu prontuário mediante concessão
              ativa de até 24 horas, com auditoria completa de quem visualizou.
            </p>
          </div>

          <Button
            onClick={() => setGrantModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-5 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Autorizar Novo Profissional (24h)
          </Button>
        </div>

        {/* Badges de estatísticas de privacidade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Concessões Ativas</span>
            <span className="text-lg font-bold text-emerald-400">
              {grants.filter((g) => g.status === 'ativa').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Solicitações Pendentes</span>
            <span className="text-lg font-bold text-amber-400">
              {grants.filter((g) => g.status === 'pendente').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Validade Padrão</span>
            <span className="text-lg font-bold text-blue-300">24 Horas</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Auditoria LGPD</span>
            <span className="text-lg font-bold text-indigo-300">100% Rastreado</span>
          </div>
        </div>
      </div>

      {/* Tabs: Concessões Ativas vs Histórico de Auditoria */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'concessoes' | 'auditoria')}
        className="w-full space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger
              value="concessoes"
              className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-2 font-semibold"
            >
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Profissionais Autorizados</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-200">
                {grants.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="auditoria"
              className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs flex items-center gap-2 font-semibold"
            >
              <History className="h-4 w-4 text-slate-600" />
              <span>Registro de Auditoria (Logs)</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-200">
                {auditLogs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLgpdModalOpen(true)}
              className="text-xs h-8 text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
              Exportar Trilha LGPD (CSV/PDF)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs h-8 text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />{' '}
              Atualizar
            </Button>
          </div>
        </div>

        {/* TAB 1: CONCESSÕES DE ACESSO */}
        <TabsContent value="concessoes" className="space-y-4">
          {/* Alerta de solicitações pendentes se houver */}
          {grants.filter((g) => g.status === 'pendente').length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <h3 className="font-bold text-sm">
                  Você possui solicitações de acesso aguardando autorização
                </h3>
              </div>
              <div className="space-y-2">
                {grants
                  .filter((g) => g.status === 'pendente')
                  .map((g) => (
                    <div
                      key={g.id}
                      className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{g.target_name}</p>
                        <p className="text-slate-600 text-[11px]">
                          Motivo:{' '}
                          <strong>{g.reason || 'Atendimento de teleconsulta ou presencial'}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptPending(g)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Autorizar por 24h
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevoke(g.id, g.target_name || 'Profissional')}
                          className="text-rose-600 hover:bg-rose-50 text-xs h-8"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de Concessões */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              Carregando controles de acesso...
            </div>
          ) : grants.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-xs text-slate-400 space-y-3">
                <Shield className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhum profissional com acesso
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Seus dados estão protegidos. Quando você for atendido por um médico ou clínica,
                  autorize o acesso por 24 horas aqui.
                </p>
                <Button
                  size="sm"
                  onClick={() => setGrantModalOpen(true)}
                  className="bg-blue-600 text-white text-xs mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Conceder Acesso 24h
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {grants.map((grant) => {
                const remaining = getRemainingTime(grant.expires_at)
                const isGrantActive = grant.status === 'ativa' && !remaining.expired
                const isClinic = grant.target_role === 'clinic'

                return (
                  <Card
                    key={grant.id}
                    className={`border transition-all ${
                      isGrantActive
                        ? 'border-emerald-200 bg-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 opacity-80'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Dados do Alvo */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                            isGrantActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isClinic ? (
                            <Building2 className="h-5 w-5" />
                          ) : (
                            <Stethoscope className="h-5 w-5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {grant.target_name || 'Profissional de Saúde'}
                            </h4>
                            <Badge
                              className={`text-[10px] font-bold ${
                                isGrantActive
                                  ? 'bg-emerald-600 text-white'
                                  : grant.status === 'pendente'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-300 text-slate-700'
                              }`}
                            >
                              {isGrantActive
                                ? '✓ Acesso Ativo (24h)'
                                : grant.status === 'pendente'
                                  ? 'Aguardando Consentimento'
                                  : grant.status === 'revogada'
                                    ? 'Revogado pelo Paciente'
                                    : 'Expirado'}
                            </Badge>

                            {/* Badge com contagem regressiva */}
                            {isGrantActive && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] font-mono flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3 text-emerald-600" />
                                {remaining.text}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-slate-600">
                            <strong>Escopo liberado:</strong>{' '}
                            {grant.scope?.replace(/,/g, ' • ') ||
                              'Prontuário completo, exames e receitas'}
                          </p>

                          {grant.reason && (
                            <p className="text-[11px] text-slate-500 italic">
                              Motivo: {grant.reason}
                            </p>
                          )}

                          <p className="text-[10px] text-slate-400">
                            Autorizado em:{' '}
                            {grant.created
                              ? new Date(grant.created).toLocaleString('pt-BR')
                              : 'Recentemente'}{' '}
                            • Expira em: {new Date(grant.expires_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isGrantActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRevoke(grant.id, grant.target_name || 'Profissional')
                            }
                            className="text-xs h-8 px-3 font-semibold bg-rose-600 hover:bg-rose-700"
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" /> Revogar Acesso Agora
                          </Button>
                        )}

                        {!isGrantActive && grant.status !== 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewTargetName(grant.target_name || '')
                              setNewTargetRole((grant.target_role as any) || 'doctor')
                              setGrantModalOpen(true)
                            }}
                            className="text-xs h-8 text-blue-700 hover:text-blue-800"
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reautorizar 24h
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: AUDITORIA DE ACESSO (LOGS COMPLETOS) */}
        <TabsContent value="auditoria" className="space-y-4">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-600" />
                    Trilha de Auditoria e Conformidade LGPD
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registro imutável de todas as consultas, concessões e revogações no seu
                    prontuário.
                  </CardDescription>
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px]">
                  Criptografia em Repouso
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Nenhum registro de auditoria no histórico.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const isConsult = log.action === 'consultou'
                    const isGranted = log.action === 'concedeu_24h'
                    const isRevoked = log.action === 'revogou'

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                                isConsult
                                  ? 'bg-blue-100 text-blue-800'
                                  : isGranted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isRevoked
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-slate-900">{log.actor_name}</span>
                            <span className="text-slate-400 text-[11px]">({log.actor_role})</span>
                          </div>

                          <p className="text-slate-700">
                            <strong>Recurso acessado:</strong> {log.resource}
                          </p>

                          {log.details && (
                            <p className="text-[11px] text-slate-500">{log.details}</p>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0 space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            {log.created
                              ? new Date(log.created).toLocaleString('pt-BR')
                              : 'Recente'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.ip_address || 'Servidor Seguro Brasil'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Relatório LGPD com Filtros de Período e Paciente */}
      <LgpdAuditReportModal
        isOpen={isLgpdModalOpen}
        onClose={() => setIsLgpdModalOpen(false)}
        initialPatientId={patientId}
      />

      {/* Modal: Conceder Acesso 24 Horas */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" /> Autorizar Profissional por 24 Horas
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceda acesso temporário e seguro ao seu histórico de saúde. A autorização expira
              automaticamente após 24 horas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Tipo de Profissional</Label>
              <Select
                value={newTargetRole}
                onValueChange={(v) => setNewTargetRole(v as 'doctor' | 'clinic')}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Médico / Especialista</SelectItem>
                  <SelectItem value="clinic">Clínica / Hospital / Laboratório</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Nome do Médico ou Clínica
              </Label>
              <Input
                placeholder="Ex: Dr. Roberto Alcantara, Clínica Bem Estar..."
                value={newTargetName}
                onChange={(e) => setNewTargetName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Motivo / Finalidade do Acesso (Opcional)
              </Label>
              <Input
                placeholder="Ex: Consulta presencial de retorno, emissão de atestado..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 space-y-1">
              <p className="font-bold text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                Garantia de Privacidade Resulta:
              </p>
              <p className="text-[11px] leading-relaxed">
                Você pode revogar este acesso imediatamente a qualquer momento com um único clique.
                Todas as ações serão gravadas no seu registro de auditoria.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrantModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateGrant}
              disabled={isSubmitting || !newTargetName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {isSubmitting ? 'Autorizando...' : 'Confirmar Autorização (24h)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
