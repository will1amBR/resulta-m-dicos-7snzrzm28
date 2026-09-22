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
    icon: Shield,
    title: 'Modelo Aberto & Auditoria LGPD',
    description:
      'O paciente é dono soberano do histórico. Concessões de 24h e registro em log de quem consultou com alertas instantâneos.',
  },
  {
    icon: FileCheck,
    title: 'Documentos com QR Code Público',
    description:
      'Receitas, laudos e atestados verificáveis em /consulta-receita com código de autenticidade instantânea.',
  },
  {
    icon: Video,
    title: 'Teleconsulta WebRTC Direta',
    description:
      'Vídeo, áudio e chat integrados ao prontuário eletrônico sem abrir outras janelas.',
  },
  {
    icon: FileText,
    title: 'Prontuário SOAP & Transcrição',
    description:
      'Evolução estruturada com transcrição de fala por IA, calculadoras de clearance/IMC e CID-10.',
  },
  {
    icon: FolderOpen,
    title: 'Exames com Evolução Temporal',
    description:
      'Upload de exames por pacientes e médicos com categorização automática e gráficos de marcadores no tempo.',
  },
  {
    icon: Brain,
    title: 'IA de Análise Cruzada de Remédios',
    description:
      'Alertas imediatos de risco em interações medicamentosas graves entre novos e contínuos.',
  },
  {
    icon: Calendar,
    title: 'Agenda & Multi-Consultórios',
    description:
      'Agendamento com visão diária, semanal e mensal para médicos autônomos e equipes de clínicas.',
  },
  {
    icon: Users,
    title: 'Gestão de Pacientes & Portais',
    description:
      'Portal do paciente integrado para consultar receitas, solicitar renovações e autorizar acessos.',
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
