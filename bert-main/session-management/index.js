/**
 * ============================================
 * SESSION MANAGEMENT - MAIN EXPORT
 * ============================================
 * Central export file for all session management services
 */

// Session CRUD
export {
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession,
    logActivity,
    getSessionActivity
} from './sessionService';

// File Management
export {
    uploadSessionFile,
    updateFileProcessingStatus,
    subscribeToFileProcessing,
    getSessionFiles,
    deleteSessionFile
} from './fileService';

// Collaborators
export {
    getCollaborators,
    addCollaborator,
    removeCollaborator
} from './collaboratorService';

// Data Sources
export {
    addSessionDataSource,
    getSessionDataSources
} from './dataSourceService';

// Processing Steps
export {
    updateProcessingStep,
    getProcessingSteps
} from './processingStepService';

// Exports
export {
    createSessionExport,
    getSessionExports
} from './exportService';

// User Profiles
export {
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    updateUserPreferences,
    uploadUserAvatar,
    subscribeToProfileUpdates
} from './userProfileService';
