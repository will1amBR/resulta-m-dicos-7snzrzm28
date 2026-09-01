import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Pill,
  Building2,
  QrCode,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrescriptionRecord } from '@/types/clinical'
import { getPrescriptionByVerificationCode, getVerificationUrl } from '@/services/prescriptions'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { useToast } from '@/hooks/use-toast'

export default function PublicPrescriptionVerify() {
  const { code: routeCode } = useParams<{ code?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [inputCode, setInputCode] = useState(routeCode || '')
  const [prescription, setPrescription] = useState<PrescriptionRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Perform search by verification code
  const handleVerify = async (codeToSearch: string) => {
    const trimmed = (codeToSearch || '').trim()
    if (!trimmed) {
      toast({
        title: 'Código obrigatório',
        description: 'Digite o código de verificação da receita médica.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setSearched(true)
    try {
      const rx = await getPrescriptionByVerificationCode(trimmed)
      setPrescription(rx)
      if (!rx) {
        toast({
          title: 'Receita não localizada',
          description: 'Verifique se o código foi digitado corretamente.',
          variant: 'destructive',
        })
      }
    } catch {
      setPrescription(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (routeCode) {
      setInputCode(routeCode)
      handleVerify(routeCode)
    }
  }, [routeCode])

  const patient = prescription?.expand?.patient_id
  const doctor = prescription?.expand?.doctor_id
  const isCertValid = !!prescription?.certificate_validated
  const currentVerificationCode = prescription?.verification_code || prescription?.id || inputCode
  const verificationUrl = getVerificationUrl(currentVerificationCode)

  const handleCopyCode = () => {
    if (!currentVerificationCode) return
    navigator.clipboard.writeText(currentVerificationCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    toast({ title: 'Código copiado para a área de transferência!' })
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
    toast({ title: 'Link de verificação copiado!' })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                Resulta Médicos
              </span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
                Portal de Validação Farmacêutica
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/entrar">
              <Button variant="outline" size="sm" className="text-xs h-8">
                Acessar Plataforma
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Search & Intro Banner (hidden in print) */}
        <div className="print:hidden space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Consulta Pública de Autenticidade
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Validação de Receita Médica Digital
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Farmácias, drogarias e pacientes podem verificar a autenticidade, integridade e
              validade das receitas emitidas pelos profissionais de saúde.
            </p>
          </div>

          {/* Search Box */}
          <Card className="border-slate-200 shadow-sm max-w-2xl mx-auto">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Digite o Código de Verificação da Receita:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (inputCode.trim()) {
                    navigate(
                      `/receitas/verificar/${encodeURIComponent(inputCode.trim().toUpperCase())}`,
                    )
                    handleVerify(inputCode)
                  }
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Ex: RX-ABCD-1234 ou ID da receita"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="pl-9 h-11 text-sm uppercase tracking-wider font-mono font-semibold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !inputCode.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 text-xs sm:text-sm shadow-xs"
                >
                  {isLoading ? 'Verificando...' : 'Consultar Receita'}
                </Button>
              </form>
              <p className="text-[11px] text-slate-500">
                O código de verificação está impresso na parte inferior da receita ou no QR Code.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Results */}
        {isLoading && (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold">Buscando registro oficial da receita médica...</p>
          </div>
        )}

        {!isLoading && searched && !prescription && (
          <Card className="border-rose-200 bg-rose-50/40 text-center p-8 max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <XCircle className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-rose-950">Receita Não Encontrada</h3>
            <p className="text-xs text-rose-800 mt-1 max-w-md mx-auto leading-relaxed">
              Não encontramos nenhuma prescrição ativa com o código{' '}
              <strong className="font-mono">{inputCode}</strong>. Verifique se o código foi digitado
              corretamente ou se o documento é autêntico.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputCode('')}
                className="text-xs bg-white"
              >
                Tentar Outro Código
              </Button>
            </div>
          </Card>
        )}

        {!isLoading && prescription && (
          <div className="space-y-6">
            {/* Authenticity Banner */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                isCertValid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isCertValid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {isCertValid ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : (
                    <ShieldAlert className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold">
                      {isCertValid
                        ? 'Documento Autêntico e Assinado Digitalmente'
                        : 'Receita Digital Emitida (Certificado Flexível)'}
                    </h2>
                    <Badge
                      className={`text-[11px] font-bold ${
                        isCertValid
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      {isCertValid ? 'ICP-Brasil Válido' : 'Emitido na Plataforma'}
                    </Badge>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    {isCertValid
                      ? 'Esta prescrição possui assinatura eletrônica qualificada com registro médico ativo.'
                      : 'Prescrição emitida eletronicamente pelo profissional de saúde cadastrado na plataforma.'}
                  </p>
                </div>
              </div>

              {/* Print button on banner */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-white text-slate-800 text-xs h-9 font-semibold"
                >
                  <Printer className="h-4 w-4 mr-1.5 text-slate-600" /> Imprimir Documento
                </Button>
              </div>
            </div>

            {/* Official Document View */}
            <Card className="border-slate-300 shadow-md bg-white overflow-hidden print:border-none print:shadow-none">
              {/* Document Header */}
              <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Receituário Médico Digital
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {doctor?.name || 'Dr(a). Médico Prescritor'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {doctor?.council_type || 'CRM'}:{' '}
                    <strong>{doctor?.council_number || doctor?.crm || 'Não informado'}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Data de Emissão
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {prescription.created
                      ? new Date(prescription.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Data recente'}
                  </p>
                  <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded inline-block">
                    Cód: {currentVerificationCode}
                  </span>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Patient Info Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Dados do Paciente:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Nome Completo:</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {patient?.name || 'Paciente'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">CPF do Paciente:</span>
                      <p className="font-bold text-slate-900 font-mono">
                        {patient?.cpf || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prescribed Medications Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Medicamentos Prescritos
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {(prescription.medications || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <h5 className="font-bold text-sm text-slate-900">
                            {idx + 1}. {item.medication}
                          </h5>
                          <Badge variant="outline" className="text-[11px] font-semibold">
                            {item.dosage}
                          </Badge>
                        </div>
                        <p className="text-slate-700">
                          <strong>Posologia:</strong> {item.dosage}{' '}
                          {item.frequency && `• ${item.frequency}`}
                        </p>
                        {item.period_days && (
                          <p className="text-slate-600">
                            <strong>Duração do Tratamento:</strong> {item.period_days} dias
                          </p>
                        )}
                        {item.instructions && (
                          <p className="text-slate-600 italic bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                            <strong>Orientações:</strong> {item.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {prescription.notes && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-950 space-y-1">
                    <span className="font-bold block">Observações do Prescritor:</span>
                    <p className="text-blue-900">{prescription.notes}</p>
                  </div>
                )}

                {/* Verification Footer with QR Code */}
                <div className="pt-6 border-t-2 border-dashed border-slate-200 mt-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* QR Code */}
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs shrink-0">
                        <QRCodeSVG value={verificationUrl} size={96} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          QR Code de Autenticidade
                        </span>
                        <p className="font-bold text-slate-900">Aponte a câmera para consultar</p>
                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                          A farmácia pode validar este documento a qualquer momento pela URL ou QR
                          Code.
                        </p>
                      </div>
                    </div>

                    {/* Verification Code Box */}
                    <div className="text-left sm:text-right space-y-1.5 w-full sm:w-auto">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Código de Verificação Único:
                      </span>
                      <div className="flex items-center sm:justify-end gap-2">
                        <span className="font-mono text-sm sm:text-base font-extrabold bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border border-blue-200 tracking-wider">
                          {currentVerificationCode}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCode}
                          className="h-8 px-2 text-slate-600 print:hidden"
                          title="Copiar código"
                        >
                          {copiedCode ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-sm">
                        {verificationUrl}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Farmácia Actions Bar (hidden in print) */}
            <div className="print:hidden flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>
                  Ambiente seguro de dispensação farmacêutica • Padrão de conformidade digital
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="text-xs h-8 text-slate-700"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Link Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Link Público
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir 2ª Via
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 print:hidden">
        <p>
          Resulta Médicos © {new Date().getFullYear()} — Plataforma de Prescrição e Validação
          Digital
        </p>
      </footer>
    </div>
  )
}
