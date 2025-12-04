import { supabase } from '../supabaseClient.js';

/**
 * ============================================
 * SESSION MANAGEMENT SERVICE
 * ============================================
 * Complete session management with all CRUD operations
 * and related functionality for processing_sessions table
 */

// ==================== SESSION CRUD OPERATIONS ====================

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

// ==================== ACTIVITY LOGGING ====================

/**
 * Logs an activity for a session.
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
        console.warn("RPC log_activity failed, falling back to direct insert:", err.message);
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
