import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
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
  const [selectedMed, setSelectedMed] = useState<string>('')
  const [dosage, setDosage] = useState('')
  const [instructions, setInstructions] = useState('')

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
      medication: selectedMed || query,
      dosage: dosage || '1 comprimido via oral',
      instructions,
    })
    setQuery('')
    setSelectedMed('')
    setDosage('')
    setInstructions('')
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
            setSelectedMed(e.target.value)
          }}
          className="pl-8 h-8 text-xs bg-white"
        />
        {results.length > 0 && (
          <div className="absolute top-9 left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMed(m.name)
                  setQuery(m.name)
                  setResults([])
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 border-b last:border-0"
              >
                <span className="font-medium">{m.name}</span>
                {m.laboratory && (
                  <span className="text-slate-400 text-[10px] ml-2">({m.laboratory})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

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
