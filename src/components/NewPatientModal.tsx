import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPatient } from '@/services/patients'

interface NewPatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewPatientModal({ open, onOpenChange, onSuccess }: NewPatientModalProps) {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [insurance, setInsurance] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !cpf) return
    setLoading(true)
    try {
      await createPatient({
        name,
        cpf,
        phone,
        email,
        birth_date: birthDate ? new Date(birthDate).toISOString() : undefined,
        insurance,
      })
      onSuccess()
      onOpenChange(false)
      setName('')
      setCpf('')
      setPhone('')
      setEmail('')
      setBirthDate('')
      setInsurance('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Nome Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Santos"
              className="mt-1 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">CPF</Label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 90000-0000"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Data de Nascimento</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Convênio Médico / Plano</Label>
            <Input
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              placeholder="Ex: Bradesco, Unimed, Particular"
              className="mt-1 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
