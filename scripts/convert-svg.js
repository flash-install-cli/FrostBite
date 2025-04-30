const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure directories exist
const assetsDir = path.join(__dirname, '../assets');
const docsImagesDir = path.join(__dirname, '../docs/images');

if (!fs.existsSync(docsImagesDir)) {
  fs.mkdirSync(docsImagesDir, { recursive: true });
}

// Copy SVG to docs/images
const svgPath = path.join(assetsDir, 'frostbite-logo.svg');
const svgDestPath = path.join(docsImagesDir, 'frostbite-logo.svg');
fs.copyFileSync(svgPath, svgDestPath);

console.log(`Copied SVG to ${svgDestPath}`);

// Create a simple HTML file that displays the SVG
const htmlPath = path.join(__dirname, 'temp.html');
fs.writeFileSync(htmlPath, `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; }
    svg { display: block; }
  </style>
</head>
<body>
  ${fs.readFileSync(svgPath, 'utf8')}
</body>
</html>
`);

console.log('Created temporary HTML file');

// Use a data URL approach instead
const svgContent = fs.readFileSync(svgPath, 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

// Create a README with the embedded image
const readmePath = path.join(__dirname, '../README-with-image.md');
fs.writeFileSync(readmePath, `
# Test Image

![Frostbite Logo](${dataUrl})
`);

console.log('Created test README with embedded image');

// Clean up
fs.unlinkSync(htmlPath);
