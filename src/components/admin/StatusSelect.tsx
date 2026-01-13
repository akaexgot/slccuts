import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface StatusSelectProps {
    id: string;
    initialStatus: string;
}

const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    paid: { label: 'Pagado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    completed: { label: 'Completado', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function StatusSelect({ id, initialStatus }: StatusSelectProps) {
    const [status, setStatus] = useState(initialStatus);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentConfig = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusChange = async (newStatus: string) => {
        const oldStatus = status;
        setStatus(newStatus);
        setIsOpen(false);

        try {
            const response = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: id, status: newStatus })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al actualizar estado');
            }

            // Dispatch event to update other UI elements (like email button)
            window.dispatchEvent(new CustomEvent('order-status-updated', {
                detail: { orderId: id, status: newStatus }
            }));

        } catch (error) {
            console.error('Error updating status:', error);
            setStatus(oldStatus); // Revert on error
            alert('Error al actualizar estado');
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${currentConfig.color} hover:brightness-110 active:scale-95`}
            >
                {currentConfig.label}
                <svg
                    className={`w-3 h-3 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="py-1">
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleStatusChange(key)}
                                className={`group flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-700/50 ${status === key ? 'bg-gray-700/50 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${config.color.split(' ')[0].replace('/20', '')}`}></div>
                                {config.label}
                                {status === key && (
                                    <svg className="ml-auto w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
