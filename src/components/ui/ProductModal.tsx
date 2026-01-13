import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { modalStore, closeModal } from '../../store/modalStore';
import { addToCart } from '../../store/cartStore';

export default function ProductModal() {
    const { isOpen, product } = useStore(modalStore);
    const modalRef = useRef<HTMLDivElement>(null);
    const [quantity, setQuantity] = useState<number>(1);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
            // Reset quantity on open
            setQuantity(1);
        } else {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            closeModal();
        }
    };

    const s = product.stock;
    const stockQuantity = (Array.isArray(s) ? s[0]?.quantity : s?.quantity) ?? 0;
    const hasStock = stockQuantity > 0;

    const handleAddToCart = () => {
        if (!product || !hasStock) return;

        addToCart({
            id: product.id.toString(),
            name: product.name,
            price: product.price,
            image: product.image_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
            quantity: quantity
        });

        closeModal();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(price / 100);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200"
            >
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-gray-100 min-h-[300px] md:min-h-[500px]">
                    <img
                        src={product.image_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="mb-auto">
                        <div className="flex items-center gap-3 mb-2">
                            {product.category && (
                                <span className="text-sm text-gray-500 uppercase tracking-wider block">
                                    {product.category.name}
                                </span>
                            )}
                            {hasStock ? (
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    En Stock
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Agotado
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
                        <div className="text-2xl font-bold text-gray-900 mb-6">
                            {formatPrice(product.price)}
                        </div>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {product.description || "Descripción del producto no disponible."}
                        </p>

                        {/* Quantity Selector */}
                        <div className={`mb-8 ${!hasStock ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Cantidad</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                    disabled={quantity <= 1 || !hasStock}
                                >
                                    -
                                </button>
                                <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                                    className="w-10 h-10 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                    disabled={quantity >= stockQuantity || !hasStock}
                                >
                                    +
                                </button>
                                {hasStock && (
                                    <span className="text-xs text-gray-400">
                                        {stockQuantity} unidades disponibles
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={!hasStock}
                            className={`w-full font-bold py-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${hasStock
                                    ? "bg-black text-white hover:bg-gray-800"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {hasStock && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                                    <path d="M3 6h18"></path>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                            )}
                            {hasStock ? `Añadir ${quantity > 1 ? `(${quantity})` : ''} al Carrito` : "Producto Agotado"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
