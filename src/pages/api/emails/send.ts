import type { APIRoute } from 'astro';
import { resend } from '../../../lib/resend';
import { getTransactionalEmailHtml } from '../../../lib/email-templates';
import { verifyAdminSession, unauthorizedResponse } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    // Verify admin session
    const session = await verifyAdminSession(context);
    if (!session) {
        return unauthorizedResponse();
    }

    try {
        const { to, subject, html, text, title, ctaLink, ctaText } = await context.request.json();

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
            from: 'SLC CUTS <no-reply@slccuts.es>',
            replyTo: 'soporte@slccuts.es',
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
