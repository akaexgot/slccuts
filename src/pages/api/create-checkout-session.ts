export const prerender = false;

import Stripe from "stripe";
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

const stripe = new Stripe(
    import.meta.env.STRIPE_SECRET_KEY,
);

interface CheckoutItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const bodyText = await request.text();

        if (!bodyText) {
            throw new Error("Request body is empty");
        }

        const { items, orderId, customerEmail, shippingMethod, promoCode } = JSON.parse(bodyText);

        if (!items || !orderId) {
            return new Response(JSON.stringify({ error: "Missing items or orderId" }), {
                status: 400,
            });
        }

        // --- SECURITY: Fetch REAL prices from Supabase ---
        const productIds = items
            .filter((item: CheckoutItem) => item.id && item.id !== 'shipping')
            .map((item: CheckoutItem) => item.id);

        const { data: dbProducts, error: dbError } = await supabase
            .from("products")
            .select(`
                id, 
                name, 
                price,
                product_images (
                    image_url
                )
            `)
            .in("id", productIds);

        if (dbError) {
            console.error('Supabase error validating products:', dbError);
            throw new Error("Error validating products in database");
        }

        if (!dbProducts || dbProducts.length === 0) {
            console.error('No products found in database for IDs:', productIds);
            throw new Error("Error validating products in database: No match");
        }

        const productMap = new Map((dbProducts as any[]).map(p => {
            // Get the first image if available
            const imageUrl = p.product_images?.[0]?.image_url;
            return [p.id.toString(), { ...p, image_url: imageUrl }];
        }));

        const validatedLineItems = items.map((item: CheckoutItem) => {
            if (item.id === 'shipping' || item.name === 'Envío') {
                // Validate shipping cost
                const expectedShipping = shippingMethod === 'delivery' ? 399 : 0;
                return {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "Envío a Domicilio",
                        },
                        unit_amount: expectedShipping,
                    },
                    quantity: 1,
                };
            }

            // Ensure item.id exists and is in the map
            const productId = item.id?.toString();
            const dbProduct = productId ? productMap.get(productId) : null;

            if (!dbProduct) {
                console.error(`Product ${item.id} not found or invalid`);
                throw new Error(`Product ${item.id} not found in database`);
            }

            return {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: dbProduct.name,
                        images: dbProduct.image_url ? [dbProduct.image_url] : [],
                    },
                    unit_amount: Math.round(dbProduct.price), // Price in cents from DB
                },
                quantity: item.quantity,
            };
        });

        // --- PROMO CODE VALIDATION ---
        let stripeCouponId: string | undefined = undefined;

        if (promoCode && typeof promoCode === 'string' && promoCode.trim() !== '') {
            const { data: promo, error: promoError } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', promoCode.toUpperCase())
                .eq('active', true)
                .single();

            if (!promoError && promo) {
                // Validate dates
                const now = new Date();
                const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
                const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

                const isDateValid =
                    (!validFrom || now >= validFrom) &&
                    (!validUntil || now <= validUntil);

                // Validate usage limit
                const isUsageLimitValid =
                    !promo.usage_limit ||
                    (promo.times_used || 0) < promo.usage_limit;

                if (isDateValid && isUsageLimitValid) {
                    // Create Stripe coupon on-the-fly
                    const couponParams: Stripe.CouponCreateParams =
                        promo.discount_type === 'percent'
                            ? { percent_off: promo.discount_value, duration: 'once' }
                            : { amount_off: Math.round(promo.discount_value), currency: 'eur', duration: 'once' };

                    try {
                        const stripeCoupon = await stripe.coupons.create(couponParams);
                        stripeCouponId = stripeCoupon.id;
                        console.log('Promo code applied:', promoCode, 'Coupon:', stripeCouponId);

                        // Increment usage counter
                        await supabase
                            .from('promo_codes')
                            .update({ times_used: (promo.times_used || 0) + 1 })
                            .eq('id', promo.id);
                    } catch (couponError) {
                        console.error('Error creating Stripe coupon:', couponError);
                        // Continue without discount if coupon creation fails
                    }
                } else {
                    console.warn('Promo code invalid or expired:', promoCode);
                }
            } else {
                console.warn('Promo code not found or inactive:', promoCode);
            }
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            line_items: validatedLineItems,
            mode: "payment",
            success_url: `${new URL(request.url).origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
            cancel_url: `${new URL(request.url).origin}/checkout`,
            customer_email: customerEmail,
            metadata: {
                orderId: orderId,
            },
            client_reference_id: orderId,
        };

        // Apply coupon if validated
        if (stripeCouponId) {
            sessionParams.discounts = [{ coupon: stripeCouponId }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Stripe Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
};
