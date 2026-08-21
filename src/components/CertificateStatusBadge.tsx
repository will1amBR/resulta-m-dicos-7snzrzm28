import { CertificateStatus } from '@/types/clinical'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertificateStatusBadgeProps {
  status?: CertificateStatus | string
  className?: string
  showIcon?: boolean
}

export function CertificateStatusBadge({
  status = 'nao_enviado',
  className,
  showIcon = true,
}: CertificateStatusBadgeProps) {
  switch (status) {
    case 'validado':
      return (
        <Badge
          className={cn(
            'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 gap-1 font-semibold text-xs',
            className,
          )}
        >
          {showIcon && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
          <span>🟢 Validado</span>
        </Badge>
      )
    case 'pendente':
      return (
        <Badge
          className={cn(
            'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 gap-1 font-semibold text-xs',
            className,
          )}
        >
          {showIcon && <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />}
          <span>🟡 Pendente de validação</span>
        </Badge>
      )
    case 'nao_enviado':
    default:
      return (
        <Badge
          className={cn(
            'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 gap-1 font-semibold text-xs',
            className,
          )}
        >
          {showIcon && <ShieldX className="h-3.5 w-3.5 text-rose-600" />}
          <span>🔴 Não enviado</span>
        </Badge>
      )
  }
}
