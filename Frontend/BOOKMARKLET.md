# Spline CLI Bookmarklet - Quick Installation

## 🎯 What is a Bookmarklet?

A bookmarklet is a bookmark that runs JavaScript code. Click it once on any Spline page to inject the CLI overlay!

---

## 📋 Installation Steps

### **Step 1: Create the Bookmark**

1. **Show your bookmarks bar**:
   - Chrome/Edge: Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (Mac)
   - Firefox: Right-click toolbar → Check "Bookmarks Toolbar"

2. **Right-click** on the bookmarks bar
3. **Click** "Add page..." or "New bookmark"

### **Step 2: Configure the Bookmark**

**Name:**
```
⚡ Spline CLI
```

**URL/Location:**
```javascript
javascript:(function(){if(document.getElementById('spline-cli-toggle')){alert('CLI already loaded!');return;}var s=document.createElement('script');s.src='http://localhost:8080/overlay/spline-cli-overlay.js';s.onload=function(){console.log('✅ Spline CLI loaded');};s.onerror=function(){alert('❌ CLI Server not running!\n\nStart with: spline-edit viewer');};document.body.appendChild(s);var btn=document.createElement('button');btn.id='spline-cli-toggle';btn.innerHTML='⚡';btn.title='Spline CLI (Ctrl+K)';btn.style.cssText='position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:linear-gradient(135deg,#5b8fff,#4a7aee);border:none;border-radius:50%;color:white;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(91,143,255,0.4);z-index:999998;display:flex;align-items:center;justify-content:center';document.body.appendChild(btn);})();
```

### **Step 3: Save**

Click "Save" or "Done"

---

## 🚀 Usage

### **Every Time You Use Spline:**

1. **Terminal**: Make sure viewer is running
   ```bash
   spline-edit viewer
   ```

2. **Browser**: Go to https://app.spline.design

3. **Click** the "⚡ Spline CLI" bookmarklet

4. **Done!** The CLI button appears in bottom-right corner

5. **Press Ctrl+K** to open the overlay

---

## 📸 Visual Guide

### Before Clicking Bookmarklet:
```
Your Spline page - normal view
```

### After Clicking Bookmarklet:
```
Your Spline page
   └─> ⚡ button in bottom-right corner
```

### After Pressing Ctrl+K:
```
Your Spline page
   └─> ⚡ button
   └─> CLI Overlay window (draggable)
       ├─ Status indicator
       ├─ Quick command buttons
       ├─ Output area
       └─ Command input
```

---

## 🎨 Alternative Bookmarklet (Minimal)

If the main one doesn't work, try this minimal version:

**Name:** `Spline CLI (Simple)`

**URL:**
```javascript
javascript:var s=document.createElement('script');s.src='http://localhost:8080/overlay/inject.js';document.body.appendChild(s);
```

---

## 🔧 Troubleshooting

### **Bookmarklet Does Nothing**

**Check:**
1. Is the viewer running? `spline-edit viewer`
2. Are you on https://app.spline.design?
3. Did you copy the entire URL (starts with `javascript:`)?
4. Check browser console (F12) for errors

**Solution:**
```bash
# Start viewer if not running
spline-edit viewer

# Then click bookmarklet again
```

### **"CLI Server not running" Alert**

**Means:** The viewer isn't running at localhost:8080

**Solution:**
```bash
spline-edit viewer
```

Then click bookmarklet again.

### **Bookmarklet Copied Wrong**

Make sure the bookmark URL field contains the ENTIRE code starting with `javascript:` and NO line breaks.

**Correct:**
```
javascript:(function(){...})();
```

**Wrong:**
```
(function(){...})();
```
(missing `javascript:` prefix)

### **Security Warning**

Some browsers show a warning about running JavaScript from bookmarks. This is normal - click "Allow" or "Run".

---

## 💡 Pro Tips

### Tip 1: Keyboard Shortcut for Bookmarklet

- Drag the bookmarklet to the **first position** in your bookmarks bar
- Press `Alt+1` (or `Cmd+1` on Mac) to trigger it!

### Tip 2: Save Time

The overlay persists until you refresh the page, so click the bookmarklet once per Spline session.

### Tip 3: Works on All Projects

Once loaded, the overlay works on ANY Spline project you open in that tab.

### Tip 4: Multiple Tabs

You need to click the bookmarklet once per Spline tab.

### Tip 5: Create Multiple

Create separate bookmarklets for different functions:
- One to inject overlay
- One to open viewer
- One to take screenshot

---

## 🎯 Quick Reference

| Step | Action |
|------|--------|
| 1 | Start viewer: `spline-edit viewer` |
| 2 | Open Spline: https://app.spline.design |
| 3 | Click bookmarklet: ⚡ Spline CLI |
| 4 | Toggle overlay: Press Ctrl+K |
| 5 | Use commands: Press I, L, S, E, V, or C |

---

## 📦 Export Bookmarklet

Want to share with a friend?

1. **Right-click** the bookmarklet
2. **Copy link address**
3. **Share** the code with them
4. They create a bookmark with that code

---

## 🔄 Update Bookmarklet

If we update the overlay:

1. **Delete** old bookmarklet
2. **Create new one** with updated code from this guide

---

## 🎉 You're Done!

The bookmarklet is the **easiest way** to use the Spline CLI overlay!

**Quick test:**
1. Run: `spline-edit viewer`
2. Go to: https://app.spline.design
3. Click: ⚡ Spline CLI bookmark
4. Press: Ctrl+K
5. Enjoy! 🚀

---

**Prefer automatic loading?** Use the browser extension instead!
See `OVERLAY_INSTALLATION.md` for more options.
