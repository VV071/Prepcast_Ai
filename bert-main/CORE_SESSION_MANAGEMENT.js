import { supabase } from '../supabaseClient';

/**
 * ============================================
 * SESSION MANAGEMENT - CORE OPERATIONS ONLY
 * ============================================
 * This file contains ONLY session CRUD operations
 * (Create, Read, Update, Delete)
 */

/**
 * Creates a new processing session.
 * @param {string} userId - The UUID of the user creating the session.
 * @param {string} sessionName - Name of the session.
 * @param {string} sessionType - Type of session ('survey' or 'dynamic').
 * @param {string} description - Optional description.
 * @param {Object} options - Optional settings (tags, isPublic).
 * @returns {Promise<Object>} The created session object.
 * 
 * @example
 * const session = await createSession(
 *   userId, 
 *   'My Session', 
 *   'survey', 
 *   'Description here',
 *   { tags: ['tag1', 'tag2'], isPublic: false }
 * );
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
 * @returns {Promise<Array>} List of sessions ordered by creation date (newest first).
 * 
 * @example
 * const sessions = await getSessions(userId);
 * console.log(sessions); // Array of session objects
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
 * 
 * @example
 * const session = await getSessionById(sessionId);
 * console.log(session.session_name);
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
 * 
 * @example
 * const updated = await updateSession(sessionId, {
 *   session_name: 'New Name',
 *   description: 'New description',
 *   last_accessed: new Date().toISOString()
 * });
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
 * Note: This will cascade delete all related records (files, logs, etc.)
 * based on your database foreign key constraints.
 * 
 * @param {string} sessionId - The UUID of the session.
 * @returns {Promise<boolean>} True if successful.
 * 
 * @example
 * await deleteSession(sessionId);
 */
export const deleteSession = async (sessionId) => {
    const { error } = await supabase
        .from('processing_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) throw error;
    return true;
};

/**
 * ============================================
 * USAGE EXAMPLES
 * ============================================
 * 
 * // 1. Create a new session
 * const newSession = await createSession(
 *   user.id,
 *   'Survey Analysis 2024',
 *   'survey',
 *   'Annual customer survey data',
 *   { tags: ['survey', '2024'], isPublic: false }
 * );
 * 
 * // 2. Get all sessions for a user
 * const allSessions = await getSessions(user.id);
 * 
 * // 3. Get a specific session
 * const session = await getSessionById(sessionId);
 * 
 * // 4. Update a session
 * const updated = await updateSession(sessionId, {
 *   session_name: 'Updated Name',
 *   last_accessed: new Date().toISOString()
 * });
 * 
 * // 5. Delete a session
 * await deleteSession(sessionId);
 */
