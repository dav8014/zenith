import { getVehiculosNacionales } from '../../lib/api'
import VehicleCard from '../../components/VehicleCard'
import FilterPanel from '../../components/FilterPanel'
import PaginationComponent from '../../components/PaginationComponent'

export const metadata = {
  title: 'Renting de vehículos',
  description: 'Flota nacional de vehículos disponibles para renting. Financiación online.',
}

const ITEMS_PER_PAGE = 9

function applyFilters(vehiculos, { search, combustible, precioMax, sort }) {
  let list = [...vehiculos]

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(v => `${v.marca} ${v.modelo}`.toLowerCase().includes(q))
  }
  if (combustible) list = list.filter(v => v.combustible === combustible)
  if (precioMax) list = list.filter(v => parseFloat(v.precio_final) <= Number(precioMax))

  if (sort === 'precio_desc') list.sort((a, b) => parseFloat(b.precio_final) - parseFloat(a.precio_final))
  else if (sort === 'anio_desc') list.sort((a, b) => b.anio - a.anio)
  else if (sort === 'km_asc') list.sort((a, b) => a.kilometraje - b.kilometraje)
  else list.sort((a, b) => parseFloat(a.precio_final) - parseFloat(b.precio_final))

  return list
}

export default async function RentingPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise

  const {
    search = '',
    combustible = '',
    precioMax = '200000',
    sort = 'precio_asc',
    page = '1',
  } = searchParams

  const allVehiculos = await getVehiculosNacionales()
  const vehiculosUnicos = allVehiculos.filter(
    (vehiculo, index, self) =>
      index === self.findIndex(
        v => v.marca === vehiculo.marca && v.modelo === vehiculo.modelo
      )
  )

  const filtered = applyFilters(vehiculosUnicos, { search, combustible, precioMax, sort })
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(Math.max(1, Number(page)), totalPages)
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const initialFilters = { search, combustible, precioMax: Number(precioMax), sort }

  const baseParams = new URLSearchParams()
  if (search) baseParams.set('search', search)
  if (combustible) baseParams.set('combustible', combustible)
  if (Number(precioMax) < 200000) baseParams.set('precioMax', precioMax)
  if (sort !== 'precio_asc') baseParams.set('sort', sort)
  const baseParamsStr = baseParams.toString()

  return (
    <main className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-[#080C13] border-b border-[#1A2035]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="terminal-text text-[10px] text-accent mb-1">// RENTING</p>
          <h1 className="font-exo2 text-3xl font-bold text-white">Renting de vehículos</h1>
          <p className="font-roboto-mono text-xs text-[#8892A4] mt-2">
            [ FLOTA NACIONAL // VEHÍCULOS DISPONIBLES ]
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="pulse-dot" />
            <p className="terminal-text text-[10px] text-accent">
              {filtered.length} UNIDAD{filtered.length !== 1 ? 'ES' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <FilterPanel initialFilters={initialFilters} showOrigen={false} />
          </aside>

          <div className="flex-1 min-w-0">
            {paged.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paged.map(v => (
                    <VehicleCard key={v.id} vehiculo={v} />
                  ))}
                </div>
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseParams={baseParamsStr}
                />
              </>
            ) : (
              <div className="glass p-16 text-center">
                <div className="w-12 h-12 border border-[#1A2035] flex items-center justify-center mx-auto mb-4">
                  <span className="terminal-text text-[9px] text-[#8892A4]">00</span>
                </div>
                <h3 className="font-exo2 text-xl font-semibold text-white mb-2">Sin resultados</h3>
                <p className="text-[#8892A4] text-sm">
                  No hay vehículos que coincidan con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
