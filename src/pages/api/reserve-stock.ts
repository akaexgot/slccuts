import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.text();
        if (!body) {
            return new Response(
                JSON.stringify({ error: "Empty request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const { sessionId, productId, quantity } = JSON.parse(body);

        if (!sessionId || !productId || !quantity) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        // Call the upsert function
        const { data, error } = await supabase.rpc("upsert_cart_reservation", {
            p_session_id: sessionId,
            p_product_id: productId,
            p_quantity: quantity,
        });

        if (error) {
            console.error("Error creating reservation:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in reserve-stock:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
};

export const DELETE: APIRoute = async ({ request }) => {
    try {
        const body = await request.text();
        if (!body) {
            return new Response(
                JSON.stringify({ error: "Empty request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const { sessionId, productId } = JSON.parse(body);

        if (!sessionId || !productId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        const { error } = await supabase.rpc("remove_cart_reservation", {
            p_session_id: sessionId,
            p_product_id: productId,
        });

        if (error) {
            console.error("Error removing reservation:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in reserve-stock DELETE:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
};
