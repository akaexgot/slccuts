import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;  // Enable server-side rendering

export const POST: APIRoute = async ({ request }) => {
    console.log('[Newsletter API] ========== START ==========');

    try {
        const body = await request.json();
        console.log('[Newsletter API] Request body:', JSON.stringify(body));

        const { email } = body;
        console.log('[Newsletter API] Email extracted:', email);

        // Validate email
        if (!email || !email.includes('@')) {
            console.log('[Newsletter API] ❌ Invalid email format');
            return new Response(
                JSON.stringify({ error: 'Email inválido' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Check if already exists
        console.log('[Newsletter API] Checking if email exists in database...');
        const { data: existing, error: selectError } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        console.log('[Newsletter API] Select result:', { existing, selectError });

        if (selectError) {
            console.error('[Newsletter API] ❌ Error checking existing email:', selectError);
            return new Response(
                JSON.stringify({ error: 'Error al verificar email' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        if (existing) {
            console.log('[Newsletter API] ℹ️ Email already subscribed');
            return new Response(
                JSON.stringify({ error: 'Ya estás registrado en nuestra newsletter' }),
                {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Insert new subscriber
        console.log('[Newsletter API] Inserting new subscriber...');
        const { data: insertData, error: insertError } = await supabase
            .from('newsletter_subscribers')
            .insert({ email });

        console.log('[Newsletter API] Insert result:', { insertData, insertError });

        if (insertError) {
            console.error('[Newsletter API] ❌ Insert error:', insertError);
            return new Response(
                JSON.stringify({ error: 'Error al guardar suscripción: ' + insertError.message }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('[Newsletter API] ✅ Subscription successful');

        // Send welcome email with discount code
        console.log('[Newsletter API] Sending welcome email...');
        try {
            const { resend } = await import('../../../lib/resend');
            const { getTransactionalEmailHtml } = await import('../../../lib/email-templates');

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
                from: 'SLC CUTS <no-reply@slccuts.es>',
                to: email,
                subject: '¡Bienvenido! Tu regalo de 10% descuento está aquí',
                html: getTransactionalEmailHtml({
                    title: 'Bienvenido - SLC CUTS',
                    contentHtml: emailContent,
                    ctaLink: 'https://slccuts.es/shop',
                    ctaText: 'IR A LA TIENDA'
                }),
            });
            console.log('[Newsletter API] ✅ Email sent successfully');
        } catch (emailError: any) {
            console.error('[Newsletter API] ⚠️ Email error (non-critical):', emailError.message);
            // Don't fail the request if email fails, user is still subscribed
        }

        console.log('[Newsletter API] ========== END ==========');

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('[Newsletter API] ❌ EXCEPTION:', error);
        console.error('[Newsletter API] Error stack:', error.stack);
        return new Response(
            JSON.stringify({ error: 'Error del servidor: ' + error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
