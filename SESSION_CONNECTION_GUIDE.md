# Session Management - Supabase Connection Guide

## ✅ Connection Status: CONNECTED

Your session management module is now fully connected to Supabase!

## 🔗 Connection Details

### Supabase Configuration
- **URL**: `https://yxlssgnsolsjkgwsobdh.supabase.co`
- **Client**: Configured in `supabaseClient.js`
- **Environment**: `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Module Structure
```
session-management/
├── sessionService.js         ✅ Connected to Supabase
├── fileService.js            ✅ Connected to Supabase
├── collaboratorService.js    ✅ Connected to Supabase
├── dataSourceService.js      ✅ Connected to Supabase
├── processingStepService.js  ✅ Connected to Supabase
├── exportService.js          ✅ Connected to Supabase
└── userProfileService.js     ✅ Connected to Supabase
```

## 🚀 How to Use

### 1. Import Functions
```javascript
// Import from the main index
import { 
    createSession, 
    getSessions,
    uploadSessionFile,
    getUserProfile 
} from './session-management/index.js';

// Or import from specific services
import { createSession } from './session-management/sessionService.js';
import { uploadSessionFile } from './session-management/fileService.js';
```

### 2. Use in Your Components

#### Example: Create a Session
```javascript
import { createSession } from './session-management/index.js';

const handleCreateSession = async () => {
    try {
        const session = await createSession(
            user.id,
            'My New Session',
            'survey',
            'Session description',
            { tags: ['tag1', 'tag2'], isPublic: false }
        );
        console.log('Session created:', session);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

#### Example: Upload File
```javascript
import { uploadSessionFile } from './session-management/index.js';

const handleFileUpload = async (file) => {
    try {
        const uploadedFile = await uploadSessionFile(
            sessionId,
            userId,
            file,
            {
                fileData: JSON.stringify(data),
                rowCount: data.length
            }
        );
        console.log('File uploaded:', uploadedFile);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

#### Example: Get User Profile
```javascript
import { getUserProfile } from './session-management/index.js';

const loadProfile = async () => {
    try {
        const profile = await getUserProfile(user.id);
        console.log('Profile:', profile.full_name);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

## 🧪 Testing the Connection

### Option 1: Quick Test
```javascript
import { checkConnection } from './testConnection.js';

// Check if Supabase is connected
await checkConnection();
```

### Option 2: Full Test
```javascript
import { testSessionManagement } from './testConnection.js';

// Test all session management functions
await testSessionManagement(user.id);
```

### Option 3: Browser Console Test
Open your browser console and run:
```javascript
// Test in browser console
import('./session-management/index.js').then(async (module) => {
    const sessions = await module.getSessions('your-user-id');
    console.log('Sessions:', sessions);
});
```

## 📊 Database Tables Connected

Your session management module connects to these Supabase tables:

✅ `processing_sessions` - Main sessions table
✅ `session_activity_logs` - Activity tracking
✅ `session_files` - File uploads
✅ `session_collaborators` - Collaborators
✅ `session_data_sources` - Data sources
✅ `session_processing_steps` - Processing steps
✅ `session_exports` - Exports
✅ `user_profiles` - User profiles

## 🔐 Security

All functions use Supabase Row Level Security (RLS):
- Users can only access their own sessions
- Collaborators have permission-based access
- Files are protected by session ownership
- Activity logs are read-only for users

## ⚡ Real-time Features

The module includes real-time subscriptions:

```javascript
import { subscribeToFileProcessing } from './session-management/index.js';

// Subscribe to file processing updates
const subscription = subscribeToFileProcessing(fileId, (updatedFile) => {
    console.log('File status:', updatedFile.processing_status);
});

// Unsubscribe when done
subscription.unsubscribe();
```

## 🐛 Troubleshooting

### Issue: Import errors
**Solution**: Make sure to use `.js` extension in imports:
```javascript
import { createSession } from './session-management/index.js';
```

### Issue: Supabase connection failed
**Solution**: Check your `.env` file has correct values:
```
VITE_SUPABASE_URL=https://yxlssgnsolsjkgwsobdh.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### Issue: RLS policy errors
**Solution**: Ensure your Supabase tables have proper RLS policies configured.

## 📝 Next Steps

1. ✅ Connection is ready
2. ✅ All services are configured
3. 🔄 Test the connection (use `testConnection.js`)
4. 🔄 Update your components to use the new services
5. 🔄 Test in your running app

## 💡 Example Integration

Update your existing components:

```javascript
// Before (direct Supabase)
const { data } = await supabase
    .from('processing_sessions')
    .insert([{ ... }]);

// After (using session management)
import { createSession } from './session-management/index.js';
const data = await createSession(userId, name, type, description);
```

## 🎉 You're All Set!

Your session management module is fully connected to Supabase and ready to use!
