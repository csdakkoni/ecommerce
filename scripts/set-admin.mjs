// One-time script to set admin role
// Run with: node scripts/set-admin.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jksdssbruzmfcuybupwr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const targetEmail = 'grohn@grohn.com.tr';

async function setAdminRole() {
    console.log(`🔍 Searching for user: ${targetEmail}`);

    // List all users and find by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Error listing users:', listError.message);
        process.exit(1);
    }

    const user = users.find(u => u.email === targetEmail);

    if (!user) {
        console.error(`❌ User not found: ${targetEmail}`);
        console.log('📝 Available users:');
        users.forEach(u => console.log(`   - ${u.email}`));
        process.exit(1);
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    console.log(`   Current metadata:`, user.user_metadata);

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...user.user_metadata,
            role: 'admin',
            first_name: user.user_metadata?.first_name || 'Admin',
            last_name: user.user_metadata?.last_name || 'User'
        }
    });

    if (error) {
        console.error('❌ Error updating user:', error.message);
        process.exit(1);
    }

    console.log(`🎉 SUCCESS! User ${targetEmail} is now an admin!`);
    console.log(`   New metadata:`, data.user.user_metadata);
}

setAdminRole();
