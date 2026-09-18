#!/usr/bin/env node

/**
 * assemble.js
 * Creates a book.epub file from the EPUB directory structure
 * 
 * Usage:
 *   node assemble.js
 * 
 * This script zips the mimetype, META-INF and OEBPS directories 
 * into a single book.epub file with proper EPUB 3 structure.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const EPUB_NAME = 'book.epub';
const MIMETYPE = 'application/epub+zip';
const OUTPUT_FILE = path.join(__dirname, EPUB_NAME);

console.log('='.repeat(60));
console.log('EPUB Assembly Script v1.0');
console.log('='.repeat(60));

// Check if required directories exist
console.log('\nChecking required components...');
const requiredPaths = [
  'mimetype',
  'META-INF',
  'META-INF/container.xml',
  'OEBPS',
  'OEBPS/content.opf',
  'OEBPS/nav.xhtml'
];

for (const p of requiredPaths) {
  const fullPath = path.join(__dirname, p);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Required file/directory "${p}" does not exist!`);
    process.exit(1);
  }
  console.log(`  ✓ ${p}`);
}

// Create mimetype if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'mimetype'))) {
  fs.writeFileSync(path.join(__dirname, 'mimetype'), MIMETYPE);
  console.log('  ✓ mimetype created');
}

// Check if zip command is available
console.log('\nChecking zip utility...');
try {
  execSync('zip -v', { stdio: 'pipe' });
  console.log('  ✓ zip utility is available');
} catch (error) {
  console.error('Error: zip utility not found!');
  console.error('On macOS/Linux, zip should be pre-installed.');
  process.exit(1);
}

// Remove existing EPUB file
if (fs.existsSync(OUTPUT_FILE)) {
  console.log(`\nRemoving existing ${EPUB_NAME}...`);
  fs.unlinkSync(OUTPUT_FILE);
  console.log(`  ✓ Removed`);
}

// Create EPUB with proper structure
console.log('\nCreating EPUB archive...');

try {
  // For EPUB 3, mimetype must be first and uncompressed
  // Then add everything else
  const commands = [
    'zip -q -0 -X book.epub mimetype',
    'zip -q -9 -r book.epub META-INF OEBPS'
  ];
  
  for (const cmd of commands) {
    execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
  }
  
  console.log(`\n✓ ${EPUB_NAME} created successfully!`);
  
  // Verify the file
  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSize = (stats.size / 1024).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('EPUB File Details:');
    console.log('='.repeat(60));
    console.log(`  File:     ${OUTPUT_FILE}`);
    console.log(`  Size:     ${fileSize} KB`);
    console.log(`  Created:  ${new Date().toISOString()}`);
    
    console.log('\n  Contents:');
    try {
      const unzipOutput = execSync('unzip -l book.epub', {
        cwd: __dirname,
        encoding: 'utf8'
      });
      console.log(unzipOutput);
    } catch (e) {
      console.log('  (Use: unzip -l book.epub to view contents)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Assembly complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Validate: epubcheck book.epub (if installed)');
    console.log('  2. Add real images to OEBPS/images/');
    console.log('  3. Test in Apple Books or other EPUB readers');
    console.log('\n');
  } else {
    console.error(`\n✗ Error: ${EPUB_NAME} was not created!`);
    process.exit(1);
  }
  
} catch (error) {
  console.error(`\n✗ Error: ${error.message}`);
  process.exit(1);
}
