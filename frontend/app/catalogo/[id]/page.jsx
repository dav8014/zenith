import RentingSimulador from '@/components/RentingSimulador'
import TarjetaImportacion from '@/components/TarjetaImportacion'

export default async function CatalogoDetallePage({ params }) {
  // CORRECCIÓN CRÍTICA PARA NEXT.JS 16: params se debe resolver asíncronamente
  const { id } = await params; 

  // Ahora 'id' vale "936" de verdad y no una Promesa rota
  const res = await fetch(`http://localhost:8001/api/v1/vehiculos/${id}`, { 
    cache: 'no-store' 
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <p className="text-red-500 font-roboto-mono">Error 404: Vehículo no encontrado o servidor backend apagado.</p>
      </div>
    );
  }

  const vehiculo = await res.json();

  // 2. RENDERIZADO DE LA PÁGINA
  return (
    <div className="min-h-screen bg-[#020817] text-white p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">

        {/* COLUMNA IZQUIERDA: DATOS DEL COCHE */}
        <div className="col-span-2 bg-[#080C13] border border-[#1A2035] p-6 rounded-lg h-fit">
          <div className="mb-6 pb-6 border-b border-[#1A2035]">
            <span className="bg-accent/10 text-[#00D4FF] text-[10px] px-2 py-1 border border-accent/30 font-roboto-mono uppercase tracking-widest">
              {vehiculo.origen}
            </span>
            <h1 className="text-4xl font-bold mt-4 mb-2">{vehiculo.marca} {vehiculo.modelo}</h1>
            <p className="text-[#8892A4] font-roboto-mono text-sm">Ref: #{vehiculo.id}</p>
          </div>
          
          {/* Aquí puedes meter luego tu componente VehicleDetail original si lo tenías separado */}
          <div className="aspect-video bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
            <p className="text-[#5A657A] font-roboto-mono text-sm">[ESPACIO PARA FOTOGRAFÍA DEL VEHÍCULO]</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: LA PUERTA LÓGICA (EL CAJERO) */}
        <div className="col-span-1">
          
          {/* EL CHIVATO: ESTO EXPONE LA VERDAD DE TU API */}
          <div className="bg-red-600 text-white font-roboto-mono p-4 mb-4 border-4 border-yellow-400">
            <p className="font-bold text-lg border-b border-red-400 mb-2">DEBUGGER BRUTAL</p>
            <p>1. ID en la URL: {vehiculo.id}</p>
            <p>2. Origen que llega de Python: <span className="bg-black px-2">"{vehiculo.origen}"</span></p>
          </div>

          {/* Lógica blindada: Si no dice exactamente 'importado', asume nacional por seguridad */}
          {vehiculo.origen?.toLowerCase().trim() === 'importado' ? (
            <TarjetaImportacion vehicle={vehiculo} />
          ) : (
            <RentingSimulador vehiculoId={vehiculo.id} precioFinal={vehiculo.precio_final} />
          )}
        </div>

      </div>
    </div>
  );
}