# Professional PDF Editor

A comprehensive, professional-grade PDF editor built with Electron, React, and TypeScript. This desktop application provides advanced PDF manipulation capabilities with a modern, intuitive interface.

## 🌟 Features

### Core PDF Operations
- **Open & Save** - Support for all PDF versions
- **Page Management** - Insert, delete, rotate, extract pages
- **Merge & Split** - Combine multiple PDFs or split into separate files
- **Compression** - Optimize PDF file size without quality loss

### Advanced Editing
- **Text Editing** - Add, modify, and format text
- **Annotations** - Highlights, notes, comments, stamps
- **Drawing Tools** - Freehand drawing, shapes, arrows
- **Forms** - Create and fill interactive PDF forms
- **Digital Signatures** - Sign documents digitally
- **OCR** - Extract text from scanned documents

### Security Features
- **Encryption** - Password protect PDFs
- **Permissions** - Control printing, copying, editing rights
- **Redaction** - Permanently remove sensitive content
- **Digital Certificates** - Verify document authenticity

### Professional Tools
- **Batch Processing** - Process multiple PDFs simultaneously
- **Watermarks** - Add text or image watermarks
- **Headers/Footers** - Add page numbers and document info
- **Bookmarks** - Create navigational bookmarks
- **Search & Replace** - Find and replace text across documents

### User Experience
- **Dark/Light Themes** - Multiple theme options
- **Keyboard Shortcuts** - Comprehensive hotkey support
- **Auto-Save** - Never lose your work
- **Recent Files** - Quick access to recent documents
- **Multi-language** - OCR support for multiple languages

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Windows 10/11, macOS 10.14+, or Linux

### Installation

1. **Clone or navigate to the project directory:**
```bash
cd "C:\Users\Admin\Documents\RST\PDF Editor"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the application:**
```bash
npm run build
```

4. **Start the application:**
```bash
npm start
```

### Development Mode

For development with hot-reload:
```bash
npm run dev
```

## 📦 Building for Distribution

### Windows
```bash
npm run dist
```
This creates an installer in the `release` folder.

### macOS
```bash
npm run dist -- --mac
```

### Linux
```bash
npm run dist -- --linux
```

## 🎯 Usage Guide

### Opening a PDF
1. Click **File → Open** or press `Ctrl+O`
2. Select your PDF file
3. The document will load in the main viewer

### Basic Editing
- **Add Text**: Select the Text tool and click where you want to add text
- **Highlight**: Select the Highlight tool and drag over text
- **Draw**: Select the Draw tool for freehand annotations
- **Shapes**: Add rectangles, circles, and lines

### Page Operations
- **Insert Page**: Document → Insert Page
- **Delete Page**: Document → Delete Page
- **Rotate**: View → Rotate Left/Right
- **Extract**: Document → Extract Pages

### Saving Your Work
- **Save**: `Ctrl+S` to save changes
- **Save As**: `Ctrl+Shift+S` to save with a new name
- **Export**: File → Export for different formats

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Open | Ctrl+O | Cmd+O |
| Save | Ctrl+S | Cmd+S |
| Save As | Ctrl+Shift+S | Cmd+Shift+S |
| Print | Ctrl+P | Cmd+P |
| Undo | Ctrl+Z | Cmd+Z |
| Redo | Ctrl+Y | Cmd+Y |
| Find | Ctrl+F | Cmd+F |
| Zoom In | Ctrl++ | Cmd++ |
| Zoom Out | Ctrl+- | Cmd+- |
| Actual Size | Ctrl+0 | Cmd+0 |
| Full Screen | F11 | Ctrl+Cmd+F |

## 🛠️ Configuration

### Preferences
Access preferences through **File → Preferences** or the settings icon.

- **Theme**: Choose between light, dark, and high-contrast themes
- **Auto-save**: Configure auto-save interval
- **Default zoom**: Set default zoom level
- **Language**: Select UI and OCR language

### Advanced Settings
Edit `config.json` in the application data folder:
- Windows: `%APPDATA%\professional-pdf-editor`
- macOS: `~/Library/Application Support/professional-pdf-editor`
- Linux: `~/.config/professional-pdf-editor`

## 🐛 Troubleshooting

### Common Issues

**PDF won't open:**
- Ensure the file isn't corrupted
- Check if the PDF is password-protected
- Try opening in Safe Mode (hold Shift while starting)

**OCR not working:**
- Download language data files
- Ensure sufficient memory available
- Check image quality (300 DPI recommended)

**Performance issues:**
- Reduce zoom level for large documents
- Close unnecessary thumbnails panel
- Enable hardware acceleration in settings

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📧 Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Email: support@pdfeditor.com
- Documentation: https://docs.pdfeditor.com

## 🔄 Updates

The application checks for updates automatically. You can also manually check via **Help → Check for Updates**.

## 🏗️ Architecture

### Tech Stack
- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **PDF.js**: PDF rendering
- **pdf-lib**: PDF manipulation
- **Tesseract.js**: OCR functionality
- **Webpack**: Module bundling

### Project Structure
```
PDF Editor/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React application
│   │   ├── components/ # UI components
│   │   ├── services/   # Business logic
│   │   ├── styles/     # CSS styles
│   │   └── utils/      # Utilities
│   └── shared/         # Shared types/constants
├── public/             # Static assets
├── dist/              # Compiled output
└── release/           # Distribution packages
```

## 🎨 Customization

### Creating Custom Themes
1. Copy an existing theme from `src/renderer/styles/themes.css`
2. Modify color variables
3. Add theme class to theme selector

### Adding Custom Stamps
1. Place stamp images in `public/stamps/`
2. Register in `src/renderer/services/StampService.ts`
3. Stamps appear in the Stamp tool menu

### Custom Keyboard Shortcuts
Edit `src/main/shortcuts.json` to customize keyboard shortcuts.

## ⚡ Performance Tips

- **Large PDFs**: Enable streaming mode for files over 10MB
- **Batch Operations**: Use queue mode for processing multiple files
- **Memory**: Allocate more memory via `--max-old-space-size=4096`
- **GPU**: Enable GPU acceleration for better rendering performance

## 🔒 Security Notes

- All PDFs are processed locally - no cloud uploads
- Encryption uses industry-standard AES-256
- Digital signatures comply with PDF standards
- Redacted content is permanently removed

---

Built with ❤️ using cutting-edge web technologies. Professional PDF Editor - Your complete PDF solution.
