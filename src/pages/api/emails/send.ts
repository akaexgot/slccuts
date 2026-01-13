import type { APIRoute } from 'astro';
import { resend } from '../../../lib/resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { to, subject, html, text } = await request.json();

        if (!to || !subject || (!html && !text)) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data, error } = await resend.emails.send({
            from: 'SLC CUTS <onboarding@resend.dev>',
            replyTo: 'no-reply@resend.dev', // Changed from replyToken
            to: [to],
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback if no text provided
        });

        if (error) {
            console.error('Resend error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, data }), {
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
