-- Create users table (public profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Create processing_sessions table
CREATE TABLE IF NOT EXISTS public.processing_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for processing_sessions
ALTER TABLE public.processing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON public.processing_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON public.processing_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON public.processing_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON public.processing_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Create session_collaborators table
CREATE TABLE IF NOT EXISTS public.session_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    permission_level TEXT CHECK (permission_level IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer',
    invitation_status TEXT CHECK (invitation_status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    invitation_token TEXT,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.session_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for session_collaborators
CREATE POLICY "Users can view collaborators for sessions they have access to"
    ON public.session_collaborators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_collaborators.session_id
            AND user_id = auth.uid()
        )
        OR 
        user_id = auth.uid()
    );

CREATE POLICY "Session owners can manage collaborators"
    ON public.session_collaborators FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_collaborators.session_id
            AND user_id = auth.uid()
        )
    );

-- Create session_exports table
CREATE TABLE IF NOT EXISTS public.session_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.processing_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL,
    format TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT,
    storage_path TEXT,
    include_raw_data BOOLEAN DEFAULT false,
    include_statistics BOOLEAN DEFAULT false,
    include_logs BOOLEAN DEFAULT false,
    export_config JSONB DEFAULT '{}'::jsonb,
    downloaded_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.session_exports ENABLE ROW LEVEL SECURITY;

-- Policies for session_exports
CREATE POLICY "Users can view their own exports"
    ON public.session_exports FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create exports for sessions they have access to"
    ON public.session_exports FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM public.processing_sessions
            WHERE id = session_exports.session_id
            AND (
                user_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM public.session_collaborators
                    WHERE session_id = session_exports.session_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_collaborators_session_id ON public.session_collaborators(session_id);
CREATE INDEX IF NOT EXISTS idx_session_collaborators_user_id ON public.session_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_session_exports_session_id ON public.session_exports(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exports_user_id ON public.session_exports(user_id);
