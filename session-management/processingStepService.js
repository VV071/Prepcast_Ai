import { supabase } from '../supabaseClient.js';

/**
 * ============================================
 * PROCESSING STEPS SERVICE
 * ============================================
 * Manage session processing steps
 */

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
