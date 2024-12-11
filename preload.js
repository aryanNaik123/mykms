const { contextBridge, ipcRenderer } = require('electron');

console.log('Initializing preload script...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI', {
        // Theme management
        getTheme: async () => {
            try {
                console.log('Getting theme...');
                const theme = await ipcRenderer.invoke('get-theme');
                console.log('Theme retrieved:', theme);
                return theme;
            } catch (error) {
                console.error('Error getting theme:', error);
                return null;
            }
        },
        setTheme: async (theme) => {
            try {
                console.log('Setting theme:', theme);
                return await ipcRenderer.invoke('set-theme', theme);
            } catch (error) {
                console.error('Error setting theme:', error);
                return false;
            }
        },
        
        // Folder management
        createFolder: async (folderName) => {
            try {
                console.log('Creating folder:', folderName);
                return await ipcRenderer.invoke('create-folder', folderName);
            } catch (error) {
                console.error('Error creating folder:', error);
                return null;
            }
        },
        getFolders: async () => {
            try {
                console.log('Getting folders...');
                const folders = await ipcRenderer.invoke('get-folders');
                console.log('Folders retrieved:', folders);
                return folders;
            } catch (error) {
                console.error('Error getting folders:', error);
                return [];
            }
        },
        renameFolder: async (folderId, newName) => {
            try {
                console.log('Renaming folder:', folderId, 'to', newName);
                return await ipcRenderer.invoke('rename-folder', { folderId, newName });
            } catch (error) {
                console.error('Error renaming folder:', error);
                return null;
            }
        },
        deleteFolder: async (folderId) => {
            try {
                console.log('Deleting folder:', folderId);
                return await ipcRenderer.invoke('delete-folder', folderId);
            } catch (error) {
                console.error('Error deleting folder:', error);
                return false;
            }
        },
        
        // Note management
        saveNote: async (note) => {
            try {
                console.log('Saving note:', note.id);
                return await ipcRenderer.invoke('save-note', note);
            } catch (error) {
                console.error('Error saving note:', error);
                return null;
            }
        },
        getNotes: async () => {
            try {
                console.log('Getting notes...');
                const notes = await ipcRenderer.invoke('get-notes');
                console.log('Notes retrieved:', notes);
                return notes;
            } catch (error) {
                console.error('Error getting notes:', error);
                return [];
            }
        },
        deleteNote: async (noteId) => {
            try {
                console.log('Deleting note:', noteId);
                return await ipcRenderer.invoke('delete-note', noteId);
            } catch (error) {
                console.error('Error deleting note:', error);
                return false;
            }
        },
        moveNote: async (noteId, folderId) => {
            try {
                console.log('Moving note:', noteId, 'to folder:', folderId);
                return await ipcRenderer.invoke('move-note', { noteId, folderId });
            } catch (error) {
                console.error('Error moving note:', error);
                return null;
            }
        },
        
        // GitHub integration
        githubAuth: async (token) => {
            try {
                console.log('Setting GitHub token...');
                return await ipcRenderer.invoke('github-auth', token);
            } catch (error) {
                console.error('Error setting GitHub token:', error);
                return false;
            }
        },
        syncToGithub: async () => {
            try {
                console.log('Syncing to GitHub...');
                return await ipcRenderer.invoke('sync-to-github');
            } catch (error) {
                console.error('Error syncing to GitHub:', error);
                return false;
            }
        }
    }
);

console.log('Preload script initialized');
