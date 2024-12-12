// Initialize editor
const editor = document.getElementById('editor');

// Note and folder management
let currentNote = null;
let notes = [];
let folders = [];
let expandedFolders = new Set();

// Custom markdown renderer for note links
const renderer = {
    text(text) {
        // Replace [[note name]] with a link
        return text.replace(/\[\[([^\]]+)\]\]/g, (match, noteName) => {
            return `<button class="note-link" data-note="${noteName}">${noteName}</button>`;
        });
    }
};

marked.use({ renderer });

// Set up editor change listener
editor.addEventListener('input', debounce(() => {
    const content = editor.value;
    updatePreview(content);
    saveCurrentNote();
}, 500));

// Markdown preview
function updatePreview(content) {
    try {
        const preview = document.getElementById('preview');
        preview.innerHTML = marked.parse(content);
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

// Add global click handler for note links
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('note-link')) {
        e.preventDefault();
        const noteName = e.target.dataset.note;
        console.log('Note link clicked:', noteName);
        await navigateToNote(noteName);
    }
});

// Navigate to note by name
async function navigateToNote(noteName) {
    try {
        console.log('Navigating to note:', noteName);
        
        // Find the note by comparing titles
        const targetNote = notes.find(note => {
            const firstLine = note.content.split('\n')[0];
            const title = firstLine.replace(/^#\s+/, '').trim();
            return title.toLowerCase() === noteName.toLowerCase();
        });

        if (targetNote) {
            console.log('Found existing note:', targetNote);
            await loadNote(targetNote);
        } else {
            console.log('Creating new note:', noteName);
            // Create new note if it doesn't exist
            const newNote = {
                id: Date.now().toString(),
                content: `# ${noteName}\n\nStart writing here...`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Save the new note
            const savedNote = await window.electronAPI.saveNote(newNote);
            if (savedNote) {
                notes.push(savedNote);
                await loadNote(savedNote);
            }
        }
    } catch (error) {
        console.error('Error navigating to note:', error);
    }
}

async function loadNotes() {
    try {
        notes = await window.electronAPI.getNotes();
        folders = await window.electronAPI.getFolders();
        renderNotesTree();
        
        // If there are no notes, create a welcome note
        if (notes.length === 0) {
            const welcomeNote = {
                id: Date.now().toString(),
                content: '# Welcome to MyKMS\n\nThis is your first note. You can:\n\n- Create new notes using the + button\n- Create folders using the folder+ button\n- Link to other notes using [[note name]] syntax\n- Click on links to navigate between notes\n- Use the search bar to find notes\n- Delete notes using the trash icon\n- Drag and drop notes into folders\n\nTry creating a new note and linking to it from here!',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const savedWelcomeNote = await window.electronAPI.saveNote(welcomeNote);
            if (savedWelcomeNote) {
                notes.push(savedWelcomeNote);
                await loadNote(savedWelcomeNote);
            }
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

function renderNotesTree() {
    try {
        const notesTree = document.getElementById('notesTree');
        notesTree.innerHTML = '';
        
        // Add drop handler for root level
        notesTree.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notesTree.classList.add('drag-over');
        });
        
        notesTree.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notesTree.classList.remove('drag-over');
        });
        
        notesTree.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            notesTree.classList.remove('drag-over');
            const noteId = e.dataTransfer.getData('text/plain');
            // Move to root by setting folderId to null
            await moveNoteToFolder(noteId, null);
        });
        
        // Render root notes (notes without a folder)
        const rootNotes = notes.filter(note => !note.folderId);
        rootNotes.forEach(note => {
            notesTree.appendChild(createNoteElement(note));
        });
        
        // Render folders and their notes
        folders.forEach(folder => {
            const folderElement = createFolderElement(folder);
            notesTree.appendChild(folderElement);
        });
    } catch (error) {
        console.error('Error rendering notes tree:', error);
    }
}

function createFolderElement(folder) {
    try {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.dataset.folderId = folder.id;
        
        const isExpanded = expandedFolders.has(folder.id);
        
        // Create folder header
        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header';
        folderHeader.innerHTML = `
            <div class="folder-name">
                <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} folder-toggle"></i>
                <i class="fas fa-folder${isExpanded ? '-open' : ''}"></i>
                <span class="folder-title">${folder.name}</span>
                <input type="text" class="folder-rename-input" value="${folder.name}" style="display: none;">
            </div>
            <div class="folder-actions">
                <button class="delete-btn" title="Delete folder">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add double-click handler for renaming
        const folderTitle = folderHeader.querySelector('.folder-title');
        const renameInput = folderHeader.querySelector('.folder-rename-input');
        
        folderTitle.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderTitle.style.display = 'none';
            renameInput.style.display = 'inline-block';
            renameInput.focus();
            renameInput.select();
        });
        
        // Handle rename input
        renameInput.addEventListener('keyup', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newName = renameInput.value.trim();
                if (newName && newName !== folder.name) {
                    const updatedFolder = await window.electronAPI.renameFolder(folder.id, newName);
                    if (updatedFolder) {
                        Object.assign(folder, updatedFolder);
                        folderTitle.textContent = newName;
                    }
                }
                folderTitle.style.display = 'inline';
                renameInput.style.display = 'none';
            } else if (e.key === 'Escape') {
                renameInput.value = folder.name;
                folderTitle.style.display = 'inline';
                renameInput.style.display = 'none';
            }
        });
        
        renameInput.addEventListener('blur', () => {
            folderTitle.style.display = 'inline';
            renameInput.style.display = 'none';
            renameInput.value = folder.name;
        });
        
        // Create folder content
        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        folderContent.style.display = isExpanded ? 'block' : 'none';
        
        // Add folder notes
        const folderNotes = notes.filter(note => note.folderId === folder.id);
        folderNotes.forEach(note => {
            folderContent.appendChild(createNoteElement(note));
        });
        
        // Set up drag and drop for folder
        folderItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const draggingElement = document.querySelector('.dragging');
            if (draggingElement) {
                folderItem.classList.add('drag-over');
                // Auto-expand folder after a short delay
                if (!expandedFolders.has(folder.id)) {
                    clearTimeout(folderItem.expandTimeout);
                    folderItem.expandTimeout = setTimeout(() => {
                        toggleFolder(folder.id, true);
                    }, 500);
                }
            }
        });
        
        folderItem.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderItem.classList.remove('drag-over');
            // Cancel auto-expand if we leave before the timeout
            clearTimeout(folderItem.expandTimeout);
        });
        
        folderItem.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderItem.classList.remove('drag-over');
            const noteId = e.dataTransfer.getData('text/plain');
            if (noteId) {
                await moveNoteToFolder(noteId, folder.id);
            }
        });
        
        // Toggle folder expansion
        folderHeader.querySelector('.folder-toggle').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFolder(folder.id);
        });
        
        // Delete folder
        folderHeader.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteFolder(folder.id);
        });
        
        folderItem.appendChild(folderHeader);
        folderItem.appendChild(folderContent);
        return folderItem;
    } catch (error) {
        console.error('Error creating folder element:', error);
        return null;
    }
}

function createNoteElement(note) {
    try {
        const noteElement = document.createElement('div');
        noteElement.className = `note-item ${currentNote?.id === note.id ? 'active' : ''}`;
        noteElement.dataset.noteId = note.id;
        
        const firstLine = note.content.split('\n')[0];
        const title = firstLine.replace(/^#\s+/, '').trim();
        
        noteElement.innerHTML = `
            <div class="note-title">${title}</div>
            <div class="note-actions">
                <button class="delete-btn" title="Delete note">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Make note draggable
        noteElement.draggable = true;
        
        noteElement.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            noteElement.classList.add('dragging');
            e.dataTransfer.setData('text/plain', note.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        noteElement.addEventListener('dragend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            noteElement.classList.remove('dragging');
            // Remove drag-over class from all potential drop targets
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
        
        // Add click handlers
        noteElement.addEventListener('click', (e) => {
            // Don't trigger if clicking delete button
            if (!e.target.closest('.delete-btn')) {
                e.preventDefault();
                e.stopPropagation();
                loadNote(note);
            }
        });
        
        // Handle delete button click
        const deleteButton = noteElement.querySelector('.delete-btn');
        deleteButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteNote(note.id);
        };
        
        return noteElement;
    } catch (error) {
        console.error('Error creating note element:', error);
        return null;
    }
}

function toggleFolder(folderId, skipAnimation = false) {
    try {
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
        const content = folderElement.querySelector('.folder-content');
        const toggle = folderElement.querySelector('.folder-toggle');
        const folderIcon = folderElement.querySelector('.fa-folder, .fa-folder-open');
        
        if (expandedFolders.has(folderId)) {
            expandedFolders.delete(folderId);
            content.style.display = 'none';
            toggle.classList.replace('fa-chevron-down', 'fa-chevron-right');
            folderIcon.classList.replace('fa-folder-open', 'fa-folder');
        } else {
            expandedFolders.add(folderId);
            content.style.display = 'block';
            toggle.classList.replace('fa-chevron-right', 'fa-chevron-down');
            folderIcon.classList.replace('fa-folder', 'fa-folder-open');
        }
    } catch (error) {
        console.error('Error toggling folder:', error);
    }
}

async function moveNoteToFolder(noteId, folderId) {
    try {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const oldFolderId = note.folderId;
            if (oldFolderId === folderId) return; // Skip if note is already in this folder
            
            const updatedNote = await window.electronAPI.moveNote(noteId, folderId);
            if (updatedNote) {
                Object.assign(note, updatedNote);
                renderNotesTree();
            }
        }
    } catch (error) {
        console.error('Error moving note:', error);
    }
}

async function loadNote(note) {
    try {
        console.log('Loading note:', note);
        currentNote = note;
        editor.value = note.content;
        updatePreview(note.content);
        renderNotesTree();
    } catch (error) {
        console.error('Error loading note:', error);
    }
}

async function saveCurrentNote() {
    try {
        if (!currentNote) return;
        
        const content = editor.value;
        currentNote.content = content;
        currentNote.updatedAt = new Date().toISOString();
        
        const savedNote = await window.electronAPI.saveNote(currentNote);
        if (savedNote) {
            Object.assign(currentNote, savedNote);
            renderNotesTree();
        }
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

// Create new note
document.getElementById('newNoteBtn').addEventListener('click', async () => {
    try {
        const newNote = {
            id: Date.now().toString(),
            content: '# New Note\n\nStart writing here...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const savedNote = await window.electronAPI.saveNote(newNote);
        if (savedNote) {
            notes.push(savedNote);
            await loadNote(savedNote);
        }
    } catch (error) {
        console.error('Error creating note:', error);
    }
});

// Delete note
async function deleteNote(noteId) {
    try {
        if (confirm('Are you sure you want to delete this note?')) {
            const success = await window.electronAPI.deleteNote(noteId);
            if (success) {
                notes = notes.filter(note => note.id !== noteId);
                
                if (currentNote?.id === noteId) {
                    currentNote = null;
                    editor.value = '';
                    updatePreview('');
                }
                
                renderNotesTree();
            }
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

// Folder management
document.getElementById('newFolderBtn').addEventListener('click', () => {
    document.getElementById('newFolderModal').classList.add('active');
});

document.getElementById('createFolder').addEventListener('click', async () => {
    try {
        const folderName = document.getElementById('folderName').value.trim();
        if (folderName) {
            const newFolder = await window.electronAPI.createFolder(folderName);
            if (newFolder) {
                folders.push(newFolder);
                expandedFolders.add(newFolder.id);
                renderNotesTree();
                document.getElementById('folderName').value = '';
                document.getElementById('newFolderModal').classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error creating folder:', error);
    }
});

document.getElementById('cancelFolder').addEventListener('click', () => {
    document.getElementById('folderName').value = '';
    document.getElementById('newFolderModal').classList.remove('active');
});

async function deleteFolder(folderId) {
    try {
        if (confirm('Are you sure you want to delete this folder? Notes will be moved to root.')) {
            const success = await window.electronAPI.deleteFolder(folderId);
            if (success) {
                folders = folders.filter(folder => folder.id !== folderId);
                expandedFolders.delete(folderId);
                
                // Update notes that were in this folder
                notes.forEach(note => {
                    if (note.folderId === folderId) {
                        delete note.folderId;
                    }
                });
                
                renderNotesTree();
            }
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
    }
}

// Search functionality
const searchInput = document.getElementById('searchNotes');
searchInput.addEventListener('input', debounce((e) => {
    try {
        const searchTerm = e.target.value.toLowerCase();
        const filteredNotes = notes.filter(note => {
            const firstLine = note.content.split('\n')[0];
            const title = firstLine.replace(/^#\s+/, '').trim();
            return title.toLowerCase().includes(searchTerm) || 
                   note.content.toLowerCase().includes(searchTerm);
        });
        renderFilteredNotes(filteredNotes);
    } catch (error) {
        console.error('Error searching notes:', error);
    }
}, 300));

function renderFilteredNotes(filteredNotes) {
    try {
        const notesTree = document.getElementById('notesTree');
        notesTree.innerHTML = '';
        
        filteredNotes.forEach(note => {
            const noteElement = createNoteElement(note);
            
            // If note is in a folder, show folder structure
            if (note.folderId) {
                const folder = folders.find(f => f.id === note.folderId);
                if (folder) {
                    const folderElement = createFolderElement(folder);
                    folderElement.querySelector('.folder-content').appendChild(noteElement);
                    notesTree.appendChild(folderElement);
                }
            } else {
                notesTree.appendChild(noteElement);
            }
        });
    } catch (error) {
        console.error('Error rendering filtered notes:', error);
    }
}

// Theme management
let currentTheme = {};

async function loadTheme() {
    try {
        currentTheme = await window.electronAPI.getTheme();
        applyTheme(currentTheme);
    } catch (error) {
        console.error('Error loading theme:', error);
    }
}

function applyTheme(theme) {
    try {
        const root = document.documentElement;
        root.style.setProperty('--font-family', theme.fontFamily);
        root.style.setProperty('--font-size', theme.fontSize);
        root.style.setProperty('--background-color', theme.backgroundColor);
        root.style.setProperty('--text-color', theme.textColor);
        root.style.setProperty('--accent-color', theme.accentColor);
        
        editor.style.fontSize = theme.fontSize;
        editor.style.fontFamily = theme.fontFamily;
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

// Settings modal
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    populateSettingsForm();
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

async function populateSettingsForm() {
    try {
        // Load theme settings
        document.getElementById('fontFamily').value = currentTheme.fontFamily;
        document.getElementById('fontSize').value = parseInt(currentTheme.fontSize);
        document.getElementById('backgroundColor').value = currentTheme.backgroundColor;
        document.getElementById('textColor').value = currentTheme.textColor;
        document.getElementById('accentColor').value = currentTheme.accentColor;

        // Load GitHub settings
        const token = await window.electronAPI.getGithubToken();
        const repo = await window.electronAPI.getGithubRepo();
        document.getElementById('githubToken').value = token || '';
        document.getElementById('repoName').value = repo || '';
    } catch (error) {
        console.error('Error populating settings form:', error);
    }
}

saveSettings.addEventListener('click', async () => {
    try {
        // Save theme settings
        const newTheme = {
            fontFamily: document.getElementById('fontFamily').value,
            fontSize: document.getElementById('fontSize').value + 'px',
            backgroundColor: document.getElementById('backgroundColor').value,
            textColor: document.getElementById('textColor').value,
            accentColor: document.getElementById('accentColor').value
        };
        
        const success = await window.electronAPI.setTheme(newTheme);
        if (success) {
            currentTheme = newTheme;
            applyTheme(newTheme);
        }

        // Save GitHub settings
        const token = document.getElementById('githubToken').value.trim();
        const repo = document.getElementById('repoName').value.trim();
        
        if (token && repo) {
            if (!/^[^/]+\/[^/]+$/.test(repo)) {
                alert('Repository should be in the format "username/repository"');
                return;
            }
            await window.electronAPI.githubAuth(token, repo);
        }

        settingsModal.classList.remove('active');
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings: ' + error.message);
    }
});

// GitHub sync
document.getElementById('syncGithubBtn').addEventListener('click', async () => {
    try {
        const token = await window.electronAPI.getGithubToken();
        const repo = await window.electronAPI.getGithubRepo();
        
        if (!token || !repo) {
            alert('Please configure GitHub settings first');
            settingsModal.classList.add('active');
            return;
        }

        // Try to sync
        const syncSuccess = await window.electronAPI.syncToGithub();
        if (syncSuccess) {
            alert('Successfully synced with GitHub!');
        } else {
            alert('Failed to sync with GitHub. Please check the repository permissions and try again.');
        }
    } catch (error) {
        console.error('Error syncing with GitHub:', error);
        alert('Failed to sync with GitHub: ' + error.message);
    }
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadTheme();
        await loadNotes();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});
