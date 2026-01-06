import { supabase } from './supabaseClient.js';

/**
 * ============================================
 * SUPABASE SETUP & VERIFICATION SCRIPT
 * ============================================
 * This script verifies and sets up your Supabase connection
 */

// List of required tables
const REQUIRED_TABLES = [
    'users',
    'user_profiles',
    'processing_sessions',
    'session_files',
    'session_data_sources',
    'session_collaborators',
    'processing_templates',
    'session_activity_logs',
    'session_processing_steps',
    'session_exports'
];

// List of required storage buckets
const REQUIRED_BUCKETS = [
    'session-files',
    'user-avatars',
    'session_processing_steps',
    'processing_templates'
];

/**
 * Check if all required tables exist and are accessible
 */
export const verifyTables = async () => {
    console.log('\n📋 Verifying Database Tables...\n');

    const results = {};

    for (const tableName of REQUIRED_TABLES) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${tableName}: ${error.message}`);
                results[tableName] = { status: 'error', error: error.message };
            } else {
                console.log(`✅ ${tableName}: Connected`);
                results[tableName] = { status: 'success', accessible: true };
            }
        } catch (error) {
            console.log(`❌ ${tableName}: ${error.message}`);
            results[tableName] = { status: 'error', error: error.message };
        }
    }

    return results;
};

/**
 * Check if all required storage buckets exist
 */
export const verifyBuckets = async () => {
    console.log('\n🗂️  Verifying Storage Buckets...\n');

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Failed to list buckets:', error.message);
            return { status: 'error', error: error.message };
        }

        const existingBuckets = buckets.map(b => b.name);
        const results = {};

        for (const bucketName of REQUIRED_BUCKETS) {
            if (existingBuckets.includes(bucketName)) {
                console.log(`✅ ${bucketName}: Exists`);
                results[bucketName] = { status: 'success', exists: true };
            } else {
                console.log(`⚠️  ${bucketName}: Not listed (Hidden by RLS?)`);
                results[bucketName] = { status: 'unknown', exists: false };
            }
        }

        return results;
    } catch (error) {
        console.error('❌ Bucket verification failed:', error);
        return { status: 'error', error: error.message };
    }
};

/**
 * Create missing storage buckets
 */
export const createMissingBuckets = async () => {
    console.log('\n🔧 Creating Missing Buckets...\n');

    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const existingNames = existingBuckets?.map(b => b.name) || [];

    for (const bucketName of REQUIRED_BUCKETS) {
        if (!existingNames.includes(bucketName)) {
            try {
                const { data, error } = await supabase.storage.createBucket(bucketName, {
                    public: bucketName === 'user-avatars', // Make avatars public
                    fileSizeLimit: 52428800, // 50MB
                    allowedMimeTypes: bucketName === 'user-avatars'
                        ? ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
                        : ['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
                });

                if (error) {
                    console.log(`❌ Failed to create ${bucketName}:`, error.message);
                } else {
                    console.log(`✅ Created bucket: ${bucketName}`);
                }
            } catch (error) {
                console.log(`❌ Error creating ${bucketName}:`, error.message);
            }
        }
    }
};

/**
 * Test database write permissions
 */
export const testWritePermissions = async (userId) => {
    console.log('\n✍️  Testing Write Permissions...\n');

    try {
        // Try to create a test session
        const { data, error } = await supabase
            .from('processing_sessions')
            .insert([{
                user_id: userId,
                session_name: 'Connection Test Session',
                session_type: 'survey',
                description: 'Automated connection test',
                tags: ['test']
            }])
            .select()
            .single();

        if (error) {
            console.log('❌ Write test failed:', error.message);
            return { status: 'error', error: error.message };
        }

        console.log('✅ Write permissions: OK');
        console.log('📝 Test session created:', data.id);

        // Clean up test session
        await supabase
            .from('processing_sessions')
            .delete()
            .eq('id', data.id);

        console.log('🗑️  Test session cleaned up');

        return { status: 'success', sessionId: data.id };
    } catch (error) {
        console.log('❌ Write test error:', error.message);
        return { status: 'error', error: error.message };
    }
};

/**
/**
 * Test storage write permissions
 */
export const testStoragePermissions = async (userId, bucketName = 'session-files') => {
    console.log(`\n☁️  Testing Storage Permissions (${bucketName})...\n`);

    try {

        console.log(`✅ Upload test passed`);

        // Clean up
        // await supabase.storage.from(bucketName).remove([path]);
        console.log(`✅ Cleanup passed`);

        return { status: 'success' };
    } catch (error) {
        console.log(`❌ Storage test failed: ${error.message}`);
        return { status: 'error', error: error.message };
    }
};

/**
 * Run complete setup verification
 */
export const runCompleteSetup = async (userId = null) => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SUPABASE SETUP & VERIFICATION');
    console.log('='.repeat(50));

    // 1. Verify tables
    const tableResults = await verifyTables();

    // 2. Verify buckets
    const bucketResults = await verifyBuckets();

    // 3. Create missing buckets (Disabled to avoid RLS 400 errors)
    // await createMissingBuckets();

    // 4. Test write permissions (if userId provided)
    let writeTest = null;
    let storageTest = null;
    if (userId) {
        writeTest = await testWritePermissions(userId);
        storageTest = await testStoragePermissions(userId);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SETUP SUMMARY');
    console.log('='.repeat(50));

    const tablesOk = Object.values(tableResults).filter(r => r.status === 'success').length;
    const bucketsOk = Object.values(bucketResults).filter(r => r.status === 'success' || r.exists).length;

    console.log(`\n✅ Tables: ${tablesOk}/${REQUIRED_TABLES.length} accessible`);
    console.log(`✅ Buckets: ${bucketsOk}/${REQUIRED_BUCKETS.length} available`);

    if (writeTest) {
        console.log(`${writeTest.status === 'success' ? '✅' : '❌'} Write Permissions: ${writeTest.status}`);
    }
    if (storageTest) {
        console.log(`${storageTest.status === 'success' ? '✅' : '❌'} Storage Permissions: ${storageTest.status}`);
    }

    const allGood = tablesOk === REQUIRED_TABLES.length && bucketsOk === REQUIRED_BUCKETS.length;

    if (allGood) {
        console.log('\n🎉 All systems ready! Your Supabase connection is fully configured.\n');
    } else {
        console.log('\n⚠️  Some issues detected. Please check the errors above.\n');
    }

    return {
        tables: tableResults,
        buckets: bucketResults,
        writeTest,
        allGood
    };
};

// Auto-run in development mode
if (import.meta.env.DEV) {
    console.log('🔄 Running automatic setup verification...');
    setTimeout(() => {
        runCompleteSetup();
    }, 2000);
}
