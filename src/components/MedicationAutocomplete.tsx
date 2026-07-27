import { useState, useEffect } from 'react'
import { Search, Plus, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchMedications } from '@/services/medications'
import { Medication, PrescribedMedication } from '@/types/clinical'

interface MedicationAutocompleteProps {
  onAdd: (med: PrescribedMedication) => void
}

export function MedicationAutocomplete({ onAdd }: MedicationAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medication[]>([])
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null)
  const [dosage, setDosage] = useState('')
  const [instructions, setInstructions] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchMedications(query)
        setResults(res.items)
      } catch {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleAdd = () => {
    if (!selectedMed && !query) return
    onAdd({
      medication: selectedMed?.name || query,
      dosage: dosage || '1 comprimido via oral',
      instructions,
    })
    setQuery('')
    setSelectedMed(null)
    setDosage('')
    setInstructions('')
    setShowDetails(false)
    setResults([])
  }

  return (
    <div className="space-y-2 border p-3 rounded-md bg-slate-50 text-xs">
      <p className="font-medium text-slate-700">Prescrever Medicamento</p>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Nome do medicamento..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedMed(null)
          }}
          className="pl-8 h-8 text-xs bg-white"
        />
        {results.length > 0 && (
          <div className="absolute top-9 left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMed(m)
                  setQuery(m.name)
                  setShowDetails(true)
                  setResults([])
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 border-b last:border-0"
              >
                <span className="font-medium">{m.name}</span>
                {m.active_ingredient && (
                  <span className="text-slate-500 text-[10px] ml-2">— {m.active_ingredient}</span>
                )}
                {m.laboratory && (
                  <span className="text-slate-400 text-[10px] ml-1">({m.laboratory})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMed && showDetails && (
        <div className="bg-white border rounded-md p-2.5 space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-600" /> Detalhes do Medicamento
            </span>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-slate-600 text-[10px]"
            >
              Ocultar
            </button>
          </div>
          {selectedMed.indications && (
            <p className="text-[11px] text-slate-700">
              <strong className="text-green-700">Indicações:</strong> {selectedMed.indications}
            </p>
          )}
          {selectedMed.contraindications && (
            <p className="text-[11px] text-slate-700">
              <strong className="text-red-700">Contraindicações:</strong>{' '}
              {selectedMed.contraindications}
            </p>
          )}
          {selectedMed.interactions && (
            <p className="text-[11px] text-slate-700">
              <strong className="text-orange-600">Interações:</strong> {selectedMed.interactions}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Posologia (ex: 1 cp de 8/8h)"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className="h-8 text-xs bg-white"
        />
        <Input
          placeholder="Instruções adicionais..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="h-8 text-xs bg-white"
        />
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
        className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar à Prescrição
      </Button>
    </div>
  )
}
