# Spline CLI Overlay - Installation Guide

Automatically add a CLI overlay to Spline when you login!

---

## 🎯 What You Get

✅ **Floating CLI button** in bottom-right corner
✅ **Keyboard shortcut** Ctrl+K to toggle
✅ **Quick command buttons** for common actions
✅ **Live status indicator** showing CLI server connection
✅ **Draggable overlay** position it anywhere
✅ **Command history** with arrow keys

---

## 🚀 Installation Options

### **Option 1: Bookmarklet** (Easiest - One Click!)

1. **Create a new bookmark** in your browser
2. **Name it**: "Spline CLI"
3. **Set the URL to this code**:

```javascript
javascript:(function(){if(document.getElementById('spline-cli-toggle'))return;var s=document.createElement('script');s.src='http://localhost:8080/overlay/inject.js';document.body.appendChild(s);})();
```

4. **Go to Spline** (https://app.spline.design)
5. **Click the bookmarklet** - CLI overlay appears!

---

### **Option 2: Browser Extension** (Recommended - Auto-loads!)

#### For Chrome/Edge:

1. **Open**: `chrome://extensions/`
2. **Enable** "Developer mode" (top-right)
3. **Click** "Load unpacked"
4. **Select** the `Frontend` folder
5. **Done!** Overlay loads automatically on Spline

#### For Firefox:

1. **Open**: `about:debugging#/runtime/this-firefox`
2. **Click** "Load Temporary Add-on"
3. **Select** `Frontend/manifest.json`
4. **Done!** Auto-loads on Spline

---

### **Option 3: Userscript** (Tampermonkey/Greasemonkey)

1. **Install** [Tampermonkey](https://www.tampermonkey.net/)
2. **Create new script**
3. **Copy** contents of `spline-cli-inject.js`
4. **Save**
5. **Visit Spline** - overlay appears automatically!

---

### **Option 4: Manual Injection** (Browser Console)

1. **Go to Spline** (https://app.spline.design)
2. **Open console** (F12 or Cmd+Option+I)
3. **Paste this code**:

```javascript
(function(){
    var script = document.createElement('script');
    script.src = 'http://localhost:8080/overlay/spline-cli-overlay.js';
    document.body.appendChild(script);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'http://localhost:8080/overlay/spline-cli-overlay.css';
    document.head.appendChild(link);

    setTimeout(() => {
        var html = `
            <button id="spline-cli-toggle" title="Toggle Spline CLI (Ctrl+K)">⚡</button>
            <div id="spline-cli-overlay">...</div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }, 500);
})();
```

4. **Press Enter** - overlay appears!

---

## 📋 Requirements

### **Before Installing:**

1. **Start the CLI viewer**:
   ```bash
   spline-edit viewer
   ```
   This runs at http://localhost:8080

2. **Login to Spline**:
   Visit https://app.spline.design and login

3. **Install overlay** using any method above

---

## 🎨 Usage

### **Toggle Overlay**
- **Click** the floating ⚡ button (bottom-right)
- **Press** Ctrl+K (or Cmd+K on Mac)

### **Quick Commands**
Once overlay is open, press these keys:
- **I** - Inspect scene
- **L** - List objects
- **S** - Screenshot
- **E** - Export help
- **V** - Open viewer
- **C** - Console

### **Type Commands**
Type in the input box at bottom:
- `inspect` - View scene objects
- `screenshot` - Capture image
- `export` - Show export guide
- `viewer` - Open live preview
- `help` - Show all commands
- `clear` - Clear output

### **Command History**
- **↑ Arrow** - Previous command
- **↓ Arrow** - Next command
- **Enter** - Execute command

---

## 🌟 Features

### **Visual Feedback**
- 🟢 **Green dot** = Connected to CLI server
- 🔴 **Red dot** = Server not running
- **Color-coded output** - Success (green), Error (red), Info (blue)

### **Draggable**
- **Grab the header** and drag to reposition
- Position is NOT saved between sessions

### **Keyboard Shortcuts**
- **Ctrl+K** - Toggle overlay
- **Esc** - Close overlay
- **I/L/S/E/V/C** - Quick commands

### **Status Indicator**
Shows connection status to CLI server at localhost:8080

---

## 🔧 Configuration

### **Change Server URL**

Edit `spline-cli-overlay.js`:

```javascript
// Line 7-8
const CLI_SERVER = 'http://localhost:8080';  // Change this
const VIEWER_URL = 'http://localhost:8080';  // And this
```

### **Change Keyboard Shortcut**

Edit `spline-cli-overlay.js` around line 60:

```javascript
// Change Ctrl+K to something else
if ((e.ctrlKey || e.metaKey) && e.key === 'k') {  // Change 'k' to another key
```

### **Customize Appearance**

Edit `spline-cli-overlay.html` CSS section to change colors, sizes, positions.

---

## 🐛 Troubleshooting

### **Overlay doesn't appear**

**Check:**
1. Is CLI viewer running? `spline-edit viewer`
2. Is it accessible at http://localhost:8080?
3. Did you install overlay correctly?
4. Check browser console (F12) for errors

**Solution:**
```bash
# Restart viewer
spline-edit viewer

# Then reload Spline page
```

### **Red status dot (Disconnected)**

**Means:** CLI server not running

**Solution:**
```bash
spline-edit viewer
```

### **Commands don't work**

**Check:**
1. Is green status dot showing?
2. Is viewer running at localhost:8080?
3. Are you on https://app.spline.design?

### **Bookmarklet stops working**

**Solution:**
- Recreate the bookmarklet with latest code
- Or use browser extension instead

### **CORS errors in console**

**Solution:**
The viewer at localhost:8080 needs to allow CORS. This is automatically configured.

---

## 🎯 Complete Setup Workflow

### **One-Time Setup:**

```bash
# 1. Install CLI globally (already done)
npm link

# 2. Start viewer (keep running)
spline-edit viewer
```

### **Every Time You Use Spline:**

```bash
# Terminal: Make sure viewer is running
spline-edit viewer

# Browser: Go to Spline
# https://app.spline.design

# Browser: Click bookmarklet or use extension
# CLI overlay appears!

# Press Ctrl+K to use it
```

---

## 📊 Command Reference

| Command | Shortcut | Description |
|---------|----------|-------------|
| `inspect` | I | View scene objects |
| `list-objects` | L | List all objects |
| `screenshot` | S | Capture scene image |
| `export` | E | Show export guide |
| `viewer` | V | Open live viewer |
| `console` | C | Open browser console |
| `help` | - | Show all commands |
| `clear` | - | Clear output |

---

## 🚀 Next Steps

Once installed, try:

1. **Press Ctrl+K** on Spline page
2. **Click "Inspect Scene"** button
3. **Type `help`** to see all commands
4. **Press `V`** to open viewer in new tab

---

## 💡 Pro Tips

### Tip 1: Keep Viewer Running
Always have `spline-edit viewer` running in a terminal to enable all features.

### Tip 2: Use Keyboard Shortcuts
Memorize Ctrl+K to toggle - much faster than clicking!

### Tip 3: Command History
Use ↑/↓ arrows to recall previous commands.

### Tip 4: Multiple Projects
The overlay works on ANY Spline project you open!

### Tip 5: Screenshot Feature
Press `S` for instant screenshot of your current scene.

---

## 📁 Files

```
Frontend/
├── overlay/
│   ├── spline-cli-overlay.html    # Overlay UI
│   ├── spline-cli-overlay.js      # Overlay logic
│   └── spline-cli-overlay.css     # (extracted from HTML)
├── spline-cli-inject.js           # Userscript
├── manifest.json                  # Browser extension config
└── OVERLAY_INSTALLATION.md        # This file
```

---

## 🎉 You're Ready!

The CLI overlay is now set up and ready to use!

**Start with:**
```bash
# Terminal
spline-edit viewer

# Browser
Go to https://app.spline.design
Click bookmark or install extension
Press Ctrl+K
Enjoy! 🎨
```

---

**Questions? Issues?**
- Check console (F12) for errors
- Ensure viewer is running
- Try manual injection first to test
