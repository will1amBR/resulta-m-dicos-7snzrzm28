import { MedicalRecord, Patient } from '@/types/clinical'

interface ProntuarioPrintViewProps {
  record: MedicalRecord
  patient: Patient
  doctor?: any
}

export function ProntuarioPrintView({ record, patient, doctor }: ProntuarioPrintViewProps) {
  return (
    <div className="print-only hidden printable-prontuario">
      <div className="mb-6 border-b pb-3">
        <h1 className="text-lg font-bold">Resulta Medicos - Prontuario Medico</h1>
        <p className="text-xs">
          Medico: {doctor?.name || 'N/A'} | Conselho: {doctor?.council_type || 'CRM'}{' '}
          {doctor?.council_number || doctor?.crm || 'N/A'}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-sm border-b pb-1">Dados do Paciente</h2>
        <p className="text-xs">
          Nome: {patient.name} | CPF: {patient.cpf} | Nascimento:{' '}
          {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'N/A'}
        </p>
        <p className="text-xs">Convenio: {patient.insurance || 'Particular'}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-sm border-b pb-1">Data do Atendimento</h2>
        <p className="text-xs">
          {record.created ? new Date(record.created).toLocaleString('pt-BR') : 'N/A'}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-sm border-b pb-1">Avaliacao SOAP</h2>
        <p className="text-xs">
          <strong>Subjetivo:</strong> {record.soap_subjective || 'N/A'}
        </p>
        <p className="text-xs">
          <strong>Objetivo:</strong> {record.soap_objective || 'N/A'}
        </p>
        <p className="text-xs">
          <strong>Avaliacao:</strong> {record.soap_assessment || 'N/A'}
        </p>
        <p className="text-xs">
          <strong>Plano:</strong> {record.soap_plan || 'N/A'}
        </p>
      </div>

      {record.prescribed_medications && record.prescribed_medications.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b pb-1">Medicamentos Prescritos</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Medicamento</th>
                <th className="text-left p-1">Posologia</th>
                <th className="text-left p-1">Instrucoes</th>
              </tr>
            </thead>
            <tbody>
              {record.prescribed_medications.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1">{m.medication}</td>
                  <td className="p-1">{m.dosage}</td>
                  <td className="p-1">{m.instructions || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {record.cid10_codes && record.cid10_codes.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b pb-1">Codigos CID-10</h2>
          {record.cid10_codes.map((c, i) => (
            <p key={i} className="text-xs">
              {c.code} - {c.description}
            </p>
          ))}
        </div>
      )}

      {record.procedures && record.procedures.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b pb-1">Procedimentos</h2>
          <ul>
            {record.procedures.map((p, i) => (
              <li key={i} className="text-xs">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.ai_alerts && record.ai_alerts.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-sm border-b pb-1">Alertas de Interacao</h2>
          {record.ai_alerts.map((a, i) => (
            <p key={i} className="text-xs">
              [{a.severity.toUpperCase()}] {a.medication}: {a.message}
            </p>
          ))}
        </div>
      )}

      <div className="mt-12 pt-6 border-t">
        <p className="text-xs">Assinatura do Medico: _______________________________</p>
      </div>
    </div>
  )
}
