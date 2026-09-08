import { useState } from 'react'
import { Calculator, Activity, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface ClinicalCalculatorsProps {
  initialWeight?: number
  initialHeight?: number
  initialAge?: number
  initialGender?: 'male' | 'female'
  initialCreatinine?: number
  onApplyImc?: (imc: number, interpretation: string) => void
  onApplyClearance?: (clearance: number, stage: string) => void
}

export function ClinicalCalculators({
  initialWeight = 74,
  initialHeight = 1.72,
  initialAge = 42,
  initialGender = 'male',
  initialCreatinine = 1.05,
  onApplyImc,
  onApplyClearance,
}: ClinicalCalculatorsProps) {
  const [activeTab, setActiveTab] = useState<'cockcroft' | 'imc'>('cockcroft')

  // Cockcroft-Gault
  const [age, setAge] = useState<number | ''>(initialAge)
  const [weight, setWeight] = useState<number | ''>(initialWeight)
  const [gender, setGender] = useState<'male' | 'female'>(initialGender)
  const [creatinine, setCreatinine] = useState<number | ''>(initialCreatinine)

  // IMC
  const [imcWeight, setImcWeight] = useState<number | ''>(initialWeight)
  const [imcHeight, setImcHeight] = useState<number | ''>(initialHeight)

  // Cálculo Cockcroft-Gault:
  // Homens: [(140 - idade) * peso] / (72 * CrSérica)
  // Mulheres: Homens * 0.85
  const calculateClearance = () => {
    if (!age || !weight || !creatinine || creatinine <= 0) return null
    const base = ((140 - Number(age)) * Number(weight)) / (72 * Number(creatinine))
    const result = gender === 'female' ? base * 0.85 : base
    const rounded = Math.round(result * 10) / 10

    let stage = ''
    let color = ''
    if (rounded >= 90) {
      stage = 'Função renal normal ou elevada (Estágio 1)'
      color = 'text-emerald-700 bg-emerald-50 border-emerald-300'
    } else if (rounded >= 60) {
      stage = 'Perda leve da função renal (Estágio 2)'
      color = 'text-blue-700 bg-blue-50 border-blue-300'
    } else if (rounded >= 30) {
      stage = 'Perda moderada a severa (Estágio 3)'
      color = 'text-amber-700 bg-amber-50 border-amber-300'
    } else if (rounded >= 15) {
      stage = 'Perda severa da função renal (Estágio 4)'
      color = 'text-orange-700 bg-orange-50 border-orange-300'
    } else {
      stage = 'Falência renal / DRC terminal (Estágio 5)'
      color = 'text-rose-700 bg-rose-50 border-rose-300'
    }

    return { value: rounded, stage, color }
  }

  // Cálculo IMC: peso / (altura * altura)
  const calculateImc = () => {
    if (!imcWeight || !imcHeight || imcHeight <= 0) return null
    const val = Number(imcWeight) / (Number(imcHeight) * Number(imcHeight))
    const rounded = Math.round(val * 10) / 10

    let classification = ''
    let color = ''
    if (rounded < 18.5) {
      classification = 'Abaixo do peso'
      color = 'text-blue-700 bg-blue-50 border-blue-300'
    } else if (rounded < 25) {
      classification = 'Eutrofia (Peso normal)'
      color = 'text-emerald-700 bg-emerald-50 border-emerald-300'
    } else if (rounded < 30) {
      classification = 'Sobrepeso'
      color = 'text-amber-700 bg-amber-50 border-amber-300'
    } else if (rounded < 35) {
      classification = 'Obesidade Grau I'
      color = 'text-orange-700 bg-orange-50 border-orange-300'
    } else if (rounded < 40) {
      classification = 'Obesidade Grau II'
      color = 'text-rose-700 bg-rose-50 border-rose-300'
    } else {
      classification = 'Obesidade Grau III (Mórbida)'
      color = 'text-rose-900 bg-rose-100 border-rose-400'
    }

    return { value: rounded, classification, color }
  }

  const clearanceResult = calculateClearance()
  const imcResult = calculateImc()

  return (
    <Card className="border-slate-200 shadow-subtle">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-indigo-600" /> Calculadoras Clínicas Integradas
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-white">
            Cockcroft-Gault & IMC
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'cockcroft' | 'imc')}
          className="w-full space-y-3"
        >
          <TabsList className="bg-slate-100 p-0.5 rounded-lg w-full grid grid-cols-2">
            <TabsTrigger value="cockcroft" className="text-xs py-1.5">
              Clearance Creatinina
            </TabsTrigger>
            <TabsTrigger value="imc" className="text-xs py-1.5">
              IMC & Superfície
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COCKCROFT-GAULT */}
          <TabsContent value="cockcroft" className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Idade (anos)</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : '')}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Sexo Biológico</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino (*0.85)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Cr Sérica (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value ? parseFloat(e.target.value) : '')}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {clearanceResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${clearanceResult.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px]">Clearance Estimado:</span>
                  <span className="font-mono font-extrabold text-sm">
                    {clearanceResult.value} mL/min
                  </span>
                </div>
                <p className="text-[11px] font-medium">{clearanceResult.stage}</p>
                {onApplyClearance && (
                  <button
                    type="button"
                    onClick={() => onApplyClearance(clearanceResult.value, clearanceResult.stage)}
                    className="text-[10px] underline font-bold mt-1 block"
                  >
                    + Inserir no Objetivo/Avaliação do SOAP
                  </button>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: IMC */}
          <TabsContent value="imc" className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={imcWeight}
                  onChange={(e) => setImcWeight(e.target.value ? parseFloat(e.target.value) : '')}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Altura (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={imcHeight}
                  onChange={(e) => setImcHeight(e.target.value ? parseFloat(e.target.value) : '')}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {imcResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${imcResult.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px]">Índice de Massa Corporal:</span>
                  <span className="font-mono font-extrabold text-sm">{imcResult.value} kg/m²</span>
                </div>
                <p className="text-[11px] font-medium">{imcResult.classification}</p>
                {onApplyImc && (
                  <button
                    type="button"
                    onClick={() => onApplyImc(imcResult.value, imcResult.classification)}
                    className="text-[10px] underline font-bold mt-1 block"
                  >
                    + Inserir no Objetivo do SOAP
                  </button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
