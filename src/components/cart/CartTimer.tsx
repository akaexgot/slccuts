import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, getRemainingTime, checkAndClearExpiredCart } from '../../store/cartStore';

export default function CartTimer() {
    const cart = useStore(cartStore);
    const [remainingTime, setRemainingTime] = useState(getRemainingTime());
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        // Update timer every second
        const interval = setInterval(async () => {
            const time = getRemainingTime();
            setRemainingTime(time);

            if (time <= 0 && cart.items.length > 0) {
                setIsExpired(true);
                await checkAndClearExpiredCart();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [cart.items.length]);

    // Don't show timer if cart is empty or no expiration set
    if (cart.items.length === 0 || !cart.expiresAt) {
        return null;
    }

    // Format time as MM:SS
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Determine urgency level for styling
    const isUrgent = remainingTime < 60000; // Less than 1 minute
    const isCritical = remainingTime < 30000; // Less than 30 seconds

    if (isExpired) {
        return (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span className="font-bold text-sm">Tu carrito ha expirado</span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                    La reserva de productos ha caducado. Por favor, añade los productos de nuevo.
                </p>
            </div>
        );
    }

    return (
        <div className={`rounded-lg p-4 mb-4 transition-all ${isCritical
                ? 'bg-red-50 border-2 border-red-400 animate-pulse'
                : isUrgent
                    ? 'bg-orange-50 border-2 border-orange-300'
                    : 'bg-blue-50 border border-blue-200'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={isCritical ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span className={`text-sm font-medium ${isCritical ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-blue-800'
                        }`}>
                        Tiempo restante
                    </span>
                </div>
                <span className={`text-lg font-bold tabular-nums ${isCritical ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-blue-700'
                    }`}>
                    {formattedTime}
                </span>
            </div>
            <p className={`text-xs mt-2 ${isCritical ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'
                }`}>
                {isCritical
                    ? '¡Apúrate! Tu reserva expirará pronto'
                    : isUrgent
                        ? 'Tu reserva expirará en menos de 1 minuto'
                        : 'Los productos están reservados para ti'
                }
            </p>
        </div>
    );
}
