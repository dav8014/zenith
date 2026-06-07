'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, authHeader } from '../../lib/auth';

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState('vehiculos');
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  
  // 1. EL ESTADO DEL FORMULARIO DE CREACIÓN
  const estadoInicialForm = {
    id: null,
    marca: '',
    modelo: '',
    anio: 2026,
    kilometraje: 0,
    combustible: 'gasolina',
    precio_base: 0,
    precio_final: 0,
    origen: 'importado',
    imagen_url: ''
  };

  // 2. EL ESTADO DEL COMPONENTE
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') {
      alert("Acceso denegado.");
      router.push('/');
    } else {
      setLoading(false);
      cargarVehiculos();
    }
  }, [router]);

  // READ
  const cargarVehiculos = async () => {
    try {
      const res = await fetch('http://localhost:8001/api/v1/vehiculos/', {
        headers: authHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // CREATE
  const handleGuardarVehiculo = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      anio: parseInt(formData.anio),
      kilometraje: parseInt(formData.kilometraje),
      precio_base: parseFloat(formData.precio_base),
      precio_final: parseFloat(formData.precio_final)
    };
    
    // Eliminamos el ID del payload porque FastAPI lo leerá de la URL si estamos editando
    delete payload.id; 

    // LA LÓGICA DE BIFURCACIÓN
    const esEdicion = formData.id !== null;
    const url = esEdicion 
        ? `http://localhost:8001/api/v1/vehiculos/${formData.id}` 
        : `http://localhost:8001/api/v1/vehiculos/`;
    const metodo = esEdicion ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMostrarForm(false);
        setFormData(estadoInicialForm); // Reseteamos al estado limpio
        cargarVehiculos();
      } else {
        const err = await res.json();
        console.error("Rechazo de FastAPI:", err);
        alert(`Error al guardar: ${err.detail || 'Revisa la consola'}`);
      }
    } catch (error) {
      console.error("Fallo de red:", error);
    }
  };

  // DELETE
  const handleBorrarVehiculo = async (id, marca, modelo) => {
    // 1. El seguro de vida
    const confirmado = window.confirm(`ATENCIÓN: ¿Estás absolutamente seguro de que quieres destruir el ${marca} ${modelo} (ID: ${id})?\n\nEsta acción purgará el registro de PostgreSQL de forma irreversible.`);
    
    if (!confirmado) return; // Si el usuario se acobarda, abortamos.

    // 2. La ejecución
    try {
      const res = await fetch(`http://localhost:8001/api/v1/vehiculos/${id}`, {
        method: 'DELETE',
        headers: authHeader() // La chapa de administrador es obligatoria aquí
      });

      if (res.ok) {
        // Refrescamos la tabla al instante para reflejar la baja
        cargarVehiculos(); 
      } else {
        const err = await res.json();
        console.error("Rechazo del backend:", err);
        alert(`Fallo al borrar. ¿Tiene este coche contratos asociados? Revisa la consola.\nDetalle: ${err.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Fallo de red en el borrado:", error);
    }
  };

  // UPDATE
  const prepararEdicion = (coche) => {
    setFormData({
      id: coche.id,
      marca: coche.marca,
      modelo: coche.modelo,
      anio: coche.anio,
      kilometraje: coche.kilometraje,
      combustible: coche.combustible,
      precio_base: coche.precio_base,
      precio_final: coche.precio_final,
      origen: coche.origen,
      imagen_url: coche.imagen_url || ''
    });
    setMostrarForm(true);
    // Hacemos scroll hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  if (loading) return <div className="p-10 text-white font-mono">Verificando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-28">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-blue-500">ZENITH // Panel de Control</h1>
      </header>

      <nav className="flex gap-4 mb-8">
        <button onClick={() => setTab('vehiculos')} className={`px-4 py-2 ${tab === 'vehiculos' ? 'bg-blue-600' : 'bg-gray-800'}`}>Inventario</button>
      </nav>

      <main className="bg-gray-800 p-6 rounded shadow-lg border border-gray-700">
        {tab === 'vehiculos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Gestión de Vehículos</h2>
              <button 
                onClick={() => setMostrarForm(!mostrarForm)}
                className="bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-500 transition-colors rounded">
                {mostrarForm ? 'Cancelar' : '+ Nuevo Vehículo'}
              </button>
            </div>

            {/* 3. EL FORMULARIO DESPLEGABLE */}
            {mostrarForm && (
              <form onSubmit={handleGuardarVehiculo} className="bg-gray-700 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Marca</label>
                  <input type="text" required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 border border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Modelo</label>
                  <input type="text" required value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 border border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Año</label>
                  <input type="number" required value={formData.anio} onChange={e => setFormData({...formData, anio: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Kilometraje</label>
                  <input type="number" required value={formData.kilometraje} onChange={e => setFormData({...formData, kilometraje: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Precio Base (€)</label>
                  <input type="number" step="0.01" required value={formData.precio_base} onChange={e => setFormData({...formData, precio_base: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Precio Final (€)</label>
                  <input type="number" step="0.01" required value={formData.precio_final} onChange={e => setFormData({...formData, precio_final: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Combustible</label>
                  <select value={formData.combustible} onChange={e => setFormData({...formData, combustible: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded">
                    <option value="gasolina">Gasolina</option>
                    <option value="diesel">Diésel</option>
                    <option value="electrico">Eléctrico</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">Origen</label>
                  <select value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} className="w-full bg-gray-900 text-white px-3 py-2 rounded">
                    <option value="nacional">Nacional</option>
                    <option value="importado">Importado</option>
                  </select>
                </div>
                <div className="col-span-2">
  <label className="block text-xs text-gray-400 uppercase mb-1">URL de la Imagen Frontal</label>
  <input type="url" value={formData.imagen_url} onChange={e => setFormData({...formData, imagen_url: e.target.value})} placeholder="https://ruta-de-la-imagen.com/foto.jpg" className="w-full bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 border border-transparent" />
</div>
                <div className="col-span-2 mt-4">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors">
                    Guardar Vehículo en Base de Datos
                  </button>
                </div>
              </form>
            )}

            {/* TABLA DE VEHÍCULOS (La que ya tenías) */}
            <table className="w-full text-left bg-gray-900 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr className="text-gray-300 border-b border-gray-600">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Precio Final</th>
                  <th className="py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* LA INYECCIÓN DINÁMICA */}
                {vehiculos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-500 font-mono">
                      No hay vehículos registrados en la base de datos.
                    </td>
                  </tr>
                ) : (
                  vehiculos.map((coche) => (
                    <tr key={coche.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-4 text-gray-400 font-mono">{coche.id}</td>
                      <td className="py-3 px-4 font-semibold text-blue-400">
                        {coche.marca} {coche.modelo}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${coche.estado_logistico === 'disponible' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                          {coche.estado_logistico}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{coche.precio_final} €</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button 
                          onClick={() => prepararEdicion(coche)}
                          className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition-colors text-white font-bold">
                          Editar
                        </button>
                        <button 
                          onClick={() => handleBorrarVehiculo(coche.id, coche.marca, coche.modelo)}
                          className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded transition-colors text-white font-bold">
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}