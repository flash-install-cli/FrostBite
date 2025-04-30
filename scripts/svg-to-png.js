const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const svg2img = require('svg2img');

// Ensure directories exist
const docsImagesDir = path.join(__dirname, '../docs/images');
if (!fs.existsSync(docsImagesDir)) {
  fs.mkdirSync(docsImagesDir, { recursive: true });
}

// Convert SVG to PNG
const svgPath = path.join(__dirname, '../assets/frostbite-logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create different sizes
const sizes = [64, 128, 256, 512];

sizes.forEach(size => {
  svg2img(svgContent, { width: size, height: size }, (error, buffer) => {
    if (error) {
      console.error(`Error converting SVG to PNG (${size}x${size}):`, error);
      return;
    }
    
    const outputPath = path.join(docsImagesDir, `frostbite-logo-${size}.png`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Created ${outputPath}`);
  });
});

// Create favicon
svg2img(svgContent, { width: 32, height: 32 }, (error, buffer) => {
  if (error) {
    console.error('Error creating favicon:', error);
    return;
  }
  
  const faviconPath = path.join(__dirname, '../docs/favicon.ico');
  fs.writeFileSync(faviconPath, buffer);
  console.log(`Created ${faviconPath}`);
});
