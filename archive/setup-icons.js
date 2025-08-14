// Create a basic PNG icon if it doesn't exist
const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, 'public', 'icon.png');

// Check if icon.png exists
if (!fs.existsSync(iconPath)) {
  console.log('Creating default icon.png...');
  
  // Create a simple 256x256 PNG (minimal PNG structure)
  // This is a 1x1 transparent PNG that we'll use as placeholder
  const buffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,  // 8-bit RGBA
    0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,  // IDAT chunk
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,  // Compressed data
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,  // CRC
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  // IEND chunk
    0x42, 0x60, 0x82                                   // CRC
  ]);
  
  fs.writeFileSync(iconPath, buffer);
  console.log('Default icon.png created');
} else {
  console.log('icon.png already exists');
}

// Also check for icon.ico for Windows
const icoPath = path.join(__dirname, 'public', 'icon.ico');
if (!fs.existsSync(icoPath)) {
  // Copy PNG as ICO (Windows will handle it)
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, icoPath);
    console.log('icon.ico created from icon.png');
  }
}

console.log('Icon setup complete');
