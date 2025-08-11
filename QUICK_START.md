# 🚀 QUICK START GUIDE

## Professional PDF Editor - Get Started in 3 Minutes!

### Prerequisites
Before starting, ensure you have **Node.js** installed (version 18 or higher).
- Download from: https://nodejs.org/ (choose LTS version)
- After installation, restart your terminal/command prompt

### Option 1: Automatic Setup (Recommended) 🎯

1. **Double-click `setup.bat`** in the project folder
   - This will automatically install all dependencies and build the application
   - Wait for "Build completed successfully!" message

2. **Start the application:**
   - Double-click `start.bat` to run the PDF Editor

### Option 2: Manual Setup 💻

1. **Open Command Prompt or PowerShell** in the project folder:
   ```
   cd "C:\Users\Admin\Documents\RST\PDF Editor"
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Build the application:**
   ```
   npm run build
   ```

4. **Start the application:**
   ```
   npm start
   ```

### Option 3: Development Mode 🔧

For developers who want hot-reload and debugging:

1. **Run setup first** (if not done already):
   ```
   npm install
   ```

2. **Start development server:**
   ```
   npm run dev
   ```
   Or double-click `start-dev.bat`

3. **The app will open automatically** with live-reload enabled

### Creating an Installer 📦

To create a Windows installer (.exe):

1. **Build for distribution:**
   ```
   npm run dist
   ```
   Or double-click `build.bat`

2. **Find the installer** in the `release` folder

### Troubleshooting 🔍

**"Node is not recognized" error:**
- Install Node.js from https://nodejs.org/
- Restart your command prompt after installation

**"npm install" fails:**
- Check your internet connection
- Try running Command Prompt as Administrator
- Clear npm cache: `npm cache clean --force`

**Application won't start:**
- Make sure port 3000 is not in use
- Check Windows Defender/Antivirus isn't blocking the app
- Try rebuilding: `npm run build`

**Build errors:**
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again
- Ensure you have at least 4GB free disk space

### First Time Using the App? 📚

1. **Open a PDF:** File → Open (Ctrl+O)
2. **Try basic tools:** Click toolbar icons to add text, highlight, or draw
3. **Save your work:** File → Save (Ctrl+S)
4. **Explore features:** Check the menus for advanced options

### Need Help? 💬

- Read the full README.md for detailed documentation
- Check the Help menu in the application
- Keyboard shortcuts: Help → Keyboard Shortcuts

### System Requirements 📋

- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB for installation
- **Display:** 1280x720 minimum resolution

---

**Enjoy using Professional PDF Editor!** 🎉

*Built with modern web technologies for the best PDF editing experience.*
