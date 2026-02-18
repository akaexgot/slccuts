import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

const ALLOWED_ORIGINS = [
    "https://slccuts.es",
    "https://www.slccuts.es",
    "http://localhost:4321",
    "http://localhost:3000",
];

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;
    const origin = context.request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    // --- CORS Configuration for API Routes ---
    if (pathname.startsWith("/api/")) {
        if (context.request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": allowedOrigin,
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                },
            });
        }

        const response = await next();
        response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        return response;
    }

    // Check maintenance mode setting
    const { data: maintenanceSetting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

    const isMaintenanceMode = maintenanceSetting?.value ?? false;

    // --- ADMIN ROUTE PROTECTION (ALWAYS ACTIVE) ---
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        try {
            const accessToken = context.cookies.get("sb-access-token")?.value;
            const refreshToken = context.cookies.get("sb-refresh-token")?.value;

            if (!accessToken || !refreshToken) {
                return context.redirect("/login");
            }

            // Use the helper to get an authenticated client (respecting RLS)
            const { getSupabasePageClient } = await import("./lib/supabase");
            const supabase = await getSupabasePageClient(context.cookies);

            // Verify user is logged in
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                return context.redirect("/login");
            }

            // Check role
            const { data: profile } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin") {
                return context.redirect("/"); // Or unauthorized page
            }

            // If protected and authorized, allow access
            return next();

        } catch (error) {
            console.error("Auth middleware error:", error);
            return context.redirect("/login");
        }
    }

    // --- MAINTENANCE MODE CHECK ---
    if (isMaintenanceMode) {
        const adminRoutes = ["/admin", "/login", "/api", "/reset-password", "/forgot-password"];
        const publicAssets = ["/fonts", "/logo", "/logoblanco", "/_astro", "/favicon"];
        const maintenancePage = "/maintenance";

        const isAllowedRoute = adminRoutes.some((route) => pathname.startsWith(route));
        const isAsset = publicAssets.some((asset) => pathname.includes(asset));
        const isMaintenancePage = pathname === maintenancePage;

        if (isAllowedRoute || isAsset || isMaintenancePage) {
            return next();
        }

        return context.redirect(maintenancePage);
    } else {
        if (pathname === "/maintenance") {
            return context.redirect("/");
        }
        return next();
    }
});
