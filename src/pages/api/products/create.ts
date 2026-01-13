import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();

        const { name, slug, description, price, category_id, active, is_offer, stock } = data;

        if (!name || !slug || price === undefined) {
            return new Response(JSON.stringify({ error: 'Name, slug and price are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert product
        const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                description,
                price,
                category_id: category_id || null,
                is_offer: is_offer || false,
                active: active !== false
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return new Response(JSON.stringify({ error: insertError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create/Update stock entry
        if (newProduct) {
            await supabase.from('stock').upsert({
                product_id: newProduct.id,
                quantity: stock !== undefined ? parseInt(stock) : 0
            });
        }

        return new Response(JSON.stringify({
            success: true,
            product: newProduct
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
