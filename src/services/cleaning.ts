import pb from '@/lib/pocketbase/client'
import { CleaningChecklist, CleaningChecklistItem } from '@/types/clinical'

export const DEFAULT_CLEANING_ITEMS: CleaningChecklistItem[] = [
  { area: 'Consultório 1', task: 'Desinfecção de bancadas, maca e estetoscópio', done: false },
  {
    area: 'Consultório 1',
    task: 'Troca de lençol descartável e esvaziamento de lixo infectante',
    done: false,
  },
  {
    area: 'Consultório 2 (Especialidades)',
    task: 'Higienização de mesa de exame e foco clínico',
    done: false,
  },
  {
    area: 'Consultório 2 (Especialidades)',
    task: 'Reposição de papel toalha e álcool em gel 70%',
    done: false,
  },
  {
    area: 'Recepção e Espera',
    task: 'Passar pano com desinfetante hospitalar no piso e assentos',
    done: false,
  },
  {
    area: 'Recepção e Espera',
    task: 'Abastecer bebedouro, copos descartáveis e mesa de café',
    done: false,
  },
  {
    area: 'Banheiro Pacientes',
    task: 'Limpeza sanitária profunda, desinfecção de pias e espelho',
    done: false,
  },
  {
    area: 'Banheiro Pacientes',
    task: 'Reposição de sabonete líquido e papel toalha/higiênico',
    done: false,
  },
  {
    area: 'Banheiro Funcionários',
    task: 'Higienização geral e troca dos sacos de lixo',
    done: false,
  },
  {
    area: 'Sala de Procedimentos',
    task: 'Desinfecção terminal de superfícies, bandeja cirúrgica e expurgo',
    done: false,
  },
  {
    area: 'Copa / Descanso',
    task: 'Lavagem de louça, higienização da bancada e geladeira',
    done: false,
  },
]

export async function getCleaningChecklists(limit = 30): Promise<CleaningChecklist[]> {
  const records = await pb.collection('cleaning_checklists').getList<CleaningChecklist>(1, limit, {
    sort: '-date,-created',
    expand: 'staff',
  })
  return records.items
}

export async function getOrCreateTodayChecklist(
  shift: 'manha' | 'tarde' | 'noite' = 'manha',
): Promise<CleaningChecklist> {
  const todayStr = new Date().toISOString().slice(0, 10)
  try {
    const existing = await pb
      .collection('cleaning_checklists')
      .getFirstListItem<CleaningChecklist>(`date ~ "${todayStr}" && shift = "${shift}"`, {
        expand: 'staff',
      })
    return existing
  } catch {
    // Criar checklist do dia
    const newChecklist = await pb.collection('cleaning_checklists').create<CleaningChecklist>({
      date: new Date().toISOString(),
      shift,
      items: DEFAULT_CLEANING_ITEMS,
      status: 'pendente',
      staff: pb.authStore.record?.id || null,
      notes: `Rotina de limpeza do turno da ${shift} iniciada.`,
    })
    return newChecklist
  }
}

export async function updateCleaningChecklist(
  id: string,
  data: Partial<CleaningChecklist>,
): Promise<CleaningChecklist> {
  const record = await pb.collection('cleaning_checklists').update<CleaningChecklist>(id, data, {
    expand: 'staff',
  })
  return record
}

export async function toggleChecklistItem(
  checklistId: string,
  itemIndex: number,
  notes?: string,
): Promise<CleaningChecklist> {
  const checklist = await pb
    .collection('cleaning_checklists')
    .getOne<CleaningChecklist>(checklistId)
  const updatedItems = [...checklist.items]
  if (updatedItems[itemIndex]) {
    const willBeDone = !updatedItems[itemIndex].done
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      done: willBeDone,
      time: willBeDone
        ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : undefined,
    }
  }

  const allDone = updatedItems.every((it) => it.done)
  const someDone = updatedItems.some((it) => it.done)
  const newStatus = allDone ? 'concluido' : someDone ? 'em_andamento' : 'pendente'

  return await updateCleaningChecklist(checklistId, {
    items: updatedItems,
    status: newStatus,
    notes: notes !== undefined ? notes : checklist.notes,
    staff: pb.authStore.record?.id || checklist.staff,
  })
}
