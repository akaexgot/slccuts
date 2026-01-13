import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { orderShippedTemplate, orderShippedText } from '../../../lib/email-templates';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Update status in database
        const { data: order, error: updateError } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select('*, order_items(*, product:products(*))')
            .single();

        if (updateError) {
            console.error('Error updating order status:', updateError);
            return new Response(JSON.stringify({ error: 'Error al actualizar el estado' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. If status is "shipped", send email
        if (status === 'shipped' && order) {
            const contact = order.contact_info || {};
            const email = contact.email || order.guest_email;

            if (email) {
                try {
                    const protocol = new URL(request.url).protocol;
                    const host = new URL(request.url).host;
                    const baseUrl = `${protocol}//${host}`;

                    await fetch(`${baseUrl}/api/emails/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: `Tu pedido #${order.id.slice(0, 8).toUpperCase()} está en camino - SLC CUTS`,
                            html: orderShippedTemplate(order),
                            text: orderShippedText(order),
                        }),
                    });
                } catch (emailError) {
                    console.error('Error triggering shipping email:', emailError);
                    // We don't return 500 here because the status update WAS successful
                }
            }
        }

        return new Response(JSON.stringify({ success: true, order }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Server error in update-status:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
