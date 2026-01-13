import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { uploadToCloudinary } from '../../../lib/cloudinary';

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


        const description = formData.get('description') as string || '';
        const altText = formData.get('alt_text') as string || description || 'Galería SLC CUTS';

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Cloudinary
        const cloudinaryResult: any = await uploadToCloudinary(buffer, 'gallery');
        const publicUrl = cloudinaryResult.secure_url;

        // Save to database
        const { error: dbError } = await supabase
            .from('gallery_images')
            .insert({
                image_url: publicUrl,
                active: true,
                description: description,
                alt_text: altText
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return new Response(JSON.stringify({ error: dbError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
