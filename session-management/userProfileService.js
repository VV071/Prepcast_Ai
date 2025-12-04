import { supabase } from '../supabaseClient.js';

/**
 * ============================================
 * USER PROFILE SERVICE
 * ============================================
 * Manage user profiles with preferences and avatars
 */

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
