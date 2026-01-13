import { map } from 'nanostores';

export interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    category?: {
        name: string;
        slug: string;
    };
    is_offer?: boolean;
    stock?: Array<{ quantity: number }> | { quantity: number };
}

export interface ModalState {
    isOpen: boolean;
    product: Product | null;
}

export const modalStore = map<ModalState>({
    isOpen: false,
    product: null
});

export function openModal(product: Product) {
    modalStore.set({ isOpen: true, product });
}

export function closeModal() {
    modalStore.set({ isOpen: false, product: null });
}
