import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `categories/${timestamp}-${randomString}.${extension}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage (using the existing 'products' bucket but 'categories/' prefix)
        // or a 'categories' bucket if preferred. Let's stick to 'products' for now to reuse bucket settings.
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return new Response(JSON.stringify({ error: uploadError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        return new Response(JSON.stringify({
            success: true,
            url: publicUrl
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
