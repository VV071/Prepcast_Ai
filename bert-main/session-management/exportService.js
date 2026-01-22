import { supabase } from '../supabaseClient.js';

/**
 * ============================================
 * EXPORTS SERVICE
 * ============================================
 * Manage session exports
 */

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
