const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { Octokit } = require('@octokit/rest');

console.log('Starting application...');

// Configure electron store
Store.initRenderer();

const store = new Store({
    name: 'mykms-data',
    fileExtension: 'json',
    clearInvalidConfig: true,
    defaults: {
        theme: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            backgroundColor: '#faf6f1',
            textColor: '#333333',
            accentColor: '#00c805'
        },
        notes: [],
        folders: [],
        'github.token': '',
        'github.repo': '',
        'github.lastSync': null
    }
});

console.log('Store initialized with path:', store.path);

let mainWindow = null;
let octokit = null;

// Initialize GitHub client if token exists
const token = store.get('github.token');
if (token) {
    octokit = new Octokit({ auth: token });
}

function createWindow() {
    try {
        console.log('Creating main window...');
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            backgroundColor: '#faf6f1'
        });

        // Load the index.html file
        console.log('Loading index.html...');
        mainWindow.loadFile('index.html');

        // Open DevTools in development
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }

        // Handle window close
        mainWindow.on('closed', () => {
            console.log('Window closed');
            mainWindow = null;
        });

        // Handle window errors
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Window failed to load:', errorCode, errorDescription);
        });

        console.log('Main window created successfully');
    } catch (error) {
        console.error('Error creating window:', error);
    }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    console.log('App ready, creating window...');
    createWindow();

    app.on('activate', () => {
        console.log('App activated');
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}).catch(error => {
    console.error('Error during app initialization:', error);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle theme settings
ipcMain.handle('get-theme', () => {
    try {
        console.log('Getting theme...');
        return store.get('theme');
    } catch (error) {
        console.error('Error getting theme:', error);
        return null;
    }
});

ipcMain.handle('set-theme', (event, theme) => {
    try {
        console.log('Setting theme:', theme);
        store.set('theme', theme);
        return true;
    } catch (error) {
        console.error('Error setting theme:', error);
        return false;
    }
});

// Handle folders
ipcMain.handle('create-folder', (event, folderName) => {
    try {
        console.log('Creating folder:', folderName);
        const folders = store.get('folders', []);
        const newFolder = {
            id: Date.now().toString(),
            name: folderName,
            createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        store.set('folders', folders);
        return newFolder;
    } catch (error) {
        console.error('Error creating folder:', error);
        return null;
    }
});

ipcMain.handle('get-folders', () => {
    try {
        console.log('Getting folders...');
        return store.get('folders', []);
    } catch (error) {
        console.error('Error getting folders:', error);
        return [];
    }
});

ipcMain.handle('rename-folder', (event, { folderId, newName }) => {
    try {
        console.log('Renaming folder:', folderId, 'to', newName);
        const folders = store.get('folders', []);
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            folder.name = newName;
            store.set('folders', folders);
        }
        return folder;
    } catch (error) {
        console.error('Error renaming folder:', error);
        return null;
    }
});

ipcMain.handle('delete-folder', (event, folderId) => {
    try {
        console.log('Deleting folder:', folderId);
        const folders = store.get('folders', []);
        const notes = store.get('notes', []);
        
        // Remove folder
        const filteredFolders = folders.filter(f => f.id !== folderId);
        store.set('folders', filteredFolders);
        
        // Move notes from deleted folder to root
        const updatedNotes = notes.map(note => {
            if (note.folderId === folderId) {
                delete note.folderId;
            }
            return note;
        });
        store.set('notes', updatedNotes);
        
        return true;
    } catch (error) {
        console.error('Error deleting folder:', error);
        return false;
    }
});

// Handle notes
ipcMain.handle('save-note', (event, note) => {
    try {
        console.log('Saving note:', note.id);
        const notes = store.get('notes', []);
        const existingNoteIndex = notes.findIndex(n => n.id === note.id);
        
        if (existingNoteIndex >= 0) {
            notes[existingNoteIndex] = note;
        } else {
            notes.push(note);
        }
        
        store.set('notes', notes);
        return note;
    } catch (error) {
        console.error('Error saving note:', error);
        return null;
    }
});

ipcMain.handle('get-notes', () => {
    try {
        console.log('Getting notes...');
        return store.get('notes', []);
    } catch (error) {
        console.error('Error getting notes:', error);
        return [];
    }
});

ipcMain.handle('delete-note', (event, noteId) => {
    try {
        console.log('Deleting note:', noteId);
        const notes = store.get('notes', []);
        const filteredNotes = notes.filter(note => note.id !== noteId);
        store.set('notes', filteredNotes);
        return true;
    } catch (error) {
        console.error('Error deleting note:', error);
        return false;
    }
});

ipcMain.handle('move-note', (event, { noteId, folderId }) => {
    try {
        console.log('Moving note:', noteId, 'to folder:', folderId);
        const notes = store.get('notes', []);
        const note = notes.find(n => n.id === noteId);
        if (note) {
            if (folderId) {
                note.folderId = folderId;
            } else {
                delete note.folderId;
            }
            store.set('notes', notes);
        }
        return note;
    } catch (error) {
        console.error('Error moving note:', error);
        return null;
    }
});

// Handle GitHub integration
ipcMain.handle('github-auth', async (event, { token, repo }) => {
    try {
        console.log('Setting up GitHub integration...');
        
        // Validate token by making a test API call
        const testOctokit = new Octokit({ auth: token });
        await testOctokit.users.getAuthenticated();
        
        // Store token and repo info
        store.set('github.token', token);
        store.set('github.repo', repo);
        
        // Initialize Octokit with new token
        octokit = testOctokit;
        
        return true;
    } catch (error) {
        console.error('Error setting up GitHub:', error);
        return false;
    }
});

ipcMain.handle('get-github-token', () => {
    try {
        return store.get('github.token', '');
    } catch (error) {
        console.error('Error getting GitHub token:', error);
        return '';
    }
});

ipcMain.handle('get-github-repo', () => {
    try {
        return store.get('github.repo', '');
    } catch (error) {
        console.error('Error getting GitHub repo:', error);
        return '';
    }
});

ipcMain.handle('sync-to-github', async () => {
    try {
        console.log('Syncing to GitHub...');
        
        if (!octokit) {
            throw new Error('GitHub not configured');
        }
        
        const repo = store.get('github.repo');
        if (!repo) {
            throw new Error('GitHub repository not configured');
        }
        
        const [owner, repoName] = repo.split('/');
        
        // Get current data
        const notes = store.get('notes', []);
        const folders = store.get('folders', []);
        const lastSync = store.get('github.lastSync');
        
        // Create backup data
        const backupData = {
            notes,
            folders,
            lastSync: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Convert to base64
        const content = Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64');
        
        try {
            // Try to get the file first
            const { data: existingFile } = await octokit.repos.getContent({
                owner,
                repo: repoName,
                path: 'mykms-backup.json'
            });
            
            // Update existing file
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'mykms-backup.json',
                message: 'Update MyKMS backup',
                content,
                sha: existingFile.sha
            });
        } catch (error) {
            if (error.status === 404) {
                // File doesn't exist, create it
                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo: repoName,
                    path: 'mykms-backup.json',
                    message: 'Initial MyKMS backup',
                    content
                });
            } else {
                throw error;
            }
        }
        
        // Update last sync time
        store.set('github.lastSync', backupData.lastSync);
        
        return true;
    } catch (error) {
        console.error('Error syncing to GitHub:', error);
        return false;
    }
});
