// scripts/build.mjs - Production Build & Asset Verification Script

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('[BUILD] Building and validating MR BOARD for Production...\n');

// 1. Bundle Modular CSS into css/style.css
const cssOrder = [
    'css/base.css',
    'css/components.css',
    'css/board.css',
    'css/dashboard.css',
    'css/landing.css',
    'css/docs.css',
    'css/donate-modal.css'
];

let bundledCSS = '/* MR BOARD Production Bundled Stylesheet */\n';
for (const file of cssOrder) {
    bundledCSS += `\n/* --- ${file} --- */\n` + fs.readFileSync(path.join(rootDir, file), 'utf8');
}
fs.writeFileSync(path.join(rootDir, 'css/style.css'), bundledCSS);
console.log(`[CSS BUNDLE] Bundled ${cssOrder.length} CSS modules into css/style.css (${(bundledCSS.length / 1024).toFixed(2)} KB)\n`);

const htmlPages = ['index.html', '404.html', 'board/index.html', 'dashboard/index.html', 'doc/index.html'];
let totalBytes = 0;

console.log('[ASSETS] Core Pages & Assets:');
htmlPages.forEach(page => {
    const filePath = path.join(rootDir, page);
    const stat = fs.statSync(filePath);
    totalBytes += stat.size;
    console.log(`   - ${page.padEnd(20)}: ${(stat.size / 1024).toFixed(2)} KB`);
});

console.log(`\n[SUCCESS] Production Build Ready! Total Core Size: ${(totalBytes / 1024).toFixed(2)} KB`);
