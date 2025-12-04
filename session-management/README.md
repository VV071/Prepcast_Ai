# Session Management Module

Complete session management system for Supabase-backed applications.

## 📁 Folder Structure

```
session-management/
├── index.js                      # Main export file
├── sessionService.js             # Core session CRUD & activity logging
├── fileService.js                # File upload & processing workflow
├── collaboratorService.js        # Collaborator management
├── dataSourceService.js          # Data sources management
├── processingStepService.js      # Processing steps tracking
├── exportService.js              # Export management
└── userProfileService.js         # User profiles & preferences
```

## 🚀 Quick Start

### Import All Functions
```javascript
import * as SessionManagement from './session-management';

// Or import specific functions
import { 
  createSession, 
  uploadSessionFile, 
  getUserProfile 
} from './session-management';
```

## 📦 Available Services

### 1. **Session Service** (`sessionService.js`)
Core session operations:
- `createSession(userId, sessionName, sessionType, description, options)`
- `getSessions(userId)`
- `getSessionById(sessionId)`
- `updateSession(sessionId, updates)`
- `deleteSession(sessionId)`
- `logActivity(sessionId, userId, activityType, details, metadata)`
- `getSessionActivity(sessionId)`

### 2. **File Service** (`fileService.js`)
File management with processing workflow:
- `uploadSessionFile(sessionId, userId, file, options)`
- `updateFileProcessingStatus(fileId, status, updates)`
- `subscribeToFileProcessing(fileId, callback)`
- `getSessionFiles(sessionId)`
- `deleteSessionFile(fileId, userId)`

### 3. **Collaborator Service** (`collaboratorService.js`)
Manage session collaborators:
- `getCollaborators(sessionId)`
- `addCollaborator(sessionId, email, invitedBy, permissionLevel)`
- `removeCollaborator(collaboratorId, removedBy)`

### 4. **Data Source Service** (`dataSourceService.js`)
Manage data sources:
- `addSessionDataSource(sessionId, sourceData)`
- `getSessionDataSources(sessionId)`

### 5. **Processing Step Service** (`processingStepService.js`)
Track processing workflow:
- `updateProcessingStep(sessionId, stepNumber, stepName, status, config)`
- `getProcessingSteps(sessionId)`

### 6. **Export Service** (`exportService.js`)
Manage exports:
- `createSessionExport(sessionId, exportName, format, path)`
- `getSessionExports(sessionId)`

### 7. **User Profile Service** (`userProfileService.js`)
User profile management:
- `getUserProfile(userId)`
- `createUserProfile(userId, profileData)`
- `updateUserProfile(userId, updates)`
- `updateUserPreferences(userId, preferences)`
- `uploadUserAvatar(userId, avatarFile)`
- `subscribeToProfileUpdates(userId, callback)`

## 💡 Usage Examples

### Create a Session
```javascript
import { createSession } from './session-management';

const session = await createSession(
  userId,
  'My Session',
  'survey',
  'Description here',
  { tags: ['tag1', 'tag2'], isPublic: false }
);
```

### Upload File with Processing Workflow
```javascript
import { uploadSessionFile, updateFileProcessingStatus } from './session-management';

// 1. Upload file
const uploadedFile = await uploadSessionFile(sessionId, userId, file, {
  fileData: JSON.stringify(data),
  rowCount: data.length
});

// 2. Update to processing
await updateFileProcessingStatus(uploadedFile.id, 'processing');

// 3. Complete processing
await updateFileProcessingStatus(uploadedFile.id, 'completed', {
  cleaned_row_count: cleanedData.length
});
```

### Subscribe to Real-time Updates
```javascript
import { subscribeToFileProcessing } from './session-management';

const subscription = subscribeToFileProcessing(fileId, (updatedFile) => {
  console.log('Processing status:', updatedFile.processing_status);
  console.log('Cleaned rows:', updatedFile.cleaned_row_count);
});
```

### Manage User Profile
```javascript
import { getUserProfile, updateUserProfile } from './session-management';

// Get profile
const profile = await getUserProfile(userId);

// Update profile
await updateUserProfile(userId, {
  organization: 'New Company',
  full_name: 'Updated Name'
});
```

## 🗄️ Database Tables

This module works with the following Supabase tables:
- `processing_sessions`
- `session_activity_logs`
- `session_files`
- `session_collaborators`
- `session_data_sources`
- `session_processing_steps`
- `session_exports`
- `user_profiles`

## 🔐 Security

All functions use Supabase Row Level Security (RLS) policies. Ensure your database has proper RLS policies configured for each table.

## 📝 Notes

- All functions are async and return Promises
- Errors are thrown and should be caught with try/catch
- File uploads support both storage bucket and database storage
- Real-time subscriptions require Supabase Realtime enabled
- Activity logging uses RPC function with fallback to direct insert

## 🤝 Integration

To use in your existing project:

1. Copy the `session-management` folder to your project
2. Update the import path in each service file:
   ```javascript
   import { supabase } from '../supabaseClient';
   ```
3. Import functions where needed:
   ```javascript
   import { createSession, uploadSessionFile } from './session-management';
   ```

## 📄 License

Part of your PrepCast-AI application.
