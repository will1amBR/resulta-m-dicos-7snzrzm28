import { PrescriptionRecord } from '@/types/clinical'
import { getVerificationUrl } from '@/services/prescriptions'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldAlert, Pill, FileText, CheckCircle2 } from 'lucide-react'

interface PharmacyPrescriptionPDFViewProps {
  prescription: PrescriptionRecord
  doctor?: any
  patient?: any
}

export function PharmacyPrescriptionPDFView({
  prescription,
  doctor,
  patient,
}: PharmacyPrescriptionPDFViewProps) {
  const docObj = prescription.expand?.doctor_id || doctor
  const patObj = prescription.expand?.patient_id || patient

  const verificationCode = prescription.verification_code || prescription.id
  const verificationUrl = getVerificationUrl(verificationCode)
  const isCertValid = !!prescription.certificate_validated

  const emissionDateFormatted = prescription.created
    ? new Date(prescription.created).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

  const emissionTimeFormatted = prescription.created
    ? new Date(prescription.created).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const crmFormatted = docObj?.council_number || docObj?.crm || 'Registro Ativo'
  const councilType = docObj?.council_type || 'CRM'

  return (
    <div className="pharmacy-dispensation-sheet font-sans text-slate-900 bg-white p-6 sm:p-8 max-w-3xl mx-auto border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none">
      {/* TARJA SUPERIOR DE DISPENSAÇÃO FARMACÊUTICA */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-1 rounded tracking-wider uppercase">
                Receituário Médico Digital
              </span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Via de Dispensação Farmacêutica
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight pt-1">
              Plataforma Resulta Médicos
            </h1>
            <p className="text-[11px] text-slate-500">
              Documento digital com validação pública nos termos da Lei Federal 14.063/20 e Portaria
              MS 467/20.
            </p>
          </div>

          {/* Destaque do Código no Topo */}
          <div className="text-right bg-slate-50 p-2.5 rounded-lg border border-slate-300 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Código de Verificação
            </span>
            <span className="font-mono text-base font-extrabold text-blue-900 tracking-wider">
              {verificationCode}
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 1: IDENTIFICAÇÃO DO MÉDICO & PACIENTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {/* Médico Prescritor */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Médico(a) Prescritor(a)
          </span>
          <p className="font-bold text-sm text-slate-900">
            Dr(a). {docObj?.name || 'Médico Prescritor'}
          </p>
          <p className="text-xs text-slate-700 mt-0.5">
            {councilType}: <strong className="font-mono">{crmFormatted}</strong>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {isCertValid ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                <ShieldCheck className="h-3 w-3 text-emerald-700" />
                Certificado Digital ICP-Brasil: Validado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                <ShieldAlert className="h-3 w-3 text-amber-700" />
                Certificado Digital: Emissão Flexível
              </span>
            )}
          </div>
        </div>

        {/* Paciente */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Paciente
          </span>
          <p className="font-bold text-sm text-slate-900">{patObj?.name || 'Nome do Paciente'}</p>
          <p className="text-xs text-slate-700 mt-0.5">
            CPF: <strong className="font-mono">{patObj?.cpf || 'Não informado'}</strong>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Emissão: <strong>{emissionDateFormatted}</strong>{' '}
            {emissionTimeFormatted && `às ${emissionTimeFormatted}`}
          </p>
        </div>
      </div>

      {/* BLOCO 2: TABELA DE DISPENSAÇÃO DE MEDICAMENTOS */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-slate-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Medicamentos Prescritos — Instruções de Dispensação
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Total: {(prescription.medications || []).length} item(ns)
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
              <tr>
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5">Medicamento / Forma Farmacêutica</th>
                <th className="p-2.5">Dosagem / Posologia</th>
                <th className="p-2.5">Frequência</th>
                <th className="p-2.5 text-center">Período</th>
                <th className="p-2.5">Orientações ao Paciente</th>
                <th className="p-2.5 w-24 text-center print:table-cell bg-slate-200/50">
                  Dispensado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(prescription.medications || []).map((item, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900">{item.medication}</td>
                  <td className="p-2.5 font-semibold text-slate-800">{item.dosage}</td>
                  <td className="p-2.5 text-slate-700">
                    {item.frequency || 'Conforme orientação'}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    {item.period_days ? (
                      <span className="font-mono font-semibold text-slate-800">
                        {item.period_days} dias
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600 text-[11px] leading-tight">
                    {item.instructions || 'Uso conforme prescrição.'}
                  </td>
                  {/* Campo de conferência física pelo farmacêutico */}
                  <td className="p-2.5 text-center border-l border-slate-200">
                    <div className="h-5 w-5 border border-slate-400 rounded mx-auto inline-block bg-white" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOCO 3: OBSERVAÇÕES CLÍNICAS */}
      {prescription.notes && (
        <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
          <strong className="text-slate-900 uppercase text-[10px] tracking-wide block">
            Observações Médicas Adicionais:
          </strong>
          <p className="text-slate-700">{prescription.notes}</p>
        </div>
      )}

      {/* BLOCO 4: RODAPÉ DE VALIDAÇÃO, QR CODE E FARMÁCIA */}
      <div className="border-t-2 border-slate-900 pt-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* QR Code */}
          <div className="sm:col-span-3 flex items-center justify-center sm:justify-start">
            <div className="p-2 bg-white rounded-lg border-2 border-slate-900 inline-block shadow-xs">
              <QRCodeSVG value={verificationUrl} size={90} />
            </div>
          </div>

          {/* Instruções para o Farmacêutico */}
          <div className="sm:col-span-5 space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Instruções de Validação pelo Farmacêutico
            </span>
            <p className="text-slate-900 font-bold text-[11px]">
              Aponte a câmera para o QR Code ou acesse:
            </p>
            <p className="font-mono text-[10px] text-blue-900 break-all select-all font-semibold">
              {verificationUrl}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
              Confirme os medicamentos e o status antes de dispensar ao paciente.
            </p>
          </div>

          {/* Caixa de Código em Destaque */}
          <div className="sm:col-span-4 bg-slate-100 p-3 rounded-lg border border-slate-300 text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Código Verificador
            </span>
            <span className="font-mono text-lg font-black text-slate-950 block tracking-wider">
              {verificationCode}
            </span>
            <span className="text-[9px] text-slate-500 block">
              Status Certificado: <strong>{isCertValid ? 'ICP-Brasil OK' : 'Flexível'}</strong>
            </span>
          </div>
        </div>

        {/* Linha de Assinatura do Farmacêutico na Dispensação Física */}
        <div className="mt-6 pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
          <div>
            <p className="border-b border-slate-400 pb-1 mb-1 font-mono">
              Assinatura / Carimbo do Farmacêutico
            </p>
            <p>CRF: __________________ Farmácia: _____________________</p>
          </div>
          <div className="text-right">
            <p className="border-b border-slate-400 pb-1 mb-1 font-mono">
              Data da Dispensação: ___/___/______
            </p>
            <p>Lote / Registro de Dispensação Arquivado</p>
          </div>
        </div>
      </div>
    </div>
  )
}
