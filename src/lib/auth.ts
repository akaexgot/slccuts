import { supabase } from './supabase';
import type { APIContext } from 'astro';

/**
 * Verifies if the current user is an admin
 * Returns the user session if admin, null otherwise
 */
export async function verifyAdminSession(context: APIContext) {
    // Get session from cookies
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;

    if (!accessToken) {
        return null;
    }

    // Verify session with Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return null;
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile || profile.role?.toLowerCase().trim() !== 'admin') {
        return null;
    }

    return session;
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = 'No autorizado. Se requieren permisos de administrador.') {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
