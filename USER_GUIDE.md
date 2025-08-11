# Professional PDF Editor - Premium Edition

## 🚀 Quick Start

1. **First Time Setup**: Double-click `run-app.bat`
   - The script will automatically install dependencies and build the app
   - This may take a few minutes on first run

2. **Regular Use**: Just double-click `run-app.bat`
   - The app will start immediately if already built

## ✨ Premium Features

### Core Functionality
- ✅ **Open & Save PDFs** - Full support for all PDF versions
- ✅ **Page Management** - Insert, delete, rotate, reorder pages
- ✅ **Merge & Split** - Combine multiple PDFs or split into parts
- ✅ **Annotations** - Add text, highlights, drawings, shapes
- ✅ **Digital Signatures** - Sign documents electronically
- ✅ **OCR** - Extract text from scanned documents
- ✅ **Security** - Password protection and encryption
- ✅ **Forms** - Create and fill PDF forms
- ✅ **Compression** - Reduce file size while maintaining quality

### Advanced Tools
- 🎨 **Drawing Tools** - Freehand drawing, shapes, arrows
- 🔍 **Search & Replace** - Find and replace text across pages
- 📝 **Text Editing** - Direct text modification
- 🖼️ **Image Management** - Insert, extract, compress images
- 📊 **Export Options** - Convert to Word, images, text
- 🔐 **Redaction** - Permanently remove sensitive content
- 💧 **Watermarks** - Add custom watermarks
- 📖 **Bookmarks** - Create navigation bookmarks

## 🛠️ Troubleshooting

If you encounter any issues:

1. **Run Repair Tool**: Double-click `repair-tool.bat`
   - Choose option 1 for Quick Fix
   - Choose option 2 for Deep Clean if Quick Fix doesn't work

2. **Common Issues & Solutions**:

   **App won't start:**
   - Run `repair-tool.bat` and select "Deep Clean"
   - Make sure Node.js is installed
   - Try running as Administrator

   **PDF won't open:**
   - Check if the PDF is corrupted
   - Try a different PDF file
   - Make sure the file isn't password protected

   **Features not working:**
   - Clear cache: Run repair tool option 2
   - Update dependencies: Run repair tool option 3

## 📋 System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space
- **Node.js**: Version 14.0 or higher
- **Display**: 1280x720 minimum resolution

## 🎮 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open PDF | Ctrl+O |
| Save | Ctrl+S |
| Save As | Ctrl+Shift+S |
| Print | Ctrl+P |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Find | Ctrl+F |
| Zoom In | Ctrl+Plus |
| Zoom Out | Ctrl+Minus |
| Reset Zoom | Ctrl+0 |
| Next Page | Page Down / → |
| Previous Page | Page Up / ← |
| First Page | Home |
| Last Page | End |
| Rotate Left | Ctrl+L |
| Rotate Right | Ctrl+R |
| Full Screen | F11 |

## 🔧 Advanced Configuration

### Development Mode
To run in development mode with hot reload:
```bash
npm run dev
```

### Build Installer
To create a Windows installer:
```bash
npm run dist
```

### Custom Settings
Edit preferences in Settings menu or modify:
- Theme: Dark/Light mode
- Auto-save interval
- Default zoom level
- Thumbnail visibility
- Highlight colors
- Default fonts

## 📦 File Structure

```
PDF Editor/
├── src/                 # Source code
│   ├── main/           # Main process (Electron)
│   ├── renderer/       # Renderer process (React)
│   └── types/          # TypeScript definitions
├── dist/               # Built application
├── public/             # Static assets
├── run-app.bat         # Main launcher
├── build-app.bat       # Build script
├── repair-tool.bat     # Troubleshooting utility
└── package.json        # Project configuration
```

## 🔒 Security & Privacy

- All processing is done locally - no cloud uploads
- Passwords are encrypted using industry standards
- Digital signatures use cryptographic verification
- Redacted content is permanently removed
- No telemetry or usage tracking

## 💡 Tips & Tricks

1. **Batch Operations**: Select multiple pages with Ctrl+Click
2. **Quick Annotations**: Use toolbar shortcuts for faster editing
3. **Template Save**: Save frequently used forms as templates
4. **Drag & Drop**: Drag PDFs directly into the app to open
5. **Recent Files**: Access recent documents from File menu
6. **Auto-Save**: Enable auto-save in settings for peace of mind
7. **Keyboard Navigation**: Use Tab to navigate form fields

## 🐛 Known Issues

- Large PDFs (>100MB) may take time to load
- Some complex forms might not render perfectly
- OCR accuracy depends on scan quality

## 📞 Support

For issues not covered here:
1. Check the error logs in the console (Ctrl+Shift+I)
2. Run the repair tool's system check (option 6)
3. Try the Deep Clean option in repair tool

## 🎯 Performance Tips

- Close unused PDFs to free memory
- Use compression for large files
- Disable thumbnails for better performance
- Lower preview quality in settings if needed

## 🔄 Updates

The app checks for updates automatically. You can also:
- Check manually: Help → Check for Updates
- Auto-update: Enable in Settings

---

**Version**: 1.0.0  
**Build**: Premium Edition  
**Framework**: Electron + React + TypeScript  
**Engine**: PDF.js + pdf-lib

---

© 2024 Professional PDF Editor - Built with the Transithesis Framework
