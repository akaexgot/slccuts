import type { APIRoute } from 'astro';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { verifyAdminSession, unauthorizedResponse } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    // Verify admin session
    const session = await verifyAdminSession(context);
    if (!session) {
        return unauthorizedResponse();
    }

    try {
        const formData = await context.request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convert file to buffer for Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Cloudinary (using 'news' folder)
        const cloudinaryResult: any = await uploadToCloudinary(buffer, 'news');
        const publicUrl = cloudinaryResult.secure_url;

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
