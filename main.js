const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

console.log('Starting application...');

// Enable electron-store migrations
Store.initRenderer();

// Initialize store with schema
console.log('Initializing electron-store...');
const store = new Store();
console.log('Electron-store initialized');

// Set default theme if not exists
if (!store.has('theme')) {
    console.log('Setting default theme...');
    store.set('theme', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        backgroundColor: '#faf6f1',
        textColor: '#333333',
        accentColor: '#00c805'
    });
}

let mainWindow = null;

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
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            backgroundColor: '#faf6f1'
        });

        // Load the index.html file
        console.log('Loading index.html...');
        mainWindow.loadFile('index.html');

        // Open DevTools in development
        mainWindow.webContents.openDevTools();

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
ipcMain.handle('github-auth', (event, token) => {
    try {
        console.log('Setting GitHub token...');
        store.set('github.token', token);
        return true;
    } catch (error) {
        console.error('Error setting GitHub token:', error);
        return false;
    }
});

ipcMain.handle('sync-to-github', async () => {
    try {
        console.log('Syncing to GitHub...');
        // GitHub sync implementation would go here
        return true;
    } catch (error) {
        console.error('Error syncing to GitHub:', error);
        return false;
    }
});
