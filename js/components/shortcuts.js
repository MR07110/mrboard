// js/components/shortcuts.js - Global Keyboard Shortcuts

import { DB } from '../api/firebase.js';
import { AudioSystem } from './audio.js';

export function initShortcuts(uiController) {
    window.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        const key = e.key.toLowerCase();

        // Ctrl+Z - Undo
        if ((e.ctrlKey || e.metaKey) && key === 'z') {
            e.preventDefault();
            DB.undo();
            return;
        }

        switch (key) {
            case 'b':
                uiController.setTool('draw');
                break;
            case 'e':
                uiController.setTool('erase');
                break;
            case 'h':
                uiController.setTool('pan');
                break;
            case 't':
                uiController.setTool('text');
                break;
            case 'l':
                uiController.setTool('laser');
                break;
            case 's':
                uiController.openDrawer('drawer-shapes');
                break;
            case 'm':
                AudioSystem.toggle();
                break;
            case 'c':
                uiController.openDrawer('drawer-chat');
                break;
            case 'u':
                uiController.openDrawer('drawer-users');
                break;
            case 'f':
                uiController.toggleFullscreen();
                break;
            case 'escape':
                uiController.closeDrawers();
                break;
        }
    });
}

export default initShortcuts;
