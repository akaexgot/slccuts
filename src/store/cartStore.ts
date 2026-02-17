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
    maxStock?: number; // Maximum stock available for this product
}

export interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    sessionId: string;
    expiresAt: number | null; // Timestamp in milliseconds
}

export const SHIPPING_THRESHOLD = 10000; // 100.00€
export const SHIPPING_COST = 399; // 3.99€
export const CART_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Generate a unique session ID
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Store
import { persistentAtom } from '@nanostores/persistent';

const defaultState: CartState = {
    items: [],
    isCartOpen: false,
    sessionId: generateSessionId(),
    expiresAt: null,
};

export const cartStore = persistentAtom<CartState>('cart', defaultState, {
    encode: JSON.stringify,
    decode: (str) => {
        try {
            const parsed = JSON.parse(str);
            // Ensure sessionId exists
            if (!parsed.sessionId) {
                parsed.sessionId = generateSessionId();
            }
            return parsed;
        } catch {
            return defaultState;
        }
    },
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

export async function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number; maxStock?: number }) {
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
    let finalQuantity = quantityToAdd;

    if (existingItemIndex >= 0) {
        // Increment quantity if item exists
        updatedItems = [...currentItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantityToAdd;

        // Validate against stock if maxStock is provided
        if (item.maxStock !== undefined && newQuantity > item.maxStock) {
            console.warn(`Cannot add ${quantityToAdd} more items. Stock limit: ${item.maxStock}, current in cart: ${updatedItems[existingItemIndex].quantity}`);
            // Only add up to the stock limit
            updatedItems[existingItemIndex].quantity = item.maxStock;
            finalQuantity = item.maxStock;
        } else {
            updatedItems[existingItemIndex].quantity = newQuantity;
            finalQuantity = newQuantity;
        }
    } else {
        // Add new item
        updatedItems = [...currentItems, {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            quantity: quantityToAdd,
            maxStock: item.maxStock // Store max stock for validation
        }];
        finalQuantity = quantityToAdd;
    }

    // Create or update reservation via API (optional - gracefully degrades if backend not ready)
    try {
        const response = await fetch('/api/reserve-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: current.sessionId,
                productId: parseInt(item.id),
                quantity: finalQuantity
            })
        });

        if (response.ok) {
            const result = await response.json();

            // Set expiration time from server response or calculate it
            const expiresAt = result.expires_at
                ? new Date(result.expires_at).getTime()
                : Date.now() + CART_EXPIRATION_TIME;

            cartStore.set({
                ...current,
                items: updatedItems,
                expiresAt: current.expiresAt || expiresAt // Keep earliest expiration
            });
        } else {
            // Backend not ready, use local-only mode
            console.warn('Reservation system not available, using local cart only');
            const expiresAt = Date.now() + CART_EXPIRATION_TIME;
            cartStore.set({
                ...current,
                items: updatedItems,
                expiresAt: current.expiresAt || expiresAt
            });
        }

        // Open cart for feedback
        openCart();
    } catch (error) {
        console.warn('Reservation API not available, using local cart:', error);
        // Still add to cart locally with local expiration
        const expiresAt = Date.now() + CART_EXPIRATION_TIME;
        cartStore.set({
            ...current,
            items: updatedItems,
            expiresAt: current.expiresAt || expiresAt
        });
        openCart();
    }
}

export async function removeFromCart(itemId: string, size?: string) {
    const current = cartStore.get();
    const currentItems = current.items;
    const updatedItems = currentItems.filter(
        (i) => i.id !== itemId || (size && i.size !== size)
    );

    // Remove reservation from backend
    try {
        await fetch('/api/reserve-stock', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: current.sessionId,
                productId: parseInt(itemId)
            })
        });
    } catch (error) {
        console.error('Error removing reservation:', error);
    }

    cartStore.set({ ...current, items: updatedItems });
}

export function updateQuantity(itemId: string, quantity: number, size?: string) {
    const current = cartStore.get();
    const currentItems = current.items;
    if (quantity <= 0) {
        removeFromCart(itemId, size);
        return;
    }

    const updatedItems = currentItems.map((i) => {
        if (i.id === itemId && i.size === size) {
            // Validate against maxStock if available
            if (i.maxStock !== undefined && quantity > i.maxStock) {
                console.warn(`Cannot set quantity to ${quantity}. Max stock is ${i.maxStock}`);
                return { ...i, quantity: i.maxStock }; // Cap at max stock
            }
            return { ...i, quantity };
        }
        return i;
    });
    cartStore.set({ ...current, items: updatedItems });
}

// Computed helper (can be used directly in components)
export function getCartTotal() {
    return cartStore.get().items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export async function clearCart() {
    const current = cartStore.get();

    // Clear all reservations from backend
    try {
        const response = await fetch('/api/clear-reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: current.sessionId })
        });
    } catch (error) {
        console.error('Error clearing reservations:', error);
    }

    cartStore.set({
        ...current,
        items: [],
        isCartOpen: false,
        expiresAt: null
    });
}

// Helper to check if cart has expired
export function isCartExpired(): boolean {
    const current = cartStore.get();
    if (!current.expiresAt) return false;
    return Date.now() > current.expiresAt;
}

// Helper to get remaining time in milliseconds
export function getRemainingTime(): number {
    const current = cartStore.get();
    if (!current.expiresAt) return 0;
    return Math.max(0, current.expiresAt - Date.now());
}

// Check and clear expired cart
export async function checkAndClearExpiredCart() {
    if (isCartExpired()) {
        await clearCart();
        return true;
    }
    return false;
}
