import { Info } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function DemoBanner() {
  const { isDemoMode } = useAuth()
  if (!isDemoMode) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium no-print shrink-0">
      <Info className="h-3.5 w-3.5 shrink-0" />
      <span>Você está em modo demo — os dados exibidos são exemplos para demonstração.</span>
    </div>
  )
}
