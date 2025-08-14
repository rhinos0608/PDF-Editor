# PDF Editor Functionality Testing Guide

**Status:** ✅ GPU Issues Fixed - App Now Starts Successfully  
**Date:** August 13, 2025

## 🎯 Quick Start - Testing Fixed Functionality

### 1. **Start the App (GPU-Safe Mode)**
```bash
cd "C:\Users\Admin\Documents\RST\PDF Editor"

# Set environment variables for safe GPU mode
set ELECTRON_DISABLE_GPU=1
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_FORCE_SOFTWARE_RENDERING=1
set ELECTRON_DISABLE_HARDWARE_ACCELERATION=1

# Start the application
npm start
```

### 2. **Check Console Output**
- ✅ Should see: `Loading from: C:\Users\Admin\Documents\RST\PDF Editor\dist\renderer\index.html`
- ❌ Should NOT see: GPU errors like `Failed to create GLES3 context`

### 3. **Test Basic Functionality**

#### **A. App Initialization**
1. Open browser DevTools (F12) in the app window
2. Check console for these messages:
   - `🚀 Initializing PDF Editor App...`
   - `✅ App initialization complete`

#### **B. File Operations**
1. Click "Open PDF" button or Ctrl+O
2. Select any PDF file
3. **Expected:** PDF loads and displays
4. **Debug:** Console should show PDF loading messages

#### **C. Tool Selection**
1. Click each tool in the toolbar (Text, Highlight, Shapes, etc.)
2. **Expected:** Console shows `🔧 Tool changed to: [tool_name]`
3. **Expected:** Cursor changes based on tool

#### **D. Annotation Creation**
1. Select **Text Tool** (T icon)
2. Click anywhere on the PDF
3. Enter text in the prompt
4. **Expected:** 
   - Console shows `Mouse down - Current tool: text`
   - Console shows `Adding annotation: [annotation_data]`
   - Text appears on PDF

5. Select **Highlight Tool** 
6. Click and drag across text
7. **Expected:**
   - Console shows mouse position updates
   - Yellow highlight appears

8. Select **Note Tool**
9. Click on PDF and enter note text
10. **Expected:**
    - Yellow circular note icon appears
    - Console shows annotation creation

## 🔧 Troubleshooting Guide

### **Issue 1: App Won't Start**
**Symptoms:** GPU errors, white screen, app crashes
**Solution:** Use the GPU-safe startup command above

### **Issue 2: PDF Won't Load**
**Symptoms:** PDF fails to open, error messages
**Check:**
- Console for PDF.js worker errors
- File permissions
- PDF file corruption

**Debug Steps:**
```javascript
// In browser console
console.log('PDF.js version:', pdfjsLib.version);
console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
```

### **Issue 3: Tools Don't Work**
**Symptoms:** Clicking tools has no effect
**Debug Steps:**
1. Open DevTools (F12)
2. Click a tool button
3. Check console for `🔧 Tool changed to: [tool_name]`
4. If no message appears, toolbar connection is broken

### **Issue 4: Annotations Don't Appear**
**Symptoms:** Tools work but annotations invisible
**Debug Steps:**
1. Create an annotation (text/highlight/note)
2. Check console for `Adding annotation:` message
3. In DevTools Elements tab, look for `.annotation` elements
4. Check if annotations have proper CSS positioning

**Manual CSS Check:**
```css
/* In DevTools, verify these styles exist */
.annotation {
  position: absolute;
  z-index: 10;
  pointer-events: auto;
}
```

### **Issue 5: Save Function Fails**
**Symptoms:** Error when saving PDF
**Check:**
- Console for "PDF header" errors
- File write permissions
- Available disk space

## 📊 Expected Console Output (Success)

When everything works correctly, you should see:
```
🚀 Initializing PDF Editor App...
📱 Loading Electron preferences...
✅ Preferences loaded successfully
✅ App initialization complete

[When selecting tools]
🔧 Tool changed to: text
🔧 Tool changed to: highlight

[When using tools]
Mouse down - Current tool: text
Mouse position: {x: 123, y: 456, tool: "text"}
Adding annotation: {type: "text", text: "Hello", x: 123, y: 456, ...}
New annotations array: [{...}]
Rendering annotations for page 0: [{...}]
```

## 🎯 Functional Requirements Checklist

### ✅ **Core Functions (Should Work)**
- [ ] App starts without GPU errors
- [ ] PDF files load and display
- [ ] Toolbar tools can be selected
- [ ] Console shows tool change messages
- [ ] Mouse clicks on PDF are detected

### ✅ **Annotation Tools (Should Work)**
- [ ] **Text Tool:** Click → Prompt → Text appears
- [ ] **Highlight Tool:** Drag → Yellow highlight appears
- [ ] **Note Tool:** Click → Note icon appears  
- [ ] **Shape Tool:** Drag → Rectangle appears

### ✅ **File Operations (Should Work)**
- [ ] Save function works without errors
- [ ] Save As function works
- [ ] Recent files are tracked

### ✅ **UI Layout (Should Work)**
- [ ] Sidebar panels display correctly
- [ ] Properties panel shows without cutoff
- [ ] Thumbnails panel renders properly
- [ ] Search panel functions

## 🚀 Advanced Testing

### **Performance Test**
1. Load a large PDF (10+ pages)
2. Add multiple annotations (10+)
3. Save the file
4. Reload and verify annotations persist

### **Tool Switching Test**
1. Create text annotation
2. Switch to highlight tool
3. Create highlight
4. Switch to note tool
5. Create note
6. Verify all annotations remain visible

### **Save/Load Test**
1. Create several annotations
2. Save the PDF
3. Close the app
4. Restart and open the same PDF
5. Verify annotations are saved in the PDF

## 🔍 If Issues Persist

### **Check These Common Problems:**

1. **Webpack Bundle Issues**
   - Clear `dist/` folder and rebuild
   - Check for missing dependencies

2. **React State Issues**
   - Annotations created but not rendering
   - Check React DevTools for state updates

3. **CSS Positioning Issues**
   - Annotations created but positioned off-screen
   - Inspect element positioning in DevTools

4. **IPC Communication Issues**
   - File operations fail
   - Check main process logs

### **Last Resort Debugging**
```bash
# Clean build
npm run clean
npm install
npm run build

# Start with maximum debugging
set ELECTRON_ENABLE_LOGGING=1
set DEBUG=*
npm start
```

## 📝 Reporting Issues

If problems persist, collect this information:
1. Console output (copy all messages)
2. Steps to reproduce the issue
3. Expected vs actual behavior
4. Operating system and version
5. Screenshots of DevTools if applicable

---

**The app should now start without GPU errors and have functional annotation tools. Use this guide to systematically test and verify functionality.**