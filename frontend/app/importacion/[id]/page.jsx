import { notFound, redirect } from 'next/navigation'
import { getVehiculoById, getVehiculoImagenes } from '../../../lib/api'
import VehicleDetail from '../../../components/VehicleDetail'

export async function generateMetadata({ params }) {
  const { id } = await params
  const v = await getVehiculoById(id)
  if (!v) return { title: 'Vehículo no encontrado' }
  return { title: `${v.marca} ${v.modelo} (${v.anio}) — Importación` }
}

export default async function ImportacionVehiclePage({ params }) {
  const { id } = await params
  const [v, imagenes] = await Promise.all([getVehiculoById(id), getVehiculoImagenes(id)])
  if (!v) notFound()
  if (v.origen === 'nacional') redirect(`/renting/${id}`)
  return <VehicleDetail vehicle={v} backHref="/importacion" imagenes={imagenes} />
}
