import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const productId = url.searchParams.get("productId");

        if (!productId) {
            return new Response(
                JSON.stringify({ error: "Product ID is required" }),
                { status: 400 }
            );
        }

        const { data, error } = await supabase.rpc("get_available_stock", {
            p_product_id: parseInt(productId),
        });

        if (error) {
            console.error("Error getting available stock:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify({ availableStock: data }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in available-stock:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
};
