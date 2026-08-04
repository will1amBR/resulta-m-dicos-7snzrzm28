import {
  Calendar,
  Users,
  Video,
  FileText,
  FolderOpen,
  Brain,
  Shield,
  FileCheck,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Agenda Integrada',
    description: 'Agendamento e confirmação de consultas com visão diária, semanal e mensal.',
  },
  {
    icon: Users,
    title: 'Gestão de Pacientes',
    description: 'Cadastro completo, histórico clínico e busca rápida por nome ou CPF.',
  },
  {
    icon: Video,
    title: 'Teleconsulta',
    description: 'Atendimento remoto integrado ao prontuário, sem trocar de sistema.',
  },
  {
    icon: FileText,
    title: 'Prontuário SOAP',
    description: 'Notas estruturadas com CID-10, prescrições e exportação em PDF.',
  },
  {
    icon: FolderOpen,
    title: 'Documentos com IA',
    description: 'Exames, receitas e laudos organizados automaticamente em pastas por IA.',
  },
  {
    icon: Brain,
    title: 'Análise de Interações',
    description: 'Alertas em tempo real sobre contraindicações e interações medicamentosas.',
  },
  {
    icon: Shield,
    title: 'LGPD & Segurança',
    description: 'Servidor no Brasil, conformidade com LGPD e dados criptografados.',
  },
  {
    icon: FileCheck,
    title: 'Validação de CRM',
    description: 'CRM validado no CFM. CRN, CRP, CRO, COREN e CREFITO por liberação manual.',
  },
]

export function LandingFeatures() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Tudo que o médico precisa, num só lugar
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Uma plataforma unificada para administrar clínicas e pacientes, integrando agenda,
            prontuário, teleconsulta e documentos.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
