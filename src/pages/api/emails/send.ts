import type { APIRoute } from 'astro';
import { resend } from '../../../lib/resend';
import { getTransactionalEmailHtml } from '../../../lib/email-templates';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { to, subject, html, text, title, ctaLink, ctaText } = await request.json();

        if (!to || !subject || (!html && !text)) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate professional HTML template
        const finalHtml = getTransactionalEmailHtml({
            title: title || subject, // Use title or fallback to subject
            contentHtml: html || text, // Use HTML provided or fallback to text
            ctaLink,
            ctaText
        });

        const { data, error } = await resend.emails.send({
            // IMPORTANT: User must verify their domain in Resend for this to work without 'onboarding'
            // Once verified, change to: 'SLC CUTS <info@slccuts.com>'
            from: 'SLC CUTS <onboarding@resend.dev>',
            replyTo: 'slccuts1998@gmail.com',
            to: [to],
            subject: subject,
            html: finalHtml,
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
