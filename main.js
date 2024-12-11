const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let store;
(async () => {
    const Store = (await import('electron-store')).default;
    store = new Store();
})();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle theme settings
ipcMain.handle('get-theme', () => {
    return store.get('theme', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        backgroundColor: '#faf6f1',
        textColor: '#333333',
        accentColor: '#00c805'
    });
});

ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
    return true;
});

// Handle folders
ipcMain.handle('create-folder', (event, folderName) => {
    const folders = store.get('folders', []);
    const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        createdAt: new Date().toISOString()
    };
    folders.push(newFolder);
    store.set('folders', folders);
    return newFolder;
});

ipcMain.handle('get-folders', () => {
    return store.get('folders', []);
});

ipcMain.handle('rename-folder', (event, { folderId, newName }) => {
    const folders = store.get('folders', []);
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
        folder.name = newName;
        store.set('folders', folders);
    }
    return folder;
});

ipcMain.handle('delete-folder', (event, folderId) => {
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
});

// Handle notes
ipcMain.handle('save-note', (event, note) => {
    const notes = store.get('notes', []);
    const existingNoteIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingNoteIndex >= 0) {
        notes[existingNoteIndex] = note;
    } else {
        notes.push(note);
    }
    
    store.set('notes', notes);
    return note;
});

ipcMain.handle('get-notes', () => {
    return store.get('notes', []);
});

ipcMain.handle('delete-note', (event, noteId) => {
    const notes = store.get('notes', []);
    const filteredNotes = notes.filter(note => note.id !== noteId);
    store.set('notes', filteredNotes);
    return true;
});

ipcMain.handle('move-note', (event, { noteId, folderId }) => {
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
});

// Handle GitHub integration
ipcMain.handle('github-auth', (event, token) => {
    store.set('github.token', token);
    return true;
});

ipcMain.handle('sync-to-github', async () => {
    // GitHub sync implementation would go here
    return true;
});
