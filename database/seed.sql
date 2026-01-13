-- =====================================================
-- SLC CUTS - INITIAL SEED DATA
-- Default categories and starter products
-- =====================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, image_url) VALUES 
(101, 'Productos Capilares', 'productos-capilares', 'https://images.unsplash.com/photo-1512690199101-85a4dee2b46e?auto=format&fit=crop&q=80&w=800'),
(102, 'Barba', 'barba', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800'),
(103, 'Accesorios', 'accesorios', 'https://images.unsplash.com/photo-1593702295094-1fa89b3f990a?auto=format&fit=crop&q=80&w=800')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PRODUCTS
-- Prices in cents (e.g., 1200 = 12.00€)
INSERT INTO public.products (id, name, slug, description, price, category_id, is_featured, active) VALUES
(1, 'Nish Man Polvos Texturizantes', 'nish-man-polvos', 'Volumen y textura mate instantánea. Eleva tu peinado al siguiente nivel.', 1200, 101, true, true),
(2, 'Nish Man Cera Spider', 'nish-man-cera-spider', 'Fijación fuerte con efecto telaraña. Acabado brillante y duradero.', 1000, 101, true, true),
(3, 'Nish Man Laca Ultra', 'nish-man-laca', 'Spray de fijación extrema para mantener tu estilo intacto todo el día.', 600, 101, false, true),
(4, 'Nish Man Aceite para Barba', 'nish-man-aceite-barba', 'Hidratación profunda y brillo para tu barba. Aroma premium.', 1000, 102, true, true),
(5, 'Nish Man Fibras Capilares', 'nish-man-fibras', 'Densidad capilar inmediata. Cubre zonas despobladas con acabado natural.', 2500, 101, false, true)
ON CONFLICT (id) DO NOTHING;

-- Sync the ID sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 3. SEED PRODUCT IMAGES
INSERT INTO public.product_images (product_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1595347201732-c74b83416a2d?auto=format&fit=crop&q=80&w=800'),
(2, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800'),
(3, 'https://images.unsplash.com/photo-1624896791986-1f746d525492?auto=format&fit=crop&q=80&w=800'),
(4, 'https://images.unsplash.com/photo-1626301389078-d58673a55546?auto=format&fit=crop&q=80&w=800'),
(5, 'https://images.unsplash.com/photo-1599351431202-6e0005a7837f?auto=format&fit=crop&q=80&w=800')
ON CONFLICT DO NOTHING;

-- 4. SEED INITIAL STOCK
-- (Trigger will auto-create entries as well, but we seed initial quantities)
INSERT INTO public.stock (product_id, quantity) VALUES
(1, 50), (2, 50), (3, 50), (4, 50), (5, 50)
ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity;
