import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, redirect } = context;

    // Only protect /admin routes
    if (url.pathname.startsWith("/admin")) {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return redirect("/login");
        }

        const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (!profile || profile.role.toLowerCase().trim() !== "admin") {
            return redirect("/");
        }
    }

    return next();
});
