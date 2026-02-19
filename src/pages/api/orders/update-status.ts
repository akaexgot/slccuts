import type { APIRoute } from 'astro';
import { getSupabasePageClient } from '../../../lib/supabase';
import { verifyAdminSession, unauthorizedResponse } from '../../../lib/auth';
import {
    orderShippedTemplate,
    orderShippedText,
    orderCompletedTemplate,
    orderCompletedText,
    orderReadyForPickupTemplate,
    orderReadyForPickupText,
    orderCancelledTemplate,
    orderCancelledText,
    getTransactionalEmailHtml
} from '../../../lib/email-templates';
import { resend } from '../../../lib/resend';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    // Verify admin session
    const session = await verifyAdminSession(context);
    if (!session) {
        return unauthorizedResponse();
    }

    const supabase = await getSupabasePageClient(context.cookies);

    try {
        const { orderId, status } = await context.request.json();

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
        // 2. Send email notification based on status
        if (order) {
            const contact = order.contact_info || {};
            const email = contact.email || order.guest_email;

            if (email) {
                let subject = '';
                let htmlContent = '';
                let textContent = '';
                let shouldSend = false;

                switch (status) {
                    case 'shipped':
                        subject = `Tu pedido #${order.id.slice(0, 8).toUpperCase()} está en camino - SLC CUTS`;
                        htmlContent = orderShippedTemplate(order);
                        textContent = orderShippedText(order);
                        shouldSend = true;
                        break;
                    case 'completed':
                        if (order.shipping_method === 'pickup') {
                            subject = `¡Tu pedido #${order.id.slice(0, 8).toUpperCase()} está listo! - SLC CUTS`;
                            htmlContent = orderReadyForPickupTemplate(order);
                            textContent = orderReadyForPickupText(order);
                        } else {
                            subject = `¡Pedido #${order.id.slice(0, 8).toUpperCase()} Entregado! - SLC CUTS`;
                            htmlContent = orderCompletedTemplate(order);
                            textContent = orderCompletedText(order);
                        }
                        shouldSend = true;
                        break;
                    case 'cancelled':
                        subject = `Pedido #${order.id.slice(0, 8).toUpperCase()} Cancelado - SLC CUTS`;
                        htmlContent = orderCancelledTemplate(order);
                        textContent = orderCancelledText(order);
                        shouldSend = true;
                        break;
                }

                if (shouldSend) {
                    try {
                        const finalHtml = getTransactionalEmailHtml({
                            title: subject,
                            contentHtml: htmlContent,
                        });

                        await resend.emails.send({
                            from: 'SLC CUTS <no-reply@slccuts.es>',
                            replyTo: 'soporte@slccuts.es',
                            to: [email],
                            subject: subject,
                            html: finalHtml,
                            text: textContent,
                        });
                    } catch (emailError) {
                        console.error(`Error sending ${status} email:`, emailError);
                    }
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
