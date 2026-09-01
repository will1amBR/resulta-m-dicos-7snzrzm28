import React, { useMemo } from 'react'
import { QRCodeGenerator } from '@/lib/qrcode'

interface QRCodeSVGProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  includeMargin?: boolean
  className?: string
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 128,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  includeMargin = true,
  className = '',
}) => {
  const qr = useMemo(() => {
    try {
      const qrg = new QRCodeGenerator(4)
      qrg.addData(value)
      qrg.make()
      return qrg
    } catch {
      return null
    }
  }, [value])

  if (!qr) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 ${className}`}
      >
        QR Indisponível
      </div>
    )
  }

  const moduleCount = qr.getModuleCount()
  const margin = includeMargin ? 2 : 0
  const totalGrid = moduleCount + margin * 2

  const cells: { x: number; y: number }[] = []
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        cells.push({ x: c + margin, y: r + margin })
      }
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalGrid} ${totalGrid}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
    >
      <rect width={totalGrid} height={totalGrid} fill={bgColor} />
      {cells.map((cell, idx) => (
        <rect key={idx} x={cell.x} y={cell.y} width={1} height={1} fill={fgColor} />
      ))}
    </svg>
  )
}

export default QRCodeSVG
