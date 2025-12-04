# PrepCast-AI Platform - Complete Guide

A comprehensive data processing platform with **session management**, **authentication**, **batch processing**, and **real-time streaming** capabilities.

## 🎯 Complete System Overview

```
Login → Main Dashboard → Session Management → Processing Modes
                         ├── Dashboard (All Sessions)
                         ├── Survey Processing (Batch)
                         ├── Dynamic Sources (Real-Time)
                         └── Templates (Saved Configs)
```

## 🚀 Features

### 🔐 Authentication & User Management
- Secure login/signup with Supabase
- User profiles with avatars
- Session persistence
- Password recovery

### 📁 Session Management
- **Create Sessions**: Organize your work into named sessions
- **Recent Sessions**: Quick access to your last 5 sessions
- **Session Types**: Survey, Dynamic, or Batch processing
- **Tags & Descriptions**: Organize and search sessions
- **Public/Private**: Share sessions or keep them private
- **Collaboration**: Invite team members with viewer/editor permissions
- **Auto-Save**: Sessions automatically save progress

### 📊 Batch Processing (PrepCast-AI)
- Upload CSV/Excel files
- AI domain detection
- Smart data cleaning
- Live editing
- Weighted statistics
- Export reports

### ⚡ Real-Time Streaming (Dynamic File)
- Connect to live data sources
- Configurable refresh intervals
- AI-powered cleaning
- Anomaly detection
- Live logs

### 📋 Templates
- Save cleaning configurations
- Reuse across sessions
- Share with team
- Public template library

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
cd d:\login-master
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the schema from `database/schema.sql`

This will create:
- `processing_sessions` table
- `session_collaborators` table
- `session_data_sources` table
- `processing_templates` table
- All necessary indexes and RLS policies

### 3. Configure Environment Variables

Update `.env` with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_KEY=your_gemini_api_key
```

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🎨 User Interface

### Sidebar Navigation
- **Dashboard**: View all sessions
- **Survey Processing**: Batch file processing
- **Dynamic Sources**: Real-time data streams
- **Templates**: Saved configurations
- **Recent Sessions**: Quick access (last 5)
- **User Profile**: Settings and logout

### Top Bar
- **Menu Toggle**: Show/hide sidebar
- **Session Info**: Current session name
- **Action Buttons**: Save, Export, Share (when in session)
- **Logout**: Sign out

### Dashboard View
- **Session Cards**: Visual cards for each session
- **Stats**: Records, processed count, progress
- **Actions**: Open, Share, Delete
- **Create New**: Quick session creation

## 📖 Usage Guide

### Creating a Session

1. Click **"New Session"** in sidebar or dashboard
2. Fill in session details:
   - **Name**: Descriptive name (required)
   - **Description**: What this session is for
   - **Type**: Survey, Dynamic, or Batch
   - **Tags**: Comma-separated keywords
   - **Public**: Make shareable
3. Click **"Create Session"**
4. You'll be taken to the appropriate processing view

### Working with Sessions

#### Survey Processing Session
1. Create a "Survey" type session
2. Upload your CSV/Excel file
3. AI detects the domain
4. Configure cleaning methods
5. Edit data if needed
6. Apply weights
7. Generate report
8. Session auto-saves progress

#### Dynamic Sources Session
1. Create a "Dynamic" type session
2. Configure data source:
   - Type: Sheet/API/Scraper
   - URL: Source location
   - Interval: Refresh frequency
3. Start monitoring
4. Watch real-time cleaning
5. Track anomalies
6. Session saves configuration

### Sharing Sessions

1. Open a session
2. Click **"Share"** button
3. Options:
   - **Copy Link**: Share public link
   - **Add Collaborator**: Invite by email
   - **Set Permissions**: Viewer or Editor
4. Collaborators see session in "Shared With Me"

### Managing Sessions

- **Open**: Click session card or name
- **Delete**: Click trash icon (confirms first)
- **Edit**: Open session and modify
- **Export**: Download processed data
- **Save**: Manual save or auto-save

## 🗄️ Database Schema

### processing_sessions
Stores all user sessions with:
- Session metadata (name, description, type)
- Progress tracking (current_step, total_steps)
- Data statistics (record counts)
- Processing data (raw, processed, configs)
- Timestamps (created, updated, accessed)

### session_collaborators
Manages session sharing:
- User permissions (viewer, editor, admin)
- Invitation status (pending, accepted, declined)
- Invited by tracking

### session_data_sources
Stores dynamic source configurations:
- Source type and URL
- Refresh frequency
- Status and error tracking

### processing_templates
Saved processing configurations:
- Cleaning configs
- Weight configs
- Usage statistics

## 🔒 Security

### Row Level Security (RLS)
- Users can only see their own sessions
- Shared sessions visible to collaborators
- Public sessions visible to all
- Strict permission checks

### Policies
- **SELECT**: Own sessions + shared + public
- **INSERT**: Own sessions only
- **UPDATE**: Own sessions only
- **DELETE**: Own sessions only
- **Collaborators**: Session owners control access

## 🎯 Workflow Examples

### Example 1: Monthly Survey Analysis
```
1. Create Session: "November 2024 Survey"
2. Type: Survey
3. Upload: monthly_survey.csv
4. AI detects: Healthcare domain
5. Configure: Median imputation, IQR outliers
6. Clean data
7. Apply weights
8. Generate report
9. Share with team (viewer access)
10. Export results
```

### Example 2: Real-Time Monitoring
```
1. Create Session: "COVID-19 Live Data"
2. Type: Dynamic
3. Source: Google Sheets API
4. Interval: Every 5 minutes
5. Start monitoring
6. AI cleans incoming data
7. Track anomalies
8. Share dashboard (editor access)
9. Continuous operation
```

### Example 3: Template Reuse
```
1. Create Session: "Q4 Financial Data"
2. Configure cleaning (mean, winsorize, 3.0)
3. Save as template: "Financial Standard"
4. Next month: New session
5. Apply template: "Financial Standard"
6. Process new data with same config
```

## 📊 Session States

### Progress Tracking
- **Step 0**: Upload/Configure
- **Step 1**: Schema Review
- **Step 2**: Cleaning Config
- **Step 3**: Live Edit
- **Step 4**: Weights
- **Step 5**: Report

### Status Indicators
- **Active**: Currently being worked on
- **Completed**: All steps finished
- **Shared**: Has collaborators
- **Public**: Shareable link active

## 🔧 Advanced Features

### Collaboration
- **Viewer**: Can view session and data
- **Editor**: Can modify and process
- **Admin**: Full control (future)

### Auto-Save
- Saves every major action
- Updates `updated_at` timestamp
- Tracks `last_accessed` for sorting

### Search & Filter (Future)
- Search by name/description
- Filter by type/tags
- Sort by date/name/status

## 🐛 Troubleshooting

### Sessions Not Loading
1. Check Supabase connection
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Ensure user is authenticated

### Can't Create Session
1. Verify database schema is created
2. Check user permissions
3. Ensure session name is not empty
4. Check Supabase logs

### Sharing Not Working
1. Verify collaborators table exists
2. Check email is registered user
3. Ensure session is not deleted
4. Check RLS policies

## 📝 API Reference

### Session Operations
```javascript
// Create session
const { data, error } = await supabase
  .from('processing_sessions')
  .insert([{ user_id, session_name, ... }])
  .select()
  .single();

// Load sessions
const { data, error } = await supabase
  .from('processing_sessions')
  .select('*')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });

// Update session
const { data, error } = await supabase
  .from('processing_sessions')
  .update({ ...sessionData })
  .eq('id', sessionId);

// Delete session
const { error } = await supabase
  .from('processing_sessions')
  .delete()
  .eq('id', sessionId);
```

### Collaboration
```javascript
// Add collaborator
const { error } = await supabase
  .from('session_collaborators')
  .insert([{
    session_id,
    user_id,
    permission_level,
    invited_by
  }]);

// Remove collaborator
const { error } = await supabase
  .from('session_collaborators')
  .delete()
  .eq('id', collaboratorId);
```

## 🚀 Future Enhancements

- [ ] Real-time collaboration (live editing)
- [ ] Session versioning
- [ ] Advanced search and filters
- [ ] Session analytics dashboard
- [ ] Export to multiple formats
- [ ] Scheduled processing
- [ ] Email notifications
- [ ] Mobile app
- [ ] API access
- [ ] Webhook integrations

## 📄 License

ISC

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Google Gemini for AI capabilities
- React and Vite for frontend tooling

---

**Built for data professionals who need powerful session management and data processing capabilities.**
