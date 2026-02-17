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

    // Define routes that should be accessible during maintenance
    const adminRoutes = ["/admin", "/login", "/api", "/reset-password", "/forgot-password"];
    const publicAssets = ["/fonts", "/logo", "/logoblanco", "/_astro", "/favicon"];
    const maintenancePage = "/maintenance";

    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    const isAsset = publicAssets.some((asset) => pathname.includes(asset));
    const isMaintenancePage = pathname === maintenancePage;

    if (isMaintenanceMode) {
        // Always allow admin routes, assets, and maintenance page
        if (isAdminRoute || isAsset || isMaintenancePage) {
            return next();
        }

        // Check if user is logged in and has admin role
        try {
            // Get session from cookie
            const accessToken = context.cookies.get("sb-access-token")?.value;
            const refreshToken = context.cookies.get("sb-refresh-token")?.value;

            if (accessToken && refreshToken) {
                // Set session
                const { data: { user } } = await supabase.auth.getUser(accessToken);

                if (user) {
                    // Check if user has admin role
                    const { data: profile } = await supabase
                        .from("users")
                        .select("role")
                        .eq("id", user.id)
                        .single();

                    // If user is admin, allow full access
                    if (profile?.role === "admin") {
                        return next();
                    }
                }
            }
        } catch (error) {
            // If there's an error checking auth, continue with maintenance redirect
            console.error("Error checking user session:", error);
        }

        // Redirect all other routes to maintenance
        return context.redirect(maintenancePage);
    } else {
        // If not in maintenance mode, redirect maintenance page to home
        if (isMaintenancePage) {
            return context.redirect("/");
        }
        return next();
    }
});
