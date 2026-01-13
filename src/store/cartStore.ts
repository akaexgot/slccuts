import { map } from "nanostores";
import { persistentMap } from "@nanostores/persistent";

// Types
export interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    quantity: number;
    image: string;
    size?: string;
}

export interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
}

export const SHIPPING_THRESHOLD = 5000; // 50.00€
export const SHIPPING_COST = 399; // 3.99€

// Store
// We use persistentMap for items to survive reload. 
// However, persistentMap stores strings. We need to handle JSON parsing/stringifying if we want to store the whole object structure, 
// OR use 'persistentAtom' with a custom parser. 
// Simplest given the structure is to keep `isCartOpen` in memory (reopens on action) and `items` in persistence.
// Let's refactor: separate store for state and persistence? 
// Actually, persistentMap works key-value. 
// Better approach for complex array: persistentAtom.

import { persistentAtom } from '@nanostores/persistent';

export const cartStore = persistentAtom<CartState>('cart', {
    items: [],
    isCartOpen: false,
}, {
    encode: JSON.stringify,
    decode: JSON.parse,
});

// Actions
export const isCartOpen = () => cartStore.get().isCartOpen;

export function toggleCart() {
    const current = cartStore.get();
    cartStore.set({ ...current, isCartOpen: !current.isCartOpen });
}

export function openCart() {
    const current = cartStore.get();
    cartStore.set({ ...current, isCartOpen: true });
}

export function closeCart() {
    const current = cartStore.get();
    cartStore.set({ ...current, isCartOpen: false });
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
    const current = cartStore.get();
    const currentItems = current.items;
    const existingItemIndex = currentItems.findIndex(
        (i) => i.id === item.id && i.size === item.size
    );

    const quantityToAdd = item.quantity || 1;

    if (!item.id) {
        console.error("Attempted to add item without ID to cart:", item);
        return;
    }

    let updatedItems;
    if (existingItemIndex >= 0) {
        // Increment quantity if item exists
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += quantityToAdd;
    } else {
        // Add new item
        updatedItems = [...currentItems, {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            quantity: quantityToAdd
        }];
    }

    cartStore.set({ ...current, items: updatedItems });

    // Open cart for feedback
    openCart();
}

export function removeFromCart(itemId: string, size?: string) {
    const current = cartStore.get();
    const currentItems = current.items;
    const updatedItems = currentItems.filter(
        (i) => i.id !== itemId || (size && i.size !== size)
    );
    cartStore.set({ ...current, items: updatedItems });
}

export function updateQuantity(itemId: string, quantity: number, size?: string) {
    const current = cartStore.get();
    const currentItems = current.items;
    if (quantity <= 0) {
        removeFromCart(itemId, size);
        return;
    }

    const updatedItems = currentItems.map((i) =>
        i.id === itemId && i.size === size ? { ...i, quantity } : i
    );
    cartStore.set({ ...current, items: updatedItems });
}

// Computed helper (can be used directly in components)
export function getCartTotal() {
    return cartStore.get().items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function clearCart() {
    const current = cartStore.get();
    cartStore.set({ ...current, items: [], isCartOpen: false });
}
