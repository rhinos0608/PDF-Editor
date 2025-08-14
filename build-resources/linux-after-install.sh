#!/bin/bash

# Post-installation script for Linux
# This script runs after the application is installed

set -e

APP_NAME="professional-pdf-editor"
DESKTOP_FILE="/usr/share/applications/${APP_NAME}.desktop"

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# Update MIME database for PDF file associations
if command -v update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime
fi

# Create MIME type association for PDF files
MIME_FILE="/usr/share/mime/packages/${APP_NAME}.xml"
cat > "$MIME_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/pdf">
    <comment>PDF Document</comment>
    <glob pattern="*.pdf"/>
    <magic priority="60">
      <match value="%PDF" type="string" offset="0"/>
    </magic>
  </mime-type>
</mime-info>
EOF

# Update MIME database again
if command -v update-mime-database >/dev/null 2>&1; then
    update-mime-database /usr/share/mime
fi

# Set default application for PDF files (optional)
if command -v xdg-mime >/dev/null 2>&1; then
    xdg-mime default ${APP_NAME}.desktop application/pdf
fi

echo "Professional PDF Editor installation completed successfully!"