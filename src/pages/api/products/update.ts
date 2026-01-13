import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();

        // Extract ID and update fields
        const {
            id,
            name,
            slug,
            description,
            price,
            category_id,
            active,
            is_offer,
            image_url, // Optional: if image changed
            stock
        } = data;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update product details
        const { error: updateError } = await supabase
            .from('products')
            .update({
                name,
                slug,
                description,
                price,
                category_id: category_id || null,
                is_offer: is_offer,
                active: active
            })
            .eq('id', id);

        if (updateError) {
            console.error('Update product error:', updateError);
            return new Response(JSON.stringify({ error: updateError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update image if provided
        if (image_url) {
            // Check if there's an existing image record
            const { data: existingImages } = await supabase
                .from('product_images')
                .select('id')
                .eq('product_id', id)
                .limit(1);

            if (existingImages && existingImages.length > 0) {
                // Update existing
                await supabase
                    .from('product_images')
                    .update({ image_url: image_url })
                    .eq('id', existingImages[0].id);
            } else {
                // Insert new
                await supabase
                    .from('product_images')
                    .insert({ product_id: id, image_url: image_url });
            }
        }

        // Update stock
        if (stock !== undefined) {
            await supabase
                .from('stock')
                .upsert({ product_id: id, quantity: parseInt(stock), updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
        }

        return new Response(JSON.stringify({ success: true }), {
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
