import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, getCartTotal, SHIPPING_THRESHOLD, SHIPPING_COST } from '../../store/cartStore';

export default function CheckoutPage() {
    const { items } = useStore(cartStore);
    const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
    const [pickupPayment, setPickupPayment] = useState<'cash' | 'online'>('cash');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
    });
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoError, setPromoError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = (method === 'pickup' || total >= SHIPPING_THRESHOLD) ? 0 : SHIPPING_COST;
    const finalTotal = total + shippingCost - promoDiscount;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(price / 100);
    };

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched({ ...touched, [e.target.name]: true });
    };

    const isFieldInvalid = (name: string) => {
        if (!touched[name]) return false;
        const value = formData[name as keyof typeof formData];
        if (!value) return true;

        if (name === 'email') {
            return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        if (name === 'zip') {
            return !/^\d{5}$/.test(value);
        }
        if (name === 'phone') {
            return value.length < 9;
        }
        return false;
    };

    const getErrorMessage = (name: string) => {
        if (!touched[name]) return '';
        const value = formData[name as keyof typeof formData];
        if (!value) return 'Este campo es obligatorio';

        if (name === 'email') return 'Email no válido';
        if (name === 'zip') return 'Debe tener 5 números';
        if (name === 'phone') return 'Mínimo 9 dígitos';
        return '';
    };

    const validatePromoCode = async (code: string) => {
        if (!code.trim()) {
            setPromoDiscount(0);
            setPromoError('');
            return;
        }

        try {
            const { supabase } = await import('../../lib/supabase');
            const { data: promo, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('active', true)
                .single();

            if (error || !promo) {
                setPromoError('Código no válido');
                setPromoDiscount(0);
                return;
            }

            // Validate dates
            const now = new Date();
            const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
            const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

            const isDateValid =
                (!validFrom || now >= validFrom) &&
                (!validUntil || now <= validUntil);

            // Validate usage limit
            const isUsageLimitValid =
                !promo.usage_limit ||
                (promo.times_used || 0) < promo.usage_limit;

            if (!isDateValid) {
                setPromoError('Código expirado');
                setPromoDiscount(0);
                return;
            }

            if (!isUsageLimitValid) {
                setPromoError('Código agotado');
                setPromoDiscount(0);
                return;
            }

            // Calculate discount
            let discount = 0;
            if (promo.discount_type === 'percent') {
                discount = Math.round(total * (promo.discount_value / 100));
            } else {
                // Fixed amount (stored in cents)
                discount = promo.discount_value;
            }

            setPromoDiscount(discount);
            setPromoError('');
        } catch (err) {
            console.error('Error validating promo code:', err);
            setPromoError('Error al validar código');
            setPromoDiscount(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all as touched on submit
        const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setTouched(allTouched);

        // Basic check before proceeding
        const hasErrors = Object.keys(formData).some(key => {
            if (method === 'pickup' && ['address', 'city', 'zip'].includes(key)) return false;
            return isFieldInvalid(key);
        });

        if (hasErrors) {
            showToast('Por favor, completa todos los campos requeridos correctamente', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            const { supabase } = await import('../../lib/supabase');

            // 1. Create Order
            const { data: { session } } = await supabase.auth.getSession();

            const orderData = {
                user_id: session?.user?.id || null, // Link to user if logged in
                customer_email: formData.email, // Explicitly save email for guest lookup
                total_price: Math.round(total + shippingCost),
                payment_method: method === 'pickup' ? pickupPayment : 'online',
                shipping_method: method,
                shipping_address: method === 'delivery' ? {
                    address: formData.address,
                    city: formData.city,
                    zip: formData.zip
                } : null,
                contact_info: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                },
                status: 'pending'
            };

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Handle Payment Flow
            const isOnlinePayment = (method === 'pickup' && pickupPayment === 'online') || method === 'delivery';

            // Clear cart logic moved inside payment flow or after redirect start
            const { clearCart } = await import('../../store/cartStore');

            if (isOnlinePayment) {
                // Get promo code
                const finalPromoCode = promoCode.trim() || undefined;

                // Redirect to Stripe
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        items: [
                            ...items,
                            ...(shippingCost > 0 ? [{
                                id: 'shipping',
                                name: 'Envío',
                                price: shippingCost,
                                quantity: 1,
                                image: ''
                            }] : [])
                        ],
                        orderId: order.id,
                        customerEmail: formData.email,
                        shippingMethod: method,
                        promoCode: finalPromoCode
                    }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error('API Error Response:', text);
                    throw new Error(`API Error ${response.status}: ${text}`);
                }

                const resultText = await response.text();
                if (!resultText) {
                    throw new Error("Empty response from payment server");
                }

                const session = JSON.parse(resultText);
                if (session.error) throw new Error(session.error);
                if (session.url) {
                    clearCart(); // Clear just before leaving
                    window.location.href = session.url;
                    return;
                }
            } else {
                // Cash on Pickup -> Direct Success
                clearCart();
                window.location.href = `/success?method=${method}&orderId=${order.id}`;
                return;
            }

        } catch (error: any) {
            console.error('Error creating order:', error);
            showToast(error.message || 'Error al procesar el pedido. Por favor, inténtalo de nuevo.', 'error');
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !isProcessing) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4 italic uppercase tracking-widest">Tu carrito está vacío</h1>
                <p className="text-gray-500 mb-8">Parece que aún no has añadido nada a tu selección.</p>
                <a href="/shop/new" className="inline-block bg-black text-white px-8 py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Volver a la tienda</a>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 ${toast.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                    }`}>
                    {toast.type === 'error' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    )}
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}
            {isProcessing && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic animate-pulse">
                        {method === 'delivery' || pickupPayment === 'online' ? 'Redirigiendo a Stripe...' : 'Procesando pedido...'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">Por favor, no cierres esta ventana</p>
                </div>
            )}
            <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest">Finalizar Compra</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT COLUMN: Forms */}
                <div>
                    {/* Method Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">¿Cómo quieres recibirlo?</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setMethod('pickup')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${method === 'pickup'
                                    ? 'border-black bg-gray-50 font-bold'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="block text-2xl mb-2">🏪</span>
                                Recoger en Tienda
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('delivery')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${method === 'delivery'
                                    ? 'border-black bg-gray-50 font-bold'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="block text-2xl mb-2">🚚</span>
                                Envío a Domicilio
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Content based on Method */}
                    <form id="checkout-form" onSubmit={handleSubmit} noValidate>
                        {method === 'pickup' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
                                <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">Detalles de Recogida</h2>
                                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm text-gray-600">
                                    <p className="font-bold text-gray-900">SLC CUTS Barbería</p>
                                    <p>C. Miguel de Cervantes, 79</p>
                                    <p>11550 Chipiona, Cádiz</p>
                                    <p className="mt-2 text-green-600">✓ Disponible para recogida hoy</p>
                                </div>

                                <div className="mb-6 space-y-4">
                                    <h3 className="font-bold border-b pb-2">Datos de Contacto</h3>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('name') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('name') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('name')}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1">
                                                Teléfono <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('phone') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                            />
                                            {isFieldInvalid('phone') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('phone')}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('email') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                            />
                                            {isFieldInvalid('email') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('email')}</p>}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-bold mb-3">Método de Pago</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            checked={pickupPayment === 'cash'}
                                            onChange={() => setPickupPayment('cash')}
                                            className="w-5 h-5 text-black focus:ring-black"
                                        />
                                        <div>
                                            <span className="font-bold block">Pagar en efectivo al recoger</span>
                                            <span className="text-sm text-gray-500">Paga en el mostrador cuando vengas a por tu pedido</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="online"
                                            checked={pickupPayment === 'online'}
                                            onChange={() => setPickupPayment('online')}
                                            className="w-5 h-5 text-black focus:ring-black"
                                        />
                                        <div>
                                            <span className="font-bold block">Pago Online (Tarjeta)</span>
                                            <span className="text-sm text-gray-500">Asegura tu reserva pagando ahora</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {method === 'delivery' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
                                <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">Datos de Envío</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold mb-1">
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('name') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('name') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('name')}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold mb-1">
                                            Teléfono <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('phone') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('phone') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('phone')}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('email') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('email') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('email')}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold mb-1">
                                            Dirección <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="address"
                                            placeholder="Calle, número, piso..."
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('address') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('address') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('address')}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">
                                            Ciudad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('city') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('city') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('city')}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">
                                            Código Postal <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="zip"
                                            placeholder="11550"
                                            value={formData.zip}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition-colors ${isFieldInvalid('zip') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        {isFieldInvalid('zip') && <p className="text-red-500 text-xs mt-1">{getErrorMessage('zip')}</p>}
                                    </div>
                                </div>

                                <h3 className="font-bold mb-3 mt-6">Método de Pago</h3>
                                <div className="p-4 border rounded-lg bg-gray-50 opacity-75">
                                    <span className="font-bold block">Pago Online (Tarjeta)</span>
                                    <span className="text-sm text-gray-500">Única opción disponible para envíos</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* RIGHT COLUMN: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-xl sticky top-24">
                        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">Resumen del Pedido</h2>

                        {/* Item List (Condensed) */}
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar p-2">
                            {items.map(item => (
                                <div key={`${item.id}-${item.size}`} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-1 rounded border border-gray-200 relative">
                                            <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-sm" />
                                            <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold line-clamp-1 max-w-[150px]">{item.name}</p>
                                            {item.size && <p className="text-gray-500 text-xs">{item.size}</p>}
                                        </div>
                                    </div>
                                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Envío</span>
                                <span>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                            </div>
                            {promoDiscount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Descuento ({promoCode})</span>
                                    <span>-{formatPrice(promoDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2 text-gray-900">
                                <span>Total</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Promo Code Input */}
                        {(method === 'delivery' || pickupPayment === 'online') && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <label className="block text-sm font-bold mb-2">¿Tienes un código promocional?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="DESCUENTO20"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase font-mono"
                                        maxLength={20}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => validatePromoCode(promoCode)}
                                        className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors uppercase tracking-wider"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                                {promoDiscount > 0 && <p className="text-green-600 text-xs mt-1">✓ Código aplicado</p>}
                            </div>
                        )}

                        <button
                            onClick={(e) => {
                                // Trigger form submission from outside the form
                                const form = document.getElementById('checkout-form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }}
                            disabled={isProcessing}
                            className={`w-full mt-6 py-4 rounded-lg font-bold uppercase tracking-widest text-white transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                                }`}
                        >
                            {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
