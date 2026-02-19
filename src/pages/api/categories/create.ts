import type { APIRoute } from 'astro';
import { getSupabasePageClient } from '../../../lib/supabase';
import { verifyAdminSession, unauthorizedResponse } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    // Verify admin session
    const session = await verifyAdminSession(context);
    if (!session) {
        return unauthorizedResponse();
    }

    const supabase = await getSupabasePageClient(context.cookies);

    try {
        const data = await context.request.json();
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
