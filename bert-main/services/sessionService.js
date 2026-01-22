import { supabase } from '../supabaseClient';

/**
 * Session Management Service
 * Handles interactions with processing_sessions and related tables.
 */

// --- Session Management ---

/**
 * Creates a new processing session.
 * @param {string} userId - The UUID of the user creating the session.
 * @param {string} sessionName - Name of the session.
 * @param {string} sessionType - Type of session ('survey' or 'dynamic').
 * @param {string} description - Optional description.
 * @returns {Promise<Object>} The created session object.
 */
/**
 * Creates a new processing session.
 * @param {string} userId - The UUID of the user creating the session.
 * @param {string} sessionName - Name of the session.
 * @param {string} sessionType - Type of session ('survey' or 'dynamic').
 * @param {string} description - Optional description.
 * @param {Object} options - Optional settings (tags, isPublic).
 * @returns {Promise<Object>} The created session object.
 */
export const createSession = async (userId, sessionName, sessionType, description = '', options = {}) => {
    const { tags = [], isPublic = false } = options;

    const { data, error } = await supabase
        .from('processing_sessions')
        .insert([
            {
                user_id: userId,
                session_name: sessionName,
                session_type: sessionType,
                description: description,
                tags: tags,
                is_public: isPublic
                // created_at and updated_at are handled by default/triggers
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Retrieves all sessions for a specific user.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<Array>} List of sessions.
 */
export const getSessions = async (userId) => {
    const { data, error } = await supabase
        .from('processing_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Retrieves a single session by ID.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Object>} The session object.
 */
export const getSessionById = async (sessionId) => {
    const { data, error } = await supabase
        .from('processing_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Updates an existing session.
 * @param {string} sessionId - The UUID of the session.
 * @param {Object} updates - Object containing fields to update.
 * @returns {Promise<Object>} The updated session object.
 */
export const updateSession = async (sessionId, updates) => {
    const { data, error } = await supabase
        .from('processing_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Deletes a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteSession = async (sessionId) => {
    const { error } = await supabase
        .from('processing_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) throw error;
    return true;
};

// --- Activity Logging ---

/**
 * Logs an activity for a session.
 * Uses the database function log_activity if available, otherwise falls back to insert.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} userId - The UUID of the user performing the activity.
 * @param {string} activityType - Type of activity (e.g., 'create', 'update', 'process').
 * @param {string} details - Optional details about the activity.
 * @param {Object} metadata - Optional JSON metadata.
 * @returns {Promise<string>} The ID of the log entry.
 */
export const logActivity = async (sessionId, userId, activityType, details = '', metadata = {}) => {
    try {
        // Try using the RPC function first
        const { data, error } = await supabase.rpc('log_activity', {
            p_session_id: sessionId,
            p_user_id: userId,
            p_activity_type: activityType,
            p_activity_details: details,
            p_metadata: metadata
        });

        if (error) throw error;
        return data;
    } catch (err) {
        // Silent fallback
        // Fallback to direct insert
        const { data, error } = await supabase
            .from('session_activity_logs')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                activity_type: activityType,
                activity_details: details,
                metadata: metadata
            }])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }
};

/**
 * Retrieves activity logs for a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of activity logs.
 */
export const getSessionActivity = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_activity_logs')
        .select(`
      *,
      user:user_profiles(first_name, last_name, email)
    `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- File Management ---

/**
 * Uploads a file for a session and records it in the database with processing workflow.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} userId - The UUID of the user uploading the file.
 * @param {File} file - The file object to upload.
 * @param {Object} options - Additional options (fileData, rowCount, etc.)
 * @returns {Promise<Object>} The created file record.
 */
export const uploadSessionFile = async (sessionId, userId, file, options = {}) => {
    const { fileData = null, rowCount = 0, bucketName = 'session-files' } = options;

    // 1. Upload to Storage (optional - can store in file_data instead)
    // 1. Upload to Storage
    let filePath = null;
    if (file) {
        const timestamp = new Date().getTime();
        filePath = `${userId}/${sessionId}/${timestamp}_${file.name}`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

        if (storageError) {
            console.error('Storage upload failed:', storageError);
            // If we have fileData, we can continue, otherwise throw
            if (!fileData) throw storageError;
            filePath = null; // Reset path if upload failed
        }
    }

    // 2. Record in session_files table with processing status
    const { data: dbData, error: dbError } = await supabase
        .from('session_files')
        .insert([{
            session_id: sessionId,
            file_name: file.name,
            file_path: filePath,
            bucket_name: bucketName,
            file_size: file.size,
            file_type: file.type || 'text/csv',
            file_data: fileData,
            processing_status: 'pending',
            original_row_count: rowCount,
            uploaded_by: userId
        }])
        .select()
        .single();

    if (dbError) {
        // If DB insert fails, try to clean up the uploaded file
        if (filePath) {
            await supabase.storage.from(bucketName).remove([filePath]);
        }
        throw dbError;
    }

    // Log the upload activity
    await logActivity(sessionId, userId, 'upload', `Uploaded file: ${file.name}`, { file_id: dbData.id });

    return dbData;
};

/**
 * Updates the processing status of a file.
 * @param {string} fileId - The UUID of the file.
 * @param {string} status - Processing status ('pending', 'processing', 'completed', 'failed').
 * @param {Object} updates - Additional fields to update (cleaned_row_count, etc.).
 * @returns {Promise<Object>} The updated file record.
 */
export const updateFileProcessingStatus = async (fileId, status, updates = {}) => {
    const updateData = {
        processing_status: status,
        ...updates
    };

    if (status === 'completed') {
        updateData.is_processed = true;
        updateData.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('session_files')
        .update(updateData)
        .eq('id', fileId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Subscribes to file processing updates.
 * @param {string} fileId - The UUID of the file.
 * @param {Function} callback - Callback function to handle updates.
 * @returns {Object} Subscription channel.
 */
export const subscribeToFileProcessing = (fileId, callback) => {
    return supabase
        .channel(`processing-${fileId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'session_files',
                filter: `id=eq.${fileId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

/**
 * Retrieves files associated with a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of files.
 */
export const getSessionFiles = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Deletes a session file.
 * @param {string} fileId - The UUID of the file record.
 * @param {string} userId - The UUID of the user requesting delete.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteSessionFile = async (fileId, userId) => {
    // 1. Get file details to find path
    const { data: fileData, error: fetchError } = await supabase
        .from('session_files')
        .select('*')
        .eq('id', fileId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Delete from Storage
    const { error: storageError } = await supabase.storage
        .from(fileData.bucket_name)
        .remove([fileData.file_path]);

    if (storageError) throw storageError;

    // 3. Delete from Database
    const { error: dbError } = await supabase
        .from('session_files')
        .delete()
        .eq('id', fileId);

    if (dbError) throw dbError;

    // Log activity
    await logActivity(fileData.session_id, userId, 'delete', `Deleted file: ${fileData.file_name}`);

    return true;
};

// --- Collaborators ---

/**
 * Retrieves collaborators for a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of collaborators.
 */
export const getCollaborators = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_collaborators')
        .select(`
      *,
      user:user_profiles(first_name, last_name, email, avatar_url)
    `)
        .eq('session_id', sessionId);

    if (error) throw error;
    return data;
};

/**
 * Adds a collaborator to a session.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} email - The email of the user to invite.
 * @param {string} invitedBy - The UUID of the user sending the invite.
 * @param {string} permissionLevel - Permission level ('viewer', 'editor', 'admin').
 * @returns {Promise<Object>} The created collaborator record.
 */
export const addCollaborator = async (sessionId, email, invitedBy, permissionLevel = 'viewer') => {
    // 1. Find user by email
    // Note: This assumes you have a way to lookup users by email. 
    // If 'users' table is public/accessible, we can query it.
    const { data: userData, error: userError } = await supabase
        .from('users') // or user_profiles depending on where email is stored and accessible
        .select('id')
        .eq('email', email)
        .single();

    if (userError || !userData) {
        throw new Error(`User with email ${email} not found.`);
    }

    const userId = userData.id;

    // 2. Add to session_collaborators
    const { data, error } = await supabase
        .from('session_collaborators')
        .insert([{
            session_id: sessionId,
            user_id: userId,
            invited_by: invitedBy,
            permission_level: permissionLevel,
            invitation_status: 'pending' // Default
        }])
        .select()
        .single();

    if (error) throw error;

    // Log activity
    await logActivity(sessionId, invitedBy, 'collaborator_added', `Invited ${email} as ${permissionLevel}`);

    return data;
};

/**
 * Removes a collaborator from a session.
 * @param {string} collaboratorId - The UUID of the collaborator record (not the user_id, but the primary key of session_collaborators).
 * @param {string} removedBy - The UUID of the user performing the removal.
 * @returns {Promise<boolean>} True if successful.
 */
export const removeCollaborator = async (collaboratorId, removedBy) => {
    // Get session_id for logging before deletion
    const { data: collabData } = await supabase
        .from('session_collaborators')
        .select('session_id, user_id')
        .eq('id', collaboratorId)
        .single();

    const { error } = await supabase
        .from('session_collaborators')
        .delete()
        .eq('id', collaboratorId);

    if (error) throw error;

    if (collabData) {
        await logActivity(collabData.session_id, removedBy, 'collaborator_removed', 'Removed collaborator');
    }

    return true;
};

// --- Data Sources ---

/**
 * Adds a data source to a session.
 * @param {string} sessionId - The UUID of the session.
 * @param {Object} sourceData - Data source details (source_name, source_type, etc.).
 * @returns {Promise<Object>} The created data source record.
 */
export const addSessionDataSource = async (sessionId, sourceData) => {
    const { data, error } = await supabase
        .from('session_data_sources')
        .insert([{
            session_id: sessionId,
            ...sourceData
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Retrieves data sources for a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of data sources.
 */
export const getSessionDataSources = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_data_sources')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- Processing Steps ---

/**
 * Adds or updates a processing step.
 * @param {string} sessionId - The UUID of the session.
 * @param {number} stepNumber - The step number.
 * @param {string} stepName - The name of the step.
 * @param {string} status - Status ('pending', 'processing', 'completed', 'failed').
 * @param {Object} config - Configuration for the step.
 * @returns {Promise<Object>} The step record.
 */
export const updateProcessingStep = async (sessionId, stepNumber, stepName, status, config = {}) => {
    // Check if step exists
    const { data: existingStep } = await supabase
        .from('session_processing_steps')
        .select('id')
        .eq('session_id', sessionId)
        .eq('step_number', stepNumber)
        .single();

    let result;
    if (existingStep) {
        // Update
        const { data, error } = await supabase
            .from('session_processing_steps')
            .update({
                step_name: stepName,
                step_status: status,
                step_config: config,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingStep.id)
            .select()
            .single();

        if (error) throw error;
        result = data;
    } else {
        // Insert
        const { data, error } = await supabase
            .from('session_processing_steps')
            .insert([{
                session_id: sessionId,
                step_number: stepNumber,
                step_name: stepName,
                step_status: status,
                step_config: config
            }])
            .select()
            .single();

        if (error) throw error;
        result = data;
    }
    return result;
};

/**
 * Retrieves processing steps for a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of processing steps.
 */
export const getProcessingSteps = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_processing_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('step_number', { ascending: true });

    if (error) throw error;
    return data;
};

// --- Exports ---

/**
 * Creates an export record.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} exportName - Name of the export.
 * @param {string} format - Format (e.g., 'csv', 'json').
 * @param {string} path - Storage path or URL.
 * @returns {Promise<Object>} The created export record.
 */
export const createSessionExport = async (sessionId, exportName, format, path) => {
    const { data, error } = await supabase
        .from('session_exports')
        .insert([{
            session_id: sessionId,
            export_name: exportName,
            export_format: format,
            export_path: path
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Retrieves exports for a session.
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<Array>} List of exports.
 */
export const getSessionExports = async (sessionId) => {
    const { data, error } = await supabase
        .from('session_exports')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- User Profile ---

/**
 * Gets a user profile by ID.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<Object>} The user profile.
 */
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Creates a new user profile.
 * @param {string} userId - The UUID of the user (must match auth.users id).
 * @param {Object} profileData - Profile data (full_name, organization, etc.).
 * @returns {Promise<Object>} The created profile.
 */
export const createUserProfile = async (userId, profileData) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
            id: userId,
            full_name: profileData.fullName || profileData.full_name,
            organization: profileData.organization,
            avatar_url: profileData.avatarUrl || profileData.avatar_url,
            preferences: profileData.preferences || {
                theme: 'dark',
                notifications: true,
                language: 'en'
            }
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Updates a user profile.
 * @param {string} userId - The UUID of the user.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object>} The updated profile.
 */
export const updateUserProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Updates user preferences.
 * @param {string} userId - The UUID of the user.
 * @param {Object} preferences - Preferences object.
 * @returns {Promise<Object>} The updated profile.
 */
export const updateUserPreferences = async (userId, preferences) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ preferences })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Uploads and updates user avatar.
 * @param {string} userId - The UUID of the user.
 * @param {File} avatarFile - The avatar image file.
 * @returns {Promise<Object>} The updated profile with new avatar URL.
 */
export const uploadUserAvatar = async (userId, avatarFile) => {
    // Upload avatar to storage
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('user-avatars')
        .upload(`${userId}/avatar.jpg`, avatarFile, {
            upsert: true
        });

    if (uploadError) throw uploadError;

    // Get public avatar URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('user-avatars')
        .getPublicUrl(`${userId}/avatar.jpg`);

    // Update user profile with avatar URL
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Subscribes to user profile updates.
 * @param {string} userId - The UUID of the user.
 * @param {Function} callback - Callback function to handle updates.
 * @returns {Object} Subscription channel.
 */
export const subscribeToProfileUpdates = (userId, callback) => {
    return supabase
        .channel(`profile-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_profiles',
                filter: `id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};
