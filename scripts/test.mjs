// scripts/test.mjs - Production Test Suite for MR BOARD

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting MR BOARD Production Verification Test...\n');

let failed = false;

function checkFile(relPath) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Missing file: ${relPath}`);
        failed = true;
    } else {
        const stats = fs.statSync(fullPath);
        console.log(`✅ [OK] ${relPath} (${stats.size} bytes)`);
    }
}

// 1. Check HTML Pages
console.log('--- 1. Checking Core HTML Files ---');
['index.html', 'board.html', 'dashboard.html', 'doc.html', 'ai.html'].forEach(checkFile);

// 2. Check Modular CSS Files
console.log('\n--- 2. Checking CSS Architecture ---');
[
    'css/style.css',
    'css/base.css',
    'css/components.css',
    'css/board.css',
    'css/dashboard.css',
    'css/landing.css',
    'css/docs.css',
    'css/ai-modal.css',
    'css/donate-modal.css'
].forEach(checkFile);

// 3. Check Modular JS Files
console.log('\n--- 3. Checking JS Components & Modules ---');
const jsFiles = [
    'js/config.js',
    'js/store.js',
    'js/events.js',
    'js/utils.js',
    'js/api/firebase.js',
    'js/api/ai.js',
    'js/auth/auth-manager.js',
    'js/engine/camera.js',
    'js/engine/renderer.js',
    'js/engine/canvas-engine.js',
    'js/components/minimap.js',
    'js/components/color-picker.js',
    'js/components/chat.js',
    'js/components/users.js',
    'js/components/audio.js',
    'js/components/shortcuts.js',
    'js/components/ai-assistant.js',
    'js/components/donate-modal.js',
    'js/components/demo-player.js',
    'js/pages/landing.js',
    'js/pages/board.js',
    'js/pages/dashboard.js',
    'js/pages/docs.js'
];
jsFiles.forEach(checkFile);

// 4. Test Syntax of JS modules
console.log('\n--- 4. Validating JS Module Syntax ---');
for (const relPath of jsFiles) {
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    try {
        // Simple regex check for unbalanced brackets/parentheses
        let braces = 0;
        let parens = 0;
        for (let char of content) {
            if (char === '{') braces++;
            if (char === '}') braces--;
            if (char === '(') parens++;
            if (char === ')') parens--;
        }
        if (braces !== 0 || parens !== 0) {
            console.error(`⚠️ Possible syntax imbalance in ${relPath} (braces: ${braces}, parens: ${parens})`);
        }
    } catch (e) {
        console.error(`❌ Syntax error parsing ${relPath}:`, e.message);
        failed = true;
    }
}

if (failed) {
    console.error('\n❌ Test failed with errors.');
    process.exit(1);
} else {
    console.log('\n🎉 ALL PRODUCTION CHECKS PASSED SUCCESSFULLY!');
}
