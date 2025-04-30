#!/usr/bin/env node

/**
 * Post-installation script for Frostbite
 * This script sets up file associations for .fbz files
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Determine the platform
const platform = process.platform;

// Get the installation directory
const installDir = path.resolve(__dirname, '..');
const desktopDir = path.join(installDir, 'desktop');
const iconsDir = path.join(desktopDir, 'icons');

console.log('Setting up Frostbite file associations...');

try {
  // Create desktop directory if it doesn't exist
  if (!fs.existsSync(desktopDir)) {
    fs.mkdirSync(desktopDir, { recursive: true });
  }

  // Windows setup
  if (platform === 'win32') {
    console.log('Detected Windows platform');
    
    try {
      // Create registry entries
      const regContent = `Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\\Software\\Classes\\.fbz]
@="FrostbiteEncryptedFile"
"Content Type"="application/x-frostbite"

[HKEY_CURRENT_USER\\Software\\Classes\\FrostbiteEncryptedFile]
@="Frostbite Encrypted File"
"FriendlyTypeName"="Frostbite Encrypted File"

[HKEY_CURRENT_USER\\Software\\Classes\\FrostbiteEncryptedFile\\DefaultIcon]
@="${installDir.replace(/\\\\/g, '\\\\\\\\')}\\\\desktop\\\\frostbite-file.ico"

[HKEY_CURRENT_USER\\Software\\Classes\\FrostbiteEncryptedFile\\shell]

[HKEY_CURRENT_USER\\Software\\Classes\\FrostbiteEncryptedFile\\shell\\open]
@="Decrypt with Frostbite"

[HKEY_CURRENT_USER\\Software\\Classes\\FrostbiteEncryptedFile\\shell\\open\\command]
@="\\"${process.execPath.replace(/\\\\/g, '\\\\\\\\')}\\" \\"${path.join(installDir, 'bin', 'cli.js').replace(/\\\\/g, '\\\\\\\\')}\\\" unlock \\"%1\\""
`;
      
      const regFilePath = path.join(desktopDir, 'frostbite-file-association.reg');
      fs.writeFileSync(regFilePath, regContent);
      
      // Run the registry file
      console.log('Adding registry entries for .fbz files...');
      execSync(`regedit /s "${regFilePath}"`, { windowsHide: true });
      console.log('Registry entries added successfully');
      
      // Notify Windows of the file association change
      execSync('assoc .fbz=FrostbiteEncryptedFile', { windowsHide: true });
      
      console.log('Windows file association setup complete');
    } catch (error) {
      console.error('Error setting up Windows file association:', error.message);
      console.log('You can manually set up the file association by running:');
      console.log(`regedit /s "${path.join(desktopDir, 'frostbite-file-association.reg')}"`);
    }
  }
  
  // macOS setup
  else if (platform === 'darwin') {
    console.log('Detected macOS platform');
    console.log('Setting up file association for macOS...');
    
    try {
      // Create the UTI declaration
      const plistDir = path.join(os.homedir(), 'Library', 'Application Support', 'Frostbite');
      fs.mkdirSync(plistDir, { recursive: true });
      
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>UTExportedTypeDeclarations</key>
    <array>
        <dict>
            <key>UTTypeConformsTo</key>
            <array>
                <string>public.data</string>
            </array>
            <key>UTTypeDescription</key>
            <string>Frostbite Encrypted File</string>
            <key>UTTypeIconFile</key>
            <string>${path.join(desktopDir, 'frostbite-file.icns')}</string>
            <key>UTTypeIdentifier</key>
            <string>com.frostbite.encrypted</string>
            <key>UTTypeTagSpecification</key>
            <dict>
                <key>public.filename-extension</key>
                <array>
                    <string>fbz</string>
                </array>
                <key>public.mime-type</key>
                <array>
                    <string>application/x-frostbite</string>
                </array>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
      
      const plistPath = path.join(plistDir, 'FrostbiteFileTypes.plist');
      fs.writeFileSync(plistPath, plistContent);
      
      // Register the UTI
      try {
        execSync(`lsregister -f "${plistPath}"`, { stdio: 'ignore' });
        console.log('File type registered with Launch Services');
      } catch (error) {
        console.log('Could not register with Launch Services automatically');
      }
      
      console.log('macOS file association setup complete');
      console.log('You may need to log out and back in for changes to take effect');
    } catch (error) {
      console.error('Error setting up macOS file association:', error.message);
    }
  }
  
  // Linux setup
  else if (platform === 'linux') {
    console.log('Detected Linux platform');
    console.log('Setting up file association for Linux...');
    
    try {
      // Create the MIME type file
      const mimeDir = path.join(os.homedir(), '.local', 'share', 'mime', 'packages');
      fs.mkdirSync(mimeDir, { recursive: true });
      
      const mimeContent = `<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/x-frostbite">
    <comment>Frostbite Encrypted File</comment>
    <glob pattern="*.fbz"/>
    <icon name="frostbite-file"/>
  </mime-type>
</mime-info>`;
      
      const mimePath = path.join(mimeDir, 'frostbite-file.xml');
      fs.writeFileSync(mimePath, mimeContent);
      
      // Copy icons to the user's icon directory
      const iconSizes = ['16x16', '32x32', '48x48', '64x64', '128x128'];
      const userIconsDir = path.join(os.homedir(), '.local', 'share', 'icons', 'hicolor');
      
      for (const size of iconSizes) {
        const targetDir = path.join(userIconsDir, size, 'mimetypes');
        fs.mkdirSync(targetDir, { recursive: true });
        
        const sourceIcon = path.join(iconsDir, size, 'frostbite-file.png');
        const targetIcon = path.join(targetDir, 'frostbite-file.png');
        
        if (fs.existsSync(sourceIcon)) {
          fs.copyFileSync(sourceIcon, targetIcon);
        }
      }
      
      // Update MIME and icon caches
      try {
        execSync('update-mime-database ~/.local/share/mime', { stdio: 'ignore' });
        execSync('gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor', { stdio: 'ignore' });
        console.log('MIME and icon caches updated');
      } catch (error) {
        console.log('Could not update MIME and icon caches automatically');
      }
      
      console.log('Linux file association setup complete');
      console.log('You may need to log out and back in for changes to take effect');
    } catch (error) {
      console.error('Error setting up Linux file association:', error.message);
    }
  }
  
  console.log('File association setup completed');
} catch (error) {
  console.error('Error during post-installation:', error);
}
