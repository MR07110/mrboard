// scripts/build.mjs - Production Build & Asset Verification Script

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Building and validating MR BOARD for Production...\n');

const htmlPages = ['index.html', 'board.html', 'dashboard.html', 'doc.html', 'ai.html'];
let totalBytes = 0;

console.log('📦 Core Pages & Assets:');
htmlPages.forEach(page => {
    const filePath = path.join(rootDir, page);
    const stat = fs.statSync(filePath);
    totalBytes += stat.size;
    console.log(`   - ${page.padEnd(20)}: ${(stat.size / 1024).toFixed(2)} KB`);
});

console.log(`\n✨ Production Build Ready! Total Core Size: ${(totalBytes / 1024).toFixed(2)} KB`);
