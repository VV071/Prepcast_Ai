import { supabase } from '../supabaseClient.js';
import { logActivity } from './sessionService.js';

/**
 * ============================================
 * FILE MANAGEMENT SERVICE
 * ============================================
 * Complete file upload and processing workflow
 * for session_files table
 */

/**
 * Uploads a file for a session with complete processing workflow.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} userId - The UUID of the user uploading the file.
 * @param {File} file - The file object to upload.
 * @param {Object} options - Additional options (fileData, rowCount, bucketName).
 * @returns {Promise<Object>} The created file record.
 */
export const uploadSessionFile = async (sessionId, userId, file, options = {}) => {
    const { fileData = null, rowCount = 0, bucketName = 'session-files' } = options;

    // 1. Upload to Storage (optional - can store in file_data instead)
    let filePath = null;
    if (!fileData) {
        const timestamp = new Date().getTime();
        filePath = `${userId}/${sessionId}/${timestamp}_${file.name}`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

        if (storageError) throw storageError;
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
    if (fileData.file_path) {
        const { error: storageError } = await supabase.storage
            .from(fileData.bucket_name)
            .remove([fileData.file_path]);

        if (storageError) throw storageError;
    }

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
