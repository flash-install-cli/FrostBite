# Frostbite File Association

This directory contains files for integrating Frostbite encrypted files (`.fbz`) with your operating system's file explorer.

## File Icons

The file icons will make `.fbz` files easily recognizable in your file explorer.

## Installation

### Windows

1. Double-click the `frostbite-file-association.reg` file
2. Confirm the registry modification when prompted
3. Copy the `icons/32x32/frostbite-file.png` to `%ProgramFiles%\Frostbite\frostbite-file.ico`

### macOS

1. If you're building a macOS application, include the `Info.plist` in your application bundle
2. Convert the SVG icon to ICNS format:
   ```
   iconutil -c icns frostbite-file.iconset
   ```
3. Place the ICNS file in your application bundle

### Linux

1. Run the installation script as root:
   ```
   sudo ./install-file-association.sh
   ```
2. Restart your file manager or log out and back in

## Manual Installation

If the automated methods don't work, you can manually associate the `.fbz` extension with Frostbite:

1. Right-click a `.fbz` file
2. Select "Open with" or "Properties"
3. Choose the Frostbite application or specify the path to it
4. Set it as the default application for this file type
