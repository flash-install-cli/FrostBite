#!/bin/bash

# This script installs the Frostbite file type association on Linux systems

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Copy the MIME type definition
echo "Installing MIME type definition..."
cp frostbite-file.xml /usr/share/mime/packages/
update-mime-database /usr/share/mime/

# Copy icons
echo "Installing file icons..."
cp -r icons/16x16/frostbite-file.png /usr/share/icons/hicolor/16x16/mimetypes/
cp -r icons/32x32/frostbite-file.png /usr/share/icons/hicolor/32x32/mimetypes/
cp -r icons/48x48/frostbite-file.png /usr/share/icons/hicolor/48x48/mimetypes/
cp -r icons/64x64/frostbite-file.png /usr/share/icons/hicolor/64x64/mimetypes/
cp -r icons/128x128/frostbite-file.png /usr/share/icons/hicolor/128x128/mimetypes/
gtk-update-icon-cache -f -t /usr/share/icons/hicolor

echo "Installation complete. You may need to restart your file manager."
