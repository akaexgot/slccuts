import React, { useState, useEffect, useRef } from 'react';

export const openShippingModal = (shippingAddress: any, orderId: string) => {
    const event = new CustomEvent('open-shipping-modal', {
        detail: { shippingAddress, orderId }
    });
    window.dispatchEvent(event);
};

export default function ShippingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<{ address: any; orderId: string } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOpen = (e: any) => {
            setData(e.detail);
            setIsOpen(true);
            document.body.style.overflow = 'hidden';
        };

        window.addEventListener('open-shipping-modal', handleOpen);
        return () => window.removeEventListener('open-shipping-modal', handleOpen);
    }, []);

    const closeModal = () => {
        setIsOpen(false);
        document.body.style.overflow = '';
    };

    if (!isOpen || !data) return null;

    const { address, orderId } = data;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => {
                if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                    closeModal();
                }
            }}
        >
            <div
                ref={modalRef}
                className="relative bg-[#0d1117] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300"
            >
                {/* Header Profile Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative p-10">
                    <button
                        onClick={closeModal}
                        className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div className="mb-8">
                        <span className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/40 mb-4 tracking-[0.2em] uppercase">
                            #{orderId.slice(0, 8).toUpperCase()}
                        </span>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                            Detalles de <span className="text-blue-500">Envío</span>
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {/* Address Field */}
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 group-hover:text-gray-400 transition-colors">Dirección</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 group-hover:bg-white/[0.07] transition-all">
                                <p className="text-white font-bold text-lg leading-tight uppercase italic">{address.address || 'No especificada'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* City Field */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Ciudad</label>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-white font-black text-sm uppercase italic">{address.city || '-'}</p>
                                </div>
                            </div>
                            {/* ZIP Field */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">C. Postal</label>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-white font-black text-sm uppercase tracking-widest font-mono">{address.zip || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Province Field */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Provincia/Estado</label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <p className="text-white font-black text-sm uppercase italic">{address.province || '-'}</p>
                            </div>
                        </div>

                        {/* Notes Field */}
                        {address.notes && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Notas Especiales</label>
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                    <p className="text-blue-200/80 text-xs font-bold leading-relaxed">{address.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
                        <button
                            onClick={closeModal}
                            className="px-10 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
