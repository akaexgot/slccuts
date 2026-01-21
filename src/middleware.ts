import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

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
