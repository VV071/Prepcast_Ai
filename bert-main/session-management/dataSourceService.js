import { supabase } from '../supabaseClient.js';

/**
 * ============================================
 * DATA SOURCES SERVICE
 * ============================================
 * Manage session data sources
 */

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
