// js/pages/board.js - Main Whiteboard Application Controller

import { Store } from '../store.js';
import { Events } from '../events.js';
import { DB, RoomAPI } from '../api/firebase.js';
import { Utils } from '../utils.js';
import { CanvasEngine } from '../engine/canvas-engine.js';
import { camera } from '../engine/camera.js';
import { authManager } from '../auth/auth-manager.js';
import { ColorPickerComponent } from '../components/color-picker.js';
import { MinimapComponent } from '../components/minimap.js';
import { ChatComponent } from '../components/chat.js';
import { UsersComponent } from '../components/users.js';
import { AudioSystem } from '../components/audio.js';
import { initShortcuts } from '../components/shortcuts.js';

function formatAuthError(err) {
    if (!err) return "Noma'lum xatolik yuz berdi";
    const msg = (typeof err === 'string' ? err : (err.message || '')).toLowerCase();
    const code = (err.code || '').toLowerCase();

    if (code.includes('invalid-credential') || msg.includes('invalid_login_credentials') || code.includes('wrong-password')) {
        return "Email yoki parol noto'g'ri kiritildi!";
    }
    if (code.includes('user-not-found') || msg.includes('user_not_found')) {
        return "Ushbu email bilan ro'yxatdan o'tilmagan. Avval ro'yxatdan o'ting!";
    }
    if (code.includes('email-already-in-use') || msg.includes('email_exists')) {
        return "Bu email allaqachon ro'yxatdan o'tgan! Tizimga kiring.";
    }
    if (code.includes('weak-password') || msg.includes('weak_password')) {
        return "Parol juda oddiy. Kamida 6 ta belgi kiriting!";
    }
    if (code.includes('invalid-email') || msg.includes('invalid_email')) {
        return "Email manzili noto'g'ri kiritildi!";
    }
    if (code.includes('too-many-requests') || msg.includes('too_many_attempts')) {
        return "Ko'p marta xato urinish bo'ldi. Biroz kuting va qayta urinib ko'ring.";
    }
    if (code.includes('network-request-failed')) {
        return "Internet aloqasida xatolik yuz berdi. Tarmoqni tekshiring.";
    }

    try {
        const jsonMatch = err.message?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const subMsg = (parsed.error?.message || '').toUpperCase();
            if (subMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
                return "Email yoki parol noto'g'ri kiritildi!";
            }
            if (subMsg.includes('EMAIL_EXISTS')) {
                return "Bu email allaqachon ro'yxatdan o'tgan! Tizimga kiring.";
            }
        }
    } catch (_) {}

    return err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

export class BoardPage {
    constructor() {
        this.engine = null;
        this.colorPicker = null;
        this.minimap = null;
        this.chat = null;
        this.users = null;

        this.init();
    }

    async init() {
        // Initialize Auth State
        const user = await authManager.init();

        this.bindAuthGateway();
        this.bindUIControls();
        initShortcuts(this);

        // Check pending or active room
        await this.handleRoomRouting(user);
    }

    async handleRoomRouting(user) {
        const urlParams = new URLSearchParams(window.location.search);
        const roomIdFromUrl = urlParams.get('room') || localStorage.getItem('pendingRoomId');
        const hash = window.location.hash.slice(1);

        if (!user) {
            // Unauthenticated: Show auth gateway
            this.showAuthGateway();
            return;
        }

        // Authenticated (or Anonymous guest)
        Store.uid = user.uid;
        Store.name = user.fullName || user.username || user.name || user.email?.split('@')[0] || 'Mehmon';

        if (hash.startsWith('t-')) {
            // Teacher Link Entry
            const teacherSecret = hash.slice(2);
            Store.isTeacher = true;
            Store.teacherSecret = teacherSecret;
            Store.roomId = teacherSecret.substring(0, 6);
            Store.perms.draw = true;
            Store.perms.speak = true;

            this.startBoard(Store.roomId, teacherSecret);
        } else if (hash.startsWith('s-')) {
            // Student Link Entry
            const studentCode = hash.slice(2);
            Store.isTeacher = false;
            Store.roomId = studentCode;
            Store.perms.draw = false;
            Store.perms.speak = false;

            this.startBoard(studentCode, null);
        } else if (roomIdFromUrl) {
            localStorage.removeItem('pendingRoomId');
            const roomData = await RoomAPI.getRoom(roomIdFromUrl);

            if (!roomData) {
                // Allow ad-hoc or direct room joining without redirecting
                const isOwner = !user.isAnonymous;
                Store.isTeacher = isOwner;
                Store.roomId = roomIdFromUrl;
                Store.teacherSecret = isOwner ? roomIdFromUrl + "SECRET" : null;
                Store.perms.draw = isOwner;
                Store.perms.speak = isOwner;

                this.startBoard(roomIdFromUrl, Store.teacherSecret);
                return;
            }

            const isOwner = roomData.createdBy === user.uid;
            Store.isTeacher = isOwner;
            Store.roomId = roomIdFromUrl;
            Store.teacherSecret = isOwner ? roomData.teacherSecret : null;
            Store.perms.draw = isOwner;
            Store.perms.speak = isOwner;

            this.startBoard(roomIdFromUrl, Store.teacherSecret);
        } else if (user.isAnonymous) {
            // Unauthenticated guest with no room link: prompt login / join
            this.showAuthGateway();
        } else {
            // Default demo or redirect to dashboard
            const defaultRoom = "DEMO01";
            Store.roomId = defaultRoom;
            Store.isTeacher = true;
            Store.perms.draw = true;
            Store.perms.speak = true;
            this.startBoard(defaultRoom, defaultRoom + "SECRET");
        }
    }

    showAuthGateway() {
        const gateway = document.getElementById('auth-gateway');
        const app = document.getElementById('app-container');
        const overlay = document.getElementById('ui-overlay');

        if (gateway) gateway.style.display = 'flex';
        if (app) app.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    }

    startBoard(roomId, teacherSecret) {
        const gateway = document.getElementById('auth-gateway');
        const app = document.getElementById('app-container');
        const overlay = document.getElementById('ui-overlay');

        if (gateway) gateway.style.display = 'none';
        if (app) app.style.display = 'block';
        if (overlay) overlay.style.display = 'block';

        // Update UI displays
        document.getElementById('ui-room-code')?.replaceChildren(document.createTextNode(roomId));
        document.getElementById('user-name-display')?.replaceChildren(document.createTextNode(Store.name));
        document.getElementById('user-role-display')?.replaceChildren(document.createTextNode(Store.isTeacher ? "O'qituvchi" : "O'quvchi"));

        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) userAvatar.innerText = Store.name.charAt(0).toUpperCase();

        if (Store.isTeacher) {
            const hostControls = document.getElementById('panel-host-controls');
            if (hostControls) hostControls.style.display = 'block';

            const userRole = document.getElementById('ui-user-role');
            if (userRole) userRole.innerHTML = '<i data-lucide="crown"></i> O\'qituvchi';

            const baseUrl = window.location.href.split('#')[0].split('?')[0];
            const teacherLink = `${baseUrl}#t-${teacherSecret}`;
            const studentLink = `${baseUrl}#s-${roomId}`;

            const teacherBox = document.getElementById('teacher-link-box');
            const studentBox = document.getElementById('student-link-box');
            const teacherText = document.getElementById('teacher-link-text');
            const studentText = document.getElementById('student-link-text');

            if (teacherText) teacherText.innerText = teacherLink;
            if (studentText) studentText.innerText = studentLink;
            if (teacherBox) teacherBox.style.display = 'flex';
            if (studentBox) studentBox.style.display = 'flex';
        }

        // Initialize Engine & Subcomponents
        DB.init(roomId, teacherSecret);

        this.engine = new CanvasEngine();
        this.engine.init();

        this.colorPicker = new ColorPickerComponent();
        this.minimap = new MinimapComponent();
        this.chat = new ChatComponent();
        this.users = new UsersComponent();

        Events.on('zoom', () => {
            const zoomLabel = document.getElementById('ui-zoom-level');
            if (zoomLabel) zoomLabel.innerText = `${Math.round(Store.cam.z * 100)}%`;
        });

        Events.on('role', () => {
            if (!Store.isTeacher) {
                const userRole = document.getElementById('ui-user-role');
                if (userRole) {
                    userRole.innerHTML = Store.perms.draw
                        ? '<i data-lucide="pencil"></i> Yozuvchi'
                        : '<i data-lucide="eye"></i> Kuzatuvchi';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });

        Events.on('open-text-modal', () => {
            document.getElementById('modal-text-input')?.classList.add('is-visible');
            document.getElementById('drawer-backdrop')?.classList.add('is-visible');
            setTimeout(() => document.getElementById('inp-text-area')?.focus(), 150);
        });

        if (window.lucide) window.lucide.createIcons();
        Utils.vibrate([15, 40, 15]);
    }

    bindAuthGateway() {
        // Tab switching (Login vs Register vs Guest)
        document.querySelectorAll('.auth-tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-panel-body').forEach(p => {
                    p.classList.remove('active');
                    p.style.display = 'none';
                });

                tab.classList.add('active');
                const targetId = `${tab.dataset.tab}-panel`;
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.style.display = 'block';
                }
                if (window.lucide) window.lucide.createIcons();
            });
        });

        if (window.lucide) window.lucide.createIcons();

        // Login Handler
        document.getElementById('btn-login')?.addEventListener('click', async () => {
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            const errEl = document.getElementById('login-error');

            if (!email || !password) {
                if (errEl) errEl.innerText = "Email va parolni kiriting";
                return;
            }

            try {
                if (errEl) errEl.innerText = "";
                await authManager.login(email, password);
                window.location.reload();
            } catch (err) {
                if (errEl) errEl.innerText = formatAuthError(err);
            }
        });

        // Register Handler
        document.getElementById('btn-register')?.addEventListener('click', async () => {
            const firstName = document.getElementById('reg-firstname')?.value.trim();
            const lastName = document.getElementById('reg-lastname')?.value.trim();
            const username = document.getElementById('reg-username')?.value.trim();
            const email = document.getElementById('reg-email')?.value.trim();
            const password = document.getElementById('reg-password')?.value;
            const confirm = document.getElementById('reg-confirm')?.value;
            const errEl = document.getElementById('register-error');

            if (!email || !password || !username) {
                if (errEl) errEl.innerText = "Barcha majburiy maydonlarni to'ldiring";
                return;
            }

            if (password.length < 6) {
                if (errEl) errEl.innerText = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
                return;
            }

            if (password !== confirm) {
                if (errEl) errEl.innerText = "Parollar bir-biriga mos kelmadi";
                return;
            }

            try {
                if (errEl) errEl.innerText = "";
                await authManager.register(email, password, { firstName, lastName, username });
                window.location.reload();
            } catch (err) {
                if (errEl) errEl.innerText = formatAuthError(err);
            }
        });

        // Guest Join Room Handler
        document.getElementById('btn-guest-join')?.addEventListener('click', () => {
            const name = document.getElementById('guest-name')?.value.trim() || 'Mehmon';
            const roomCode = document.getElementById('guest-room-code')?.value.trim().toUpperCase();
            const errEl = document.getElementById('guest-error');

            if (!roomCode || roomCode.length < 4) {
                if (errEl) errEl.innerText = "Xona kodini to'g'ri kiriting";
                return;
            }

            localStorage.setItem('guest_name', name);
            Store.name = name;
            window.location.hash = `#s-${roomCode}`;
            window.location.reload();
        });

        // Guest Create Room Handler
        document.getElementById('btn-guest-create')?.addEventListener('click', () => {
            const name = document.getElementById('guest-name')?.value.trim() || 'O\'qituvchi';
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const teacherSecret = newCode + Math.random().toString(36).substring(2, 10);

            localStorage.setItem('guest_name', name);
            Store.name = name;
            window.location.hash = `#t-${teacherSecret}`;
            window.location.reload();
        });
    }

    bindUIControls() {
        // Tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTool(btn.dataset.tool);
                this.closeDrawers();
            });
        });

        // Drawers triggers
        document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openDrawer('drawer-settings'));
        document.getElementById('btn-open-colors')?.addEventListener('click', () => this.openDrawer('drawer-colors'));
        document.getElementById('btn-open-chat')?.addEventListener('click', () => {
            this.openDrawer('drawer-chat');
            this.chat?.clearUnread();
        });
        document.getElementById('btn-open-users')?.addEventListener('click', () => this.openDrawer('drawer-users'));
        document.getElementById('btn-toggle-shapes')?.addEventListener('click', () => this.openDrawer('drawer-shapes'));

        // Close triggers
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => this.closeDrawers());
        });
        document.getElementById('drawer-backdrop')?.addEventListener('click', () => this.closeDrawers());

        // Stroke size slider
        const sizeInput = document.getElementById('inp-tool-size');
        const sizeVal = document.getElementById('val-tool-size');
        sizeInput?.addEventListener('input', e => {
            Store.size = parseInt(e.target.value);
            if (sizeVal) sizeVal.innerText = `${Store.size}px`;
        });

        // Text Modal Controls
        document.getElementById('btn-cancel-text')?.addEventListener('click', () => this.closeTextModal());
        document.getElementById('btn-add-text')?.addEventListener('click', () => {
            const area = document.getElementById('inp-text-area');
            const txt = area?.value.trim();
            if (txt && Store.textPos) {
                DB.addElement({
                    type: 'text',
                    text: txt,
                    x: Store.textPos.x,
                    y: Store.textPos.y,
                    s: Math.min(Store.size * 3 + 18, 52),
                    c: Store.color
                });
            }
            this.closeTextModal();
        });

        // Quick Settings Actions
        document.getElementById('act-undo')?.addEventListener('click', () => DB.undo());
        document.getElementById('btn-action-undo')?.addEventListener('click', () => DB.undo());
        document.getElementById('act-toggle-minimap')?.addEventListener('click', () => this.minimap?.toggle());
        document.getElementById('act-center')?.addEventListener('click', () => {
            camera.reset();
            Events.emit('render');
            Events.emit('zoom');
            DB.syncCamera();
        });

        // Export PNG
        document.getElementById('act-export')?.addEventListener('click', () => this.exportImage());

        // Save & Load JSON
        document.getElementById('act-save-json')?.addEventListener('click', () => this.saveJSON());
        document.getElementById('act-load-json')?.addEventListener('click', () => document.getElementById('sys-file-json')?.click());
        document.getElementById('sys-file-json')?.addEventListener('change', e => this.loadJSON(e));

        // Insert Image
        document.getElementById('act-image')?.addEventListener('click', () => document.getElementById('sys-file-img')?.click());
        document.getElementById('sys-file-img')?.addEventListener('change', e => this.insertImage(e));

        // Host controls
        document.getElementById('act-clear-board')?.addEventListener('click', () => {
            if (confirm("Doskadagi barcha chizmalar o'chirilsinmi?")) {
                DB.clearBoard();
                this.closeDrawers();
            }
        });

        document.getElementById('act-disable-laser')?.addEventListener('click', () => DB.toggleLaser());

        // Copy Links
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.copy;
                const textEl = document.getElementById(`${type}-link-text`);
                if (textEl?.innerText) {
                    Utils.copyToClipboard(textEl.innerText, `${type === 'teacher' ? "O'qituvchi" : "O'quvchi"} linki nusxalandi!`);
                }
            });
        });

        // Fullscreen & Zen
        document.getElementById('btn-action-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btn-exit-zen')?.addEventListener('click', () => this.toggleFullscreen());

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            if (confirm("Chiqishni xohlaysizmi?")) {
                await authManager.logout();
                window.location.href = 'dashboard.html';
            }
        });
    }

    setTool(tool) {
        if (!Store.perms?.draw && tool !== 'pan' && tool !== 'laser') {
            const btn = document.querySelector(`[data-tool="${tool}"]`);
            btn?.classList.add('error-shake');
            setTimeout(() => btn?.classList.remove('error-shake'), 300);
            Utils.showToast("Chizish huquqiga ega emassiz", "warning");
            return;
        }

        Store.tool = tool;

        document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('is-active'));
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('is-active');

        const app = document.getElementById('app-container');
        if (app) {
            app.style.cursor = tool === 'pan' ? 'grab' : (tool === 'text' ? 'text' : 'crosshair');
        }

        Utils.vibrate(10);
    }

    openDrawer(id) {
        this.closeDrawers();
        const drawer = document.getElementById(id);
        const backdrop = document.getElementById('drawer-backdrop');

        drawer?.classList.add('is-open');
        backdrop?.classList.add('is-visible');
    }

    closeDrawers() {
        document.querySelectorAll('.drawer').forEach(d => d.classList.remove('is-open'));
        document.getElementById('drawer-backdrop')?.classList.remove('is-visible');
        this.closeTextModal();
    }

    closeTextModal() {
        document.getElementById('modal-text-input')?.classList.remove('is-visible');
        const area = document.getElementById('inp-text-area');
        if (area) area.value = '';
        Store.textPos = null;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            document.body.classList.add('zen-mode');
        } else {
            document.exitFullscreen().catch(() => {});
            document.body.classList.remove('zen-mode');
        }
    }

    exportImage() {
        const base = document.getElementById('layer-base');
        if (!base) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = base.width;
        offCanvas.height = base.height;
        const ctx = offCanvas.getContext('2d');

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
        ctx.drawImage(base, 0, 0);

        const url = offCanvas.toDataURL('image/png');
        Utils.downloadFile(url, `mrboard-${Store.roomId}-${Date.now()}.png`);
        Utils.showToast("PNG saqlandi", "success");
    }

    saveJSON() {
        const data = {
            roomId: Store.roomId,
            timestamp: Date.now(),
            elements: Store.elements || []
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        Utils.downloadFile(url, `mrboard-${Store.roomId}.json`);
        Utils.showToast("JSON loyiha saqlandi", "success");
    }

    loadJSON(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.elements && Array.isArray(data.elements)) {
                    data.elements.forEach(el => DB.addElement(el));
                    Utils.showToast("Loyiha muvaffaqiyatli yuklandi!", "success");
                }
            } catch (err) {
                Utils.showToast("JSON faylni o'qishda xatolik", "error");
            }
        };
        reader.readAsText(file);
    }

    insertImage(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target.result;
            const worldCenter = camera.toWorld(window.innerWidth / 2, window.innerHeight / 2);

            DB.addElement({
                type: 'image',
                data: dataUrl,
                x: worldCenter.x - 100,
                y: worldCenter.y - 75,
                width: 200,
                height: 150
            });
            Utils.showToast("Rasm qo'shildi", "success");
        };
        reader.readAsDataURL(file);
    }
}

// Auto-boot on DOM ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.boardPage = new BoardPage();
    });
}

export default BoardPage;
