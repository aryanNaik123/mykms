# MyKMS - Knowledge Management System

A desktop note-taking application built with Electron that allows you to create, organize, and link notes together, similar to Obsidian.

## Features

- **Markdown Support**: Write notes using Markdown syntax
- **Note Linking**: Create links between notes using `[[note name]]` syntax
- **Folder Organization**: 
  - Create folders to organize your notes
  - Drag and drop notes into folders
  - Auto-expanding folders when dragging notes
- **Real-time Preview**: See your markdown rendered in real-time
- **Search**: Quick search through all your notes
- **Theme Customization**: 
  - Customize font family and size
  - Change colors and appearance
  - Light/dark mode support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/aryanNaik123/mykms.git
```

2. Install dependencies:
```bash
cd mykms
npm install
```

3. Run the application:
```bash
npm start
```

## Usage

### Creating Notes
- Click the '+' button to create a new note
- Start writing in Markdown
- Notes are automatically saved as you type

### Organizing Notes
- Click the folder+ button to create new folders
- Drag and drop notes into folders
- Hover over a folder while dragging to auto-expand it
- Click folder icons to expand/collapse

### Linking Notes
- Use `[[note name]]` syntax to create links between notes
- Click on links to navigate between notes
- Auto-completion suggestions appear as you type `[[`

### Searching
- Use the search bar to find notes
- Search works across note titles and content
- Results update in real-time as you type

## Technologies Used

- Electron
- Monaco Editor
- Marked (for Markdown rendering)
- Font Awesome (for icons)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
