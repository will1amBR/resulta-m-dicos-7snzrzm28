import pb from '@/lib/pocketbase/client'
import { ClinicSupply, ClinicSupplyMovement, SupplyMovementType } from '@/types/clinical'
import { createNotification } from '@/services/notifications'

export async function getClinicSupplies(filter?: string, sort = 'name'): Promise<ClinicSupply[]> {
  const records = await pb.collection('clinic_supplies').getFullList<ClinicSupply>({
    filter: filter || '',
    sort,
  })
  return records
}

export async function getLowStockSupplies(): Promise<ClinicSupply[]> {
  const all = await getClinicSupplies()
  return all.filter((s) => s.quantity <= s.min_quantity)
}

export async function createClinicSupply(data: Partial<ClinicSupply>): Promise<ClinicSupply> {
  const record = await pb.collection('clinic_supplies').create<ClinicSupply>(data)
  return record
}

export async function updateClinicSupply(
  id: string,
  data: Partial<ClinicSupply>,
): Promise<ClinicSupply> {
  const record = await pb.collection('clinic_supplies').update<ClinicSupply>(id, data)
  return record
}

export async function deleteClinicSupply(id: string): Promise<boolean> {
  await pb.collection('clinic_supplies').delete(id)
  return true
}

export async function getSupplyMovements(
  supplyId?: string,
  limit = 50,
  filterExtra?: string,
): Promise<ClinicSupplyMovement[]> {
  const filters: string[] = []
  if (supplyId) {
    filters.push(`supply = "${supplyId}"`)
  }
  if (filterExtra) {
    filters.push(filterExtra)
  }
  const filter = filters.join(' && ')
  const records = await pb
    .collection('clinic_supply_movements')
    .getList<ClinicSupplyMovement>(1, limit, {
      filter,
      sort: '-created',
      expand: 'supply,patient,user',
    })
  return records.items
}

export interface SupplyConsumptionSummary {
  period: '7d' | '30d' | 'mes_atual'
  totalCost: number
  totalMovementsCount: number
  totalUnitsConsumed: number
  appointmentsCount: number
  avgCostPerAppointment: number
  topSupplies: Array<{
    id: string
    name: string
    unit: string
    quantity: number
    unitCost: number
    totalCost: number
    category?: string
  }>
  costByProcedure: Array<{
    procedure: string
    totalCost: number
    count: number
    avgCost: number
  }>
  consumptionEvolution: Array<{
    date: string
    formattedDate: string
    cost: number
    quantity: number
  }>
}

export async function getSupplyConsumptionMetrics(
  period: '7d' | '30d' | 'mes_atual' = '30d',
): Promise<SupplyConsumptionSummary> {
  const now = new Date()
  let startDate: Date

  if (period === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  } else {
    // mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  }

  const startDateIso = startDate.toISOString()

  // Buscar todos os insumos cadastrados (para garantir os custos unitários atualizados)
  const allSupplies = await getClinicSupplies()
  const supplyPriceMap = new Map<
    string,
    { name: string; unit: string; cost: number; category?: string }
  >()
  for (const s of allSupplies) {
    supplyPriceMap.set(s.id, {
      name: s.name,
      unit: s.unit || 'un',
      cost: Number(s.cost_price || 0),
      category: s.category,
    })
  }

  // Buscar movimentações de saída por atendimento dentro do período
  // Busca também todas as movimentações de saída para compor métricas
  const allMovements = await pb
    .collection('clinic_supply_movements')
    .getFullList<ClinicSupplyMovement>({
      filter: `type = "saida_atendimento" && (date >= "${startDateIso}" || created >= "${startDateIso}")`,
      sort: 'created',
      expand: 'supply,patient,user',
    })

  // Buscar atendimentos no mesmo período para calcular média por atendimento
  const appointmentsInPeriod = await pb
    .collection('appointments')
    .getFullList({
      filter: `date_time >= "${startDateIso}" && (status = "finalizada" || status = "confirmada" || status = "em_andamento")`,
    })
    .catch(() => [])

  let totalCost = 0
  let totalUnitsConsumed = 0
  const supplyAggregates = new Map<
    string,
    {
      id: string
      name: string
      unit: string
      quantity: number
      unitCost: number
      totalCost: number
      category?: string
    }
  >()
  const procedureAggregates = new Map<string, { totalCost: number; count: number }>()
  const dailyEvolution = new Map<string, { cost: number; quantity: number }>()

  // Inicializar datas no dailyEvolution para o gráfico não ficar vazio
  const daysCount = period === '7d' ? 7 : period === '30d' ? 14 : Math.min(30, now.getDate())
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dailyEvolution.set(key, { cost: 0, quantity: 0 })
  }

  for (const mov of allMovements) {
    const supplyId = mov.supply || mov.expand?.supply?.id
    const supplyInfo = supplyPriceMap.get(supplyId || '') || {
      name: mov.expand?.supply?.name || 'Insumo',
      unit: mov.expand?.supply?.unit || 'un',
      cost: Number(mov.expand?.supply?.cost_price || 0),
      category: mov.expand?.supply?.category,
    }

    const qty = Number(mov.quantity || 0)
    const unitCost = Number(supplyInfo.cost || 0)
    const itemCost = qty * unitCost

    totalCost += itemCost
    totalUnitsConsumed += qty

    // Agregar por insumo
    const existingSupply = supplyAggregates.get(supplyId || supplyInfo.name)
    if (existingSupply) {
      existingSupply.quantity += qty
      existingSupply.totalCost += itemCost
    } else {
      supplyAggregates.set(supplyId || supplyInfo.name, {
        id: supplyId || '',
        name: supplyInfo.name,
        unit: supplyInfo.unit,
        quantity: qty,
        unitCost,
        totalCost: itemCost,
        category: supplyInfo.category,
      })
    }

    // Identificar procedimento a partir do reason (ex: "Consumo no atendimento: Curativo", "Pequena cirurgia")
    let procName = 'Consulta Geral / Procedimento'
    if (mov.reason) {
      const cleaned = mov.reason
        .replace(/^Consumo no atendimento:\s*/i, '')
        .replace(/^Consumo em consulta\/procedimento/i, 'Consulta com Procedimento')
        .trim()
      if (cleaned) {
        procName = cleaned
      }
    }

    const existingProc = procedureAggregates.get(procName)
    if (existingProc) {
      existingProc.totalCost += itemCost
      existingProc.count += 1
    } else {
      procedureAggregates.set(procName, { totalCost: itemCost, count: 1 })
    }

    // Agregar evolução diária
    const movDate = (mov.date || mov.created || '').slice(0, 10)
    if (movDate) {
      const currentDay = dailyEvolution.get(movDate)
      if (currentDay) {
        currentDay.cost += itemCost
        currentDay.quantity += qty
      } else {
        dailyEvolution.set(movDate, { cost: itemCost, quantity: qty })
      }
    }
  }

  // Ordenar ranking de insumos por custo total decrescente
  const topSupplies = Array.from(supplyAggregates.values()).sort(
    (a, b) => b.totalCost - a.totalCost || b.quantity - a.quantity,
  )

  // Custo por procedimento formatado
  const costByProcedure = Array.from(procedureAggregates.entries())
    .map(([procedure, data]) => ({
      procedure,
      totalCost: Math.round(data.totalCost * 100) / 100,
      count: data.count,
      avgCost: data.count > 0 ? Math.round((data.totalCost / data.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)

  // Formatar evolução temporal
  const consumptionEvolution = Array.from(dailyEvolution.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => {
      const parts = date.split('-')
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date
      return {
        date,
        formattedDate,
        cost: Math.round(data.cost * 100) / 100,
        quantity: data.quantity,
      }
    })

  const appointmentsCount = Math.max(
    appointmentsInPeriod.length,
    allMovements.length > 0
      ? new Set(allMovements.map((m) => m.patient).filter(Boolean)).size || 1
      : 0,
  )

  const avgCostPerAppointment =
    appointmentsCount > 0 ? Math.round((totalCost / appointmentsCount) * 100) / 100 : 0

  return {
    period,
    totalCost: Math.round(totalCost * 100) / 100,
    totalMovementsCount: allMovements.length,
    totalUnitsConsumed,
    appointmentsCount,
    avgCostPerAppointment,
    topSupplies,
    costByProcedure,
    consumptionEvolution,
  }
}

export interface RegisterMovementParams {
  supplyId: string
  type: SupplyMovementType
  quantity: number
  reason?: string
  patientId?: string
  userId?: string
  batchNumber?: string
  date?: string
}

export async function registerSupplyMovement(
  params: RegisterMovementParams,
): Promise<ClinicSupplyMovement> {
  // 1. Obter insumo atual
  const supply = await pb.collection('clinic_supplies').getOne<ClinicSupply>(params.supplyId)

  // 2. Calcular nova quantidade
  let newQuantity = supply.quantity
  if (params.type === 'entrada') {
    newQuantity += Number(params.quantity)
  } else if (params.type === 'saida_atendimento' || params.type === 'descarte') {
    newQuantity = Math.max(0, supply.quantity - Number(params.quantity))
  } else if (params.type === 'ajuste') {
    newQuantity = Number(params.quantity)
  }

  // 3. Registrar movimentação
  const movement = await pb.collection('clinic_supply_movements').create<ClinicSupplyMovement>({
    supply: params.supplyId,
    type: params.type,
    quantity: Number(params.quantity),
    reason: params.reason || '',
    patient: params.patientId || null,
    user: params.userId || pb.authStore.record?.id || null,
    batch_number: params.batchNumber || '',
    date: params.date || new Date().toISOString(),
  })

  // 4. Atualizar saldo do insumo
  await pb.collection('clinic_supplies').update(params.supplyId, {
    quantity: newQuantity,
  })

  // 5. Alerta de estoque baixo (notificação in-app para a clínica se ficar abaixo do mínimo)
  if (newQuantity <= supply.min_quantity && params.type !== 'entrada') {
    try {
      const clinicUser = pb.authStore.record?.id
      if (clinicUser) {
        await createNotification({
          userId: clinicUser,
          title: `⚠️ Alerta de Estoque Baixo: ${supply.name}`,
          message: `O insumo "${supply.name}" atingiu ${newQuantity} ${supply.unit} (mínimo: ${supply.min_quantity} ${supply.unit}). É necessária reposição de lote.`,
          type: 'warning',
          link: '/clinic/estoque',
        })
      }
    } catch {
      /* ignore notification failure */
    }
  }

  return movement
}

// Consumo em lote por atendimento/procedimento
export async function consumeSuppliesForProcedure(
  items: Array<{ supplyId: string; quantity: number }>,
  patientId?: string,
  procedureName?: string,
): Promise<void> {
  const currentUserId = pb.authStore.record?.id
  for (const item of items) {
    if (item.quantity > 0) {
      await registerSupplyMovement({
        supplyId: item.supplyId,
        type: 'saida_atendimento',
        quantity: item.quantity,
        reason: procedureName
          ? `Consumo no atendimento: ${procedureName}`
          : 'Consumo em consulta/procedimento',
        patientId,
        userId: currentUserId,
      })
    }
  }
}
