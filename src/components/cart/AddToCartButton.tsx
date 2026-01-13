import React, { useState } from 'react';
import { addToCart } from '../../store/cartStore';

interface AddToCartProps {
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
    };
    availableSizes?: string[];
}

export const AddToCartButton: React.FC<AddToCartProps> = ({ product, availableSizes = ['S', 'M', 'L', 'XL'] }) => {
    const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
    const [loading, setLoading] = useState(false);

    const handleAddToCart = () => {
        setLoading(true);

        // Simulate network delay or processing if needed, though Nano Stores is synchronous
        setTimeout(() => {
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: selectedSize,
            });
            setLoading(false);
        }, 300);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Size Selector */}
            <div className="flex gap-2">
                {availableSizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 border flex items-center justify-center transition-all ${selectedSize === size
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                            }`}
                    >
                        {size}
                    </button>
                ))}
            </div>

            {/* Button */}
            <button
                onClick={handleAddToCart}
                disabled={loading}
                className="w-full bg-black text-white py-4 uppercase font-bold tracking-widest hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? (
                    <span className="animate-pulse">Añadiendo...</span>
                ) : (
                    <span>Añadir al Carrito</span>
                )}
            </button>
        </div>
    );
};
