// ... (previous code remains the same until createFolderElement function)

function createFolderElement(folder) {
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
            ${folder.name}
        </div>
        <div class="folder-actions">
            <button class="delete-btn" title="Delete folder">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Create folder content
    const folderContent = document.createElement('div');
    folderContent.className = 'folder-content';
    folderContent.style.display = isExpanded ? 'block' : 'none';
    
    // Add folder notes
    const folderNotes = notes.filter(note => note.folderId === folder.id);
    folderNotes.forEach(note => {
        folderContent.appendChild(createNoteElement(note));
    });
    
    // Set up drag and drop for entire folder item
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
}

function createNoteElement(note) {
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
    
    // Make entire note clickable
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
}

function toggleFolder(folderId, skipAnimation = false) {
    const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
    const content = folderElement.querySelector('.folder-content');
    const toggle = folderElement.querySelector('.folder-toggle');
    const folderIcon = folderElement.querySelector('.fa-folder, .fa-folder-open');
    
    if (expandedFolders.has(folderId)) {
        expandedFolders.delete(folderId);
        if (skipAnimation) {
            content.style.display = 'none';
        } else {
            content.style.maxHeight = '0';
            setTimeout(() => {
                content.style.display = 'none';
            }, 200);
        }
        toggle.classList.replace('fa-chevron-down', 'fa-chevron-right');
        folderIcon.classList.replace('fa-folder-open', 'fa-folder');
    } else {
        expandedFolders.add(folderId);
        content.style.display = 'block';
        if (!skipAnimation) {
            content.style.maxHeight = content.scrollHeight + 'px';
        }
        toggle.classList.replace('fa-chevron-right', 'fa-chevron-down');
        folderIcon.classList.replace('fa-folder', 'fa-folder-open');
    }
}

// ... (rest of the code remains the same)
