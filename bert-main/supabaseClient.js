import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('Please check your .env file has:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with enhanced options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-application-name': 'PrepCast-AI'
        }
    }
});

// Connection test function
export const testSupabaseConnection = async () => {
    try {
        console.log('🔄 Testing Supabase connection...');
        console.log('📍 URL:', supabaseUrl);

        // Test database connection
        const { data, error } = await supabase
            .from('processing_sessions')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }

        console.log('✅ Supabase connected successfully!');
        console.log('📊 Tables accessible');
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
};

// Log connection status on load
if (import.meta.env.DEV) {
    console.log('🔗 Supabase Client Initialized');
    console.log('📍 Project URL:', supabaseUrl);
    testSupabaseConnection();
}