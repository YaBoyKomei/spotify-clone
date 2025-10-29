const fs = require('fs');
const path = require('path');

// Create a simple data URL for a PNG icon
function createIconDataURL(size) {
    // This is a base64 encoded simple purple square PNG
    // In production, you should use a proper icon
    const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="20"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">S</text>
    </svg>
    `;
    return canvas;
}

console.log('');
console.log('🎨 To create PWA icons for Sonfy:');
console.log('');
console.log('📍 Open this file in your browser:');
console.log('   client/public/generate-icons.html');
console.log('');
console.log('📥 Then click the download buttons to get:');
console.log('   - logo192.png');
console.log('   - logo512.png');
console.log('');
console.log('💾 Save both files to: client/public/');
console.log('');
console.log('Or use an online tool like:');
console.log('   https://realfavicongenerator.net/');
console.log('   https://www.favicon-generator.org/');
console.log('');
