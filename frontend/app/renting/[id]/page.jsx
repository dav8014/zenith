import { notFound, redirect } from 'next/navigation'
import { getVehiculoById, getVehiculoImagenes } from '../../../lib/api'
import VehicleDetail from '../../../components/VehicleDetail'

export async function generateMetadata({ params }) {
  const { id } = await params
  const v = await getVehiculoById(id)
  if (!v) return { title: 'Vehículo no encontrado' }
  return { title: `${v.marca} ${v.modelo} (${v.anio}) — Renting` }
}

export default async function RentingVehiclePage({ params }) {
  const { id } = await params
  const [v, imagenes] = await Promise.all([getVehiculoById(id), getVehiculoImagenes(id)])
  if (!v) notFound()
  if (v.origen === 'importado') redirect(`/importacion/${id}`)
  return <VehicleDetail vehicle={v} backHref="/renting" imagenes={imagenes} showSimulador />
}
