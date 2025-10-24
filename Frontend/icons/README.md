# Extension Icons

Place your extension icons here:

- `icon16.png` - 16x16px (toolbar)
- `icon48.png` - 48x48px (extension management)
- `icon128.png` - 128x128px (Chrome Web Store)

## Generating Icons

You can create icons using:

1. **Design Tool** (Figma, Sketch, etc.)
   - Create a 128x128px artboard
   - Use the ⚡ lightning bolt symbol
   - Colors: Purple gradient (#667eea to #764ba2)
   - Export as PNG in three sizes

2. **Online Tools**
   - Use https://realfavicongenerator.net/
   - Upload a single 128x128px image
   - Download all sizes

3. **ImageMagick** (if installed)
   ```bash
   # Create from SVG or large PNG
   convert icon.png -resize 16x16 icon16.png
   convert icon.png -resize 48x48 icon48.png
   convert icon.png -resize 128x128 icon128.png
   ```

## Temporary Placeholder

For now, you can use any purple/blue square images as placeholders until you create custom icons.

The extension will work without icons, but Chrome will show a default gray puzzle piece icon.
