-- Create user_profiles table (Extended profile info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    organization TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own user_profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own user_profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own user_profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create session_files table
CREATE TABLE IF NOT EXISTS public.session_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    bucket_name TEXT DEFAULT 'session-files',
    file_size BIGINT,
    file_type TEXT,
    file_data JSONB, -- Storing parsed data if needed
    processing_status TEXT DEFAULT 'pending',
    original_row_count INTEGER,
    cleaned_row_count INTEGER,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for session_files
ALTER TABLE public.session_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files for their sessions"
    ON public.session_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_files.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_files.session_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can upload files to their sessions"
    ON public.session_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_files.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_files.session_id
                    AND user_id = auth.uid()
                    AND permission_level IN ('editor', 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can update files in their sessions"
    ON public.session_files FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_files.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_files.session_id
                    AND user_id = auth.uid()
                    AND permission_level IN ('editor', 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can delete files in their sessions"
    ON public.session_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_files.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_files.session_id
                    AND user_id = auth.uid()
                    AND permission_level IN ('editor', 'admin')
                )
            )
        )
    );

-- Create session_activity_logs table
CREATE TABLE IF NOT EXISTS public.session_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    activity_details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for session_activity_logs
ALTER TABLE public.session_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their sessions"
    ON public.session_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_activity_logs.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_activity_logs.session_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert logs"
    ON public.session_activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create session_data_sources table
CREATE TABLE IF NOT EXISTS public.session_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for session_data_sources
ALTER TABLE public.session_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view data sources for their sessions"
    ON public.session_data_sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_data_sources.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_data_sources.session_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Create session_processing_steps table
CREATE TABLE IF NOT EXISTS public.session_processing_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_status TEXT DEFAULT 'pending',
    step_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for session_processing_steps
ALTER TABLE public.session_processing_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view processing steps"
    ON public.session_processing_steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_processing_steps.session_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_processing_steps.session_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Create processing_templates table
CREATE TABLE IF NOT EXISTS public.processing_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    template_name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for processing_templates
ALTER TABLE public.processing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
    ON public.processing_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates"
    ON public.processing_templates FOR ALL
    USING (auth.uid() = user_id);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_session_files_session_id ON public.session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_logs_session_id ON public.session_activity_logs(session_id);
