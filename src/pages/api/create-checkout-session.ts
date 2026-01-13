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

        const { items, orderId, customerEmail, shippingMethod } = JSON.parse(bodyText);

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

        const session = await stripe.checkout.sessions.create({
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
        });

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
