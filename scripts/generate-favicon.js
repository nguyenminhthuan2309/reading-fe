const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const sharp = require('sharp');

// Make sure scripts directory exists
if (!fs.existsSync(path.join(__dirname, '..'))) {
  fs.mkdirSync(path.join(__dirname, '..'), { recursive: true });
}

// Load SVG content
const svgContent = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'), 'utf8');

// JSDOM implementation
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;

async function convertSvgToPng(svgContent, sizes) {
  for (const size of sizes) {
    try {
      // Use sharp to convert SVG to PNG
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .toFile(path.join(__dirname, `../public/favicon-${size}x${size}.png`));
      
      console.log(`Generated favicon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} favicon:`, error);
    }
  }
  
  // Create the main favicon.ico
  try {
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    
    console.log('Generated favicon.ico');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }
}

// Generate icons in common sizes
const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
convertSvgToPng(svgContent, sizes)
  .then(() => {
    console.log('Favicon generation completed successfully!');
  })
  .catch((err) => {
    console.error('Error in favicon generation:', err);
  }); 