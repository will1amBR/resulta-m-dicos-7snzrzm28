import { useState, useEffect } from 'react'
import { Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchCid10 } from '@/services/cid10'
import { Cid10Code } from '@/types/clinical'

interface CidAutocompleteProps {
  onSelect: (code: Cid10Code) => void
}

export function CidAutocomplete({ onSelect }: CidAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Cid10Code[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await searchCid10(query)
        setResults(res.items)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Buscar diagnóstico CID-10 (código ou descrição)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 text-xs h-8"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute top-9 left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item)
                setQuery('')
                setResults([])
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between border-b last:border-0"
            >
              <div>
                <span className="font-bold text-blue-700 mr-2">{item.code}</span>
                <span className="text-slate-800">{item.description}</span>
              </div>
              <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute top-9 left-0 right-0 bg-white border p-2 text-xs text-slate-500 rounded shadow">
          Carregando CID-10...
        </div>
      )}
    </div>
  )
}
