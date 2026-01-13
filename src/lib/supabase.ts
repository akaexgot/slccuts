import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let client;

if (supabaseUrl && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️ Supabase credentials missing. Running in MOCK mode.');

    // Mock Data
    const MOCK_PRODUCTS = [
        {
            id: 1,
            name: "Nish Man Polvos Texturizantes",
            price: 1200, // in cents
            description: "Volumen y textura mate instantánea. Eleva tu peinado al siguiente nivel.",
            image_url: "https://images.unsplash.com/photo-1595347201732-c74b83416a2d?auto=format&fit=crop&q=80&w=800", // Generic Styling Powder Bottle
            category_id: 101, // Productos Capilares
            is_offer: false,
            active: true
        },
        {
            id: 2,
            name: "Nish Man Cera Spider",
            price: 1000,
            description: "Fijación fuerte con efecto telaraña. Acabado brillante y duradero.",
            image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800", // Generic Wax container
            category_id: 101,
            is_offer: false,
            active: true
        },
        {
            id: 3,
            name: "Nish Man Laca Ultra",
            price: 600,
            description: "Spray de fijación extrema para mantener tu estilo intacto todo el día.",
            image_url: "https://images.unsplash.com/photo-1624896791986-1f746d525492?auto=format&fit=crop&q=80&w=800", // Spray bottle
            category_id: 101,
            is_offer: true,
            active: true
        },
        {
            id: 4,
            name: "Nish Man Aceite para Barba",
            price: 1000,
            description: "Hidratación profunda y brillo para tu barba. Aroma premium.",
            image_url: "https://images.unsplash.com/photo-1626301389078-d58673a55546?auto=format&fit=crop&q=80&w=800", // Beard Oil bottle
            category_id: 102, // Barba
            is_offer: false,
            active: true
        },
        {
            id: 5,
            name: "Nish Man Fibras Capilares",
            price: 2500,
            description: "Densidad capilar inmediata. Cubre zonas despobladas con acabado natural.",
            image_url: "https://images.unsplash.com/photo-1599351431202-6e0005a7837f?auto=format&fit=crop&q=80&w=800", // Hair Fibers product
            category_id: 101,
            is_offer: false,
            active: true
        }
    ];

    // Mock Builder
    class MockBuilder {
        constructor(private table: string) { }

        select() { return this; }
        eq() { return this; }
        order() { return this; }
        limit() { return this; }
        update() { return this; }
        single() {
            // Very basic mock for single item
            if (this.table === 'products') return Promise.resolve({ data: MOCK_PRODUCTS[0], error: null });
            return Promise.resolve({ data: null, error: null });
        }
        insert() { return Promise.resolve({ data: { id: 'mock-id' }, error: null }); }

        then(resolve: any) {
            if (this.table === 'products') {
                resolve({ data: MOCK_PRODUCTS, error: null });
            } else {
                resolve({ data: [], error: null });
            }
        }
    }

    client = {
        from: (table: string) => new MockBuilder(table),
        storage: {
            from: () => ({
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        },
        auth: {
            signUp: async () => ({ data: {}, error: null }),
            signInWithPassword: async () => ({ data: {}, error: null }),
            signOut: async () => ({ error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        }
    } as any;
}

export const supabase = client;
