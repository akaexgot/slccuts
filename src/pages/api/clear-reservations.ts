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
        const { sessionId } = JSON.parse(body);

        if (!sessionId) {
            return new Response(
                JSON.stringify({ error: "Session ID is required" }),
                { status: 400 }
            );
        }

        const { error } = await supabase.rpc("clear_session_reservations", {
            p_session_id: sessionId,
        });

        if (error) {
            console.error("Error clearing reservations:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in clear-reservations:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
};
