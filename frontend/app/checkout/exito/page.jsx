import Link from 'next/link'

export default function CheckoutExito() {
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-6 text-center">
      
      {/* El tick verde de victoria */}
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
        <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-white mb-4">RESERVA CONFIRMADA</h1>
      <p className="text-[#8892A4] max-w-md mx-auto mb-8">
        Hemos bloqueado el vehículo en origen. La operación ha sido registrada en nuestros servidores y nuestro equipo logístico internacional se pondrá en contacto contigo en menos de 24 horas para la firma del mandato.
      </p>

      <div className="bg-[#080C13] border border-[#1A2035] p-6 rounded-lg w-full max-w-sm mb-8 text-left">
        <p className="text-[10px] text-[#5A657A] tracking-widest mb-1">ESTADO DE LA OPERACIÓN</p>
        <p className="font-roboto-mono text-emerald-400 font-bold mb-4">PAGADO (SEÑAL INICIAL)</p>
        
        <p className="text-[10px] text-[#5A657A] tracking-widest mb-1">SIGUIENTE PASO</p>
        <p className="font-roboto-mono text-white text-sm">Firma digital de contrato</p>
      </div>

      <Link 
        href="/catalogo"
        className="px-8 py-3 bg-accent hover:bg-accent-dark text-white font-roboto-mono text-xs font-bold transition-all border border-transparent hover:border-accent"
      >
        VOLVER AL CATÁLOGO
      </Link>

    </div>
  )
}