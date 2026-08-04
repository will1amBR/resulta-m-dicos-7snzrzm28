const stats = [
  { value: '14.233', label: 'Códigos CID-10' },
  { value: '40.000+', label: 'Medicamentos' },
  { value: '30+', label: 'Especialidades' },
  { value: 'LGPD', label: 'Servidor no Brasil' },
]

export function LandingStats() {
  return (
    <section className="bg-white border-b border-slate-100 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
