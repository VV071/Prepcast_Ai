/**
 * ============================================
 * SESSION MANAGEMENT - CONNECTION TEST
 * ============================================
 * Test file to verify Supabase connection
 */

import {
    createSession,
    getSessions,
    getUserProfile
} from './session-management/index.js';

/**
 * Test the session management connection
 */
export const testSessionManagement = async (userId) => {
    console.log('🔄 Testing Session Management Connection...');

    try {
        // Test 1: Get Sessions
        console.log('📋 Test 1: Fetching sessions...');
        const sessions = await getSessions(userId);
        console.log('✅ Sessions fetched:', sessions.length, 'sessions found');

        // Test 2: Get User Profile
        console.log('👤 Test 2: Fetching user profile...');
        const profile = await getUserProfile(userId);
        console.log('✅ Profile fetched:', profile?.full_name || 'No name');

        // Test 3: Create Session (optional - uncomment to test)
        // console.log('➕ Test 3: Creating test session...');
        // const newSession = await createSession(
        //     userId,
        //     'Test Session',
        //     'survey',
        //     'Connection test session',
        //     { tags: ['test'], isPublic: false }
        // );
        // console.log('✅ Session created:', newSession.session_name);

        console.log('✅ All tests passed! Session management is connected to Supabase.');
        return true;

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Error details:', error);
        return false;
    }
};

/**
 * Quick connection check
 */
export const checkConnection = async () => {
    try {
        const { supabase } = await import('./supabaseClient.js');
        const { data, error } = await supabase.from('processing_sessions').select('count');

        if (error) throw error;

        console.log('✅ Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
};

// Usage example:
// import { testSessionManagement, checkConnection } from './testConnection.js';
//
// // Quick check
// await checkConnection();
//
// // Full test with user ID
// await testSessionManagement('your-user-id-here');
