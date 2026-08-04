import { AlertTriangle, CheckCircle2 } from 'lucide-react'

const problems = [
  'Agendamento fragmentado entre Doctoralia, Google Agenda e WhatsApp',
  'Histórico de exames depende de fotos soltas no celular do paciente',
  'Receitas emitidas em ferramentas externas e enviadas manualmente',
  '36,2 minutos perdidos em prontuário eletrônico por consulta',
]

const solutions = [
  'Agenda integrada com confirmação automática dentro da plataforma',
  'Documentos organizados em pastas com classificação por IA',
  'Prescrição integrada com análise cruzada de interações medicamentosas',
  'Tudo numa tela só — prontuário, agenda, documentos e teleconsulta',
]

export function LandingProblem() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Não falta software. Falta caber numa tela só.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Sua consulta hoje roda em cinco janelas. Cada uma no seu próprio sistema, e nenhum
            conversa com o outro.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-red-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-slate-900">Antes — Fragmentado</h3>
            </div>
            <ul className="space-y-3">
              {problems.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-red-400 mt-0.5">✕</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-slate-900">Com a Resulta — Unificado</h3>
            </div>
            <ul className="space-y-3">
              {solutions.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
