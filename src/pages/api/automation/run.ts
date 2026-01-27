
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { resend } from '../../../lib/resend';
import {
    getTransactionalEmailHtml,
    abandonedCartTemplate,
    abandonedCartText,
    feedbackRequestTemplate,
    feedbackRequestText
} from '../../../lib/email-templates';

export const prerender = false;

// CRITICAL: This endpoint should be called by a CRON JOB (every 1 hour)
// It manages the "Engagement" and "Feedback" automatically.
export const GET: APIRoute = async ({ request }) => {
    // Basic security: Check for a secret key in header or query
    const url = new URL(request.url);
    const cronSecret = url.searchParams.get('secret');

    // You should set this in your .env
    if (cronSecret !== 'SLC_CUTS_AUTOMATION_SECRET') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const results = {
        abandonedCarts: 0,
        feedbackRequests: 0,
        errors: [] as string[]
    };

    try {
        // --- 1. PROCESS ABANDONED CARTS (Cart updated > 24h ago, not sent yet) ---
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: abandonedUsers } = await supabase
            .from('users')
            .select('id, email, first_name, cart_items')
            .not('cart_items', 'is', null)
            .lt('last_cart_update', oneDayAgo)
            .eq('abandoned_cart_email_sent', false);

        if (abandonedUsers) {
            for (const user of abandonedUsers) {
                if (!user.cart_items || user.cart_items.length === 0) continue;

                const { error: mailError } = await resend.emails.send({
                    from: 'SLC CUTS <onboarding@resend.dev>', // Change to verified domain later
                    to: [user.email],
                    subject: '¿Te has olvidado algo? Tu carrito te espera 🛒',
                    html: getTransactionalEmailHtml({
                        title: `¡Hola ${user.first_name || 'Cliente'}!`,
                        contentHtml: abandonedCartTemplate(user.first_name || 'Cliente', user.cart_items as any[]),
                        ctaLink: 'https://slccuts.com/cart', // Use final domain
                        ctaText: 'VOLVER A MI CARRITO'
                    }),
                    text: abandonedCartText(user.first_name || 'Cliente')
                });

                if (!mailError) {
                    await supabase.from('users').update({ abandoned_cart_email_sent: true }).eq('id', user.id);
                    results.abandonedCarts++;
                } else {
                    results.errors.push(`Cart Error (${user.email}): ${mailError.message}`);
                }
            }
        }

        // --- 2. PROCESS FEEDBACK REQUESTS (Orders completed > 5 days ago, not sent yet) ---
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

        const { data: completedOrders } = await supabase
            .from('orders')
            .select('id, guest_email, contact_info, user_id')
            .eq('status', 'completed')
            .lt('created_at', fiveDaysAgo) // We use created_at or better a 'completed_at' if it existed
            .eq('feedback_email_sent', false);

        if (completedOrders) {
            for (const order of completedOrders) {
                const email = order.guest_email || order.contact_info?.email;
                if (!email) continue;

                const firstName = order.contact_info?.name?.split(' ')[0] || 'Cliente';

                const { error: mailError } = await resend.emails.send({
                    from: 'SLC CUTS <onboarding@resend.dev>',
                    to: [email],
                    subject: '¿Qué te ha parecido tu pedido en SLC CUTS? ⭐',
                    html: getTransactionalEmailHtml({
                        title: `¡Hola ${firstName}!`,
                        contentHtml: feedbackRequestTemplate(firstName),
                        ctaLink: 'https://slccuts.com/orders', // Link to their history or a review page
                        ctaText: 'DEJAR MI OPINIÓN'
                    }),
                    text: feedbackRequestText(firstName)
                });

                if (!mailError) {
                    await supabase.from('orders').update({ feedback_email_sent: true }).eq('id', order.id);
                    results.feedbackRequests++;
                } else {
                    results.errors.push(`Feedback Error (${order.id}): ${mailError.message}`);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, results }), { status: 200 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
