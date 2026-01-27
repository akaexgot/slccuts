import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { resend } from '../../../lib/resend';
import { getTransactionalEmailHtml } from '../../../lib/email-templates';

export const post: APIRoute = async ({ request }) => {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400 });
        }

        // 1. Save to database
        const { error: dbError } = await supabase
            .from('newsletter_subscribers')
            .insert([{ email }]);

        if (dbError) {
            if (dbError.code === '23505') { // Unique violation
                return new Response(JSON.stringify({ error: 'Ya estás registrado en nuestra newsletter' }), { status: 400 });
            }
            throw dbError;
        }

        // 2. Send welcome email with discount code
        const discountCode = 'WELCOME10';
        const emailContent = `
            <div style="text-align: center;">
                <h2 style="margin: 0 0 20px; font-weight: 900; text-transform: uppercase; font-style: italic; color: #000;">¡Bienvenido a la Familia SLC!</h2>
                <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
                    Gracias por suscribirte a nuestra newsletter. Como prometimos, aquí tienes tu código de descuento exclusivo del 10% para tu primer pedido.
                </p>
                <div style="background: #000; color: #fff; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 5px; opacity: 0.6;">Tu Código</span>
                    <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px;">${discountCode}</span>
                </div>
                <p style="font-size: 14px; color: #999;">
                    Aplica este código al finalizar tu compra para disfrutar del descuento.
                </p>
            </div>
        `;

        await resend.emails.send({
            from: 'SLC CUTS <onboarding@resend.dev>', // Should use verified domain in production
            to: email,
            subject: '¡Bienvenido! Tu regalo de 10% descuento está aquí',
            html: getTransactionalEmailHtml({
                title: 'Bienvenido - SLC CUTS',
                contentHtml: emailContent,
                ctaLink: 'https://slccuts.com/shop',
                ctaText: 'IR A LA TIENDA'
            }),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error('Newsletter Error:', error);
        return new Response(JSON.stringify({ error: 'Error del servidor. Por favor, inténtelo de nuevo más tarde.' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
