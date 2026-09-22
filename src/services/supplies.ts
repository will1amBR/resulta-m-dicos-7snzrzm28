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
): Promise<ClinicSupplyMovement[]> {
  let filter = ''
  if (supplyId) {
    filter = `supply = "${supplyId}"`
  }
  const records = await pb
    .collection('clinic_supply_movements')
    .getList<ClinicSupplyMovement>(1, limit, {
      filter,
      sort: '-created',
      expand: 'supply,patient,user',
    })
  return records.items
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
