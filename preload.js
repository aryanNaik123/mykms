const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI', {
        // Theme management
        getTheme: () => ipcRenderer.invoke('get-theme'),
        setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
        
        // Folder management
        createFolder: (folderName) => ipcRenderer.invoke('create-folder', folderName),
        getFolders: () => ipcRenderer.invoke('get-folders'),
        renameFolder: (folderId, newName) => ipcRenderer.invoke('rename-folder', { folderId, newName }),
        deleteFolder: (folderId) => ipcRenderer.invoke('delete-folder', folderId),
        
        // Note management
        saveNote: (note) => ipcRenderer.invoke('save-note', note),
        getNotes: () => ipcRenderer.invoke('get-notes'),
        deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
        moveNote: (noteId, folderId) => ipcRenderer.invoke('move-note', { noteId, folderId }),
        
        // GitHub integration
        githubAuth: (token, repo) => ipcRenderer.invoke('github-auth', { token, repo }),
        syncToGithub: () => ipcRenderer.invoke('sync-to-github'),
        getGithubToken: () => ipcRenderer.invoke('get-github-token'),
        getGithubRepo: () => ipcRenderer.invoke('get-github-repo')
    }
);
