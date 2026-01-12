import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server-side admin authentication check
 * Use this in server components or API routes to verify admin access
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check if the current user is an admin
 * @returns {Promise<{isAdmin: boolean, user: object|null, error: string|null}>}
 */
export async function checkAdminAuth() {
    try {
        // Get cookies for session
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('sb-access-token')?.value;
        const refreshToken = cookieStore.get('sb-refresh-token')?.value;

        if (!accessToken) {
            return {
                isAdmin: false,
                user: null,
                error: 'No session found'
            };
        }

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Verify the token and get user
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            return {
                isAdmin: false,
                user: null,
                error: 'Invalid session'
            };
        }

        // Check if user has admin role in user_metadata
        const isAdmin = user.user_metadata?.role === 'admin';

        return {
            isAdmin,
            user: {
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || 'user',
                firstName: user.user_metadata?.first_name,
                lastName: user.user_metadata?.last_name,
            },
            error: isAdmin ? null : 'Access denied: Admin role required'
        };

    } catch (error) {
        console.error('Admin auth check error:', error);
        return {
            isAdmin: false,
            user: null,
            error: 'Authentication error'
        };
    }
}

/**
 * Middleware-style function for API routes
 * Returns 403 if not admin
 */
export async function requireAdmin() {
    const { isAdmin, user, error } = await checkAdminAuth();

    if (!isAdmin) {
        return {
            authorized: false,
            response: new Response(JSON.stringify({ error: error || 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    return {
        authorized: true,
        user
    };
}

/**
 * Set admin role for a user (use in Supabase functions or admin panel)
 * This should only be called by existing admins
 */
export async function setUserRole(userId, role = 'admin') {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
    });

    if (error) {
        console.error('Error setting user role:', error);
        return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
}

/**
 * Get all admin users (for admin management page)
 */
export async function getAdminUsers() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message, users: [] };
    }

    // Filter to only admins
    const admins = users.filter(user => user.user_metadata?.role === 'admin');

    return {
        success: true,
        users: admins.map(u => ({
            id: u.id,
            email: u.email,
            role: u.user_metadata?.role,
            firstName: u.user_metadata?.first_name,
            lastName: u.user_metadata?.last_name,
            createdAt: u.created_at,
        }))
    };
}
