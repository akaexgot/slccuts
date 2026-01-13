import React from 'react';
import { useStore } from '@nanostores/react';
import {
    cartStore,
    removeFromCart,
    updateQuantity,
    SHIPPING_THRESHOLD,
    SHIPPING_COST
} from '../../store/cartStore';

export default function CartPage() {
    const { items } = useStore(cartStore);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(price / 100);
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest">Carrito de Compra</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Cart Items */}
                <div className="flex-1 space-y-4">
                    {/* ... (empty state and list remain same) ... */}
                    {items.length === 0 && (
                        <div className="bg-gray-50 rounded-xl p-12 text-center border dashed border-gray-200">
                            {/* SVG icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                                <path d="M3 6h18"></path>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <p className="text-gray-600 mb-4">Tu carrito está vacío.</p>
                            <a href="/shop/new" className="text-black font-bold hover:underline uppercase tracking-widest text-sm">Continuar Comprando</a>
                        </div>
                    )}

                    {items.map((item) => (
                        <div key={`${item.id}-${item.size}`} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        {item.size && <p className="text-sm text-gray-500">Talla: {item.size}</p>}
                                    </div>
                                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center border border-gray-200 rounded-md">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)} className="px-3 py-1 hover:bg-gray-100 transition-colors text-gray-600" disabled={item.quantity <= 1}>-</button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)} className="px-3 py-1 hover:bg-gray-100 transition-colors text-gray-600">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 text-sm hover:underline">Eliminar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                {items.length > 0 && (
                    <div className="md:w-80 h-fit bg-gray-50 p-6 rounded-xl space-y-4 sticky top-24 border border-gray-100">
                        <h3 className="font-bold text-lg uppercase tracking-wider">Resumen</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Envío</span>
                            <span className={shippingCost === 0 ? "text-green-600 font-bold" : ""}>
                                {shippingCost === 0 ? '¡Gratis!' : formatPrice(shippingCost)}
                            </span>
                        </div>
                        {shippingCost > 0 && (
                            <p className="text-[10px] text-gray-400 italic">
                                Envío gratis en pedidos superiores a {formatPrice(SHIPPING_THRESHOLD)}
                            </p>
                        )}
                        <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        <a href="/checkout" className="block w-full text-center bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all uppercase tracking-widest text-sm">
                            Tramitar Pedido
                        </a>
                        <div className="flex justify-center gap-4 text-gray-400 mt-4 text-sm font-medium">
                            <span>VISA</span>
                            <span>MC</span>
                            <span>PayPal</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
