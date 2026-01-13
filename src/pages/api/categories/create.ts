import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { name, slug, image_url } = data;

        if (!name || !slug) {
            return new Response(JSON.stringify({ error: 'Name and slug are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data: newCategory, error } = await supabase
            .from('categories')
            .insert({
                name,
                slug,
                image_url
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            category: newCategory
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
