import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { path } = await request.json();

        if (!path) {
            return new Response(JSON.stringify({ error: 'Path required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert visit record
        const { error } = await supabase
            .from('page_visits')
            .insert({ page_path: path });

        if (error) {
            // Silently log and return 200 to avoid breaking the frontend
            // especially if the table hasn't been created yet.
            console.warn('Track error (ignoring):', error.message);
            return new Response(JSON.stringify({ success: false, warning: 'Table might be missing' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
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
