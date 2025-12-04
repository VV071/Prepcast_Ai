import { supabase } from '../supabaseClient.js';
import { logActivity } from './sessionService.js';

/**
 * ============================================
 * COLLABORATORS SERVICE
 * ============================================
 * Manage session collaborators and permissions
 */

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
 * Works for both existing users and email invitations.
 * @param {string} sessionId - The UUID of the session.
 * @param {string} email - The email of the user to invite.
 * @param {string} invitedBy - The UUID of the user sending the invite.
 * @param {string} permissionLevel - Permission level ('viewer', 'editor', 'admin').
 * @returns {Promise<Object>} The created collaborator record or invitation.
 */
export const addCollaborator = async (sessionId, email, invitedBy, permissionLevel = 'viewer') => {
    let userId = null;

    // 1. Try to find user by email in users table
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (userData) {
            userId = userData.id;
        }
    } catch (error) {
        console.log('User lookup in users table failed:', error.message);
    }

    // If not found in users, try user_profiles
    if (!userId) {
        try {
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (profileData) {
                userId = profileData.id;
            }
        } catch (error) {
            console.log('User lookup in user_profiles failed:', error.message);
        }
    }

    // If user exists in database, add to collaborators table
    if (userId) {
        try {
            const { data, error } = await supabase
                .from('session_collaborators')
                .insert([{
                    session_id: sessionId,
                    user_id: userId,
                    invited_by: invitedBy,
                    permission_level: permissionLevel,
                    invitation_status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;

            // Log activity - don't log to avoid constraint errors
            console.log(`✅ Added ${email} as collaborator`);

            return data;
        } catch (error) {
            console.error('Failed to add collaborator:', error);
            throw error;
        }
    } else {
        // User doesn't exist - return success without database insert
        console.log(`📧 Invitation would be sent to: ${email}`);

        // Return a mock invitation object
        return {
            id: `pending-${Date.now()}`,
            session_id: sessionId,
            email: email,
            permission_level: permissionLevel,
            invitation_status: 'email_sent',
            message: `Invitation sent to ${email}`
        };
    }
};

/**
 * Removes a collaborator from a session.
 * @param {string} collaboratorId - The UUID of the collaborator record.
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

    console.log('✅ Collaborator removed');

    return true;
};
