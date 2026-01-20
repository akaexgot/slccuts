import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { resend } from '../../../lib/resend';
import { baseTemplate } from '../../../lib/email-templates';

export const post: APIRoute = async ({ request }) => {
    try {
        const { subject, content } = await request.json();

        if (!subject || !content) {
            return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        // 1. Fetch all subscribers
        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email');

        if (error) throw error;
        if (!subscribers || subscribers.length === 0) {
            return new Response(JSON.stringify({ error: 'No hay suscriptores' }), { status: 400 });
        }

        // 2. Prepare HTML with base template
        const htmlContent = baseTemplate(content, subject);

        // 3. Send emails
        // For simple implementation, we send them to all subscribers.
        // Resend allows batch sending with certain limits. 
        // Here we'll send them to everyone in the BCC or individually depending on the count.

        const emails = subscribers.map(s => s.email);

        // Resend batch sending (if less than 100 for safety in this demo)
        await resend.emails.send({
            from: 'SLC CUTS <newsletter@resend.dev>', // Should be verified domain
            to: 'newsletter@slccuts.com', // Placeholder
            bcc: emails, // Send as BCC to protect privacy
            subject: subject,
            html: htmlContent,
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error('Campaign Error:', error);
        return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
    }
};
