// js/pages/dashboard.js - Dashboard State & Room Management Controller

import { authManager } from '../auth/auth-manager.js';
import { RoomAPI, getFirebase } from '../api/firebase.js';
import { Utils } from '../utils.js';
import { initDonateModal } from '../components/donate-modal.js';

export class DashboardPage {
    constructor() {
        this.user = null;
        this.allRooms = [];
        this.myRooms = [];
        this.searchQuery = '';
        this.activeTab = 'home';
        this.editingRoomId = null;

        this.init();
    }

    async init() {
        this.initTheme();

        // Check authentication (requires real account for dashboard)
        this.user = await authManager.init();
        if (!this.user || this.user.isAnonymous) {
            localStorage.removeItem('mr_user');
            window.location.replace('/board/');
            return;
        }

        // Authenticated verified: reveal dashboard layout
        document.body.style.setProperty('display', 'flex', 'important');

        this.updateHeaderProfile();
        this.bindEvents();
        await this.loadPublicRooms();
        await this.loadMyRooms();

        initDonateModal();

        if (window.lucide) window.lucide.createIcons();
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.removeItem('mrboard_theme');
    }

    updateHeaderProfile() {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const welcomeEl = document.getElementById('welcome-message');

        const displayName = this.user.firstName || this.user.fullName || this.user.username || this.user.email?.split('@')[0];
        const initial = displayName.charAt(0).toUpperCase();

        if (nameEl) nameEl.textContent = displayName;
        if (avatarEl) avatarEl.textContent = initial;
        if (welcomeEl) welcomeEl.textContent = `Assalomu alaykum, ${displayName}!`;
    }

    bindEvents() {
        // Search Input
        document.getElementById('search-input')?.addEventListener('input', e => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderRooms();
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.dataset.tab;
                this.renderRooms();
            });
        });

        // Create Room Modal
        document.getElementById('btn-open-create-room')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('btn-close-create-modal')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('btn-confirm-create')?.addEventListener('click', () => this.handleCreateRoom());

        // Join Room by Code Modal
        document.getElementById('btn-open-join-room')?.addEventListener('click', () => this.openJoinModal());
        document.getElementById('btn-close-join-modal')?.addEventListener('click', () => this.closeJoinModal());
        document.getElementById('btn-confirm-join')?.addEventListener('click', () => this.handleJoinRoomByCode());

        // Edit Room Modal
        document.getElementById('btn-close-edit-modal')?.addEventListener('click', () => this.closeEditModal());
        document.getElementById('btn-save-edit')?.addEventListener('click', () => this.handleSaveEdit());

        // Room Type Selectors (Public / Private)
        this.bindTypeSelectors('create');
        this.bindTypeSelectors('edit');

        // Modal backdrop close
        document.getElementById('dashModalBackdrop')?.addEventListener('click', () => this.closeAllModals());

        // Logout
        document.getElementById('btn-dash-logout')?.addEventListener('click', async () => {
            if (confirm("Chiqishni xohlaysizmi?")) {
                await authManager.logout();
                window.location.href = '/board/';
            }
        });
    }

    bindTypeSelectors(prefix) {
        const publicBtn = document.getElementById(`${prefix}-type-public`);
        const privateBtn = document.getElementById(`${prefix}-type-private`);
        const passGroup = document.getElementById(`${prefix}-password-group`);

        publicBtn?.addEventListener('click', () => {
            publicBtn.classList.add('active');
            privateBtn?.classList.remove('active');
            if (passGroup) passGroup.style.display = 'none';
        });

        privateBtn?.addEventListener('click', () => {
            privateBtn.classList.add('active');
            publicBtn?.classList.remove('active');
            if (passGroup) passGroup.style.display = 'block';
        });
    }

    async loadPublicRooms() {
        try {
            this.allRooms = await RoomAPI.getPublicRooms();
            this.renderRooms();
            this.updateStats();
        } catch (err) {
            console.error('[Dashboard] Error loading public rooms:', err);
        }
    }

    async loadMyRooms() {
        if (!this.user?.uid) return;
        try {
            this.myRooms = await RoomAPI.getUserRooms(this.user.uid);
            this.updateStats();
        } catch (err) {
            console.error('[Dashboard] Error loading my rooms:', err);
        }
    }

    updateStats() {
        const activeCount = document.getElementById('stat-active-rooms');
        const myCount = document.getElementById('stat-my-rooms');

        if (activeCount) activeCount.textContent = this.allRooms.length;
        if (myCount) myCount.textContent = this.myRooms.length;
    }

    renderRooms() {
        const container = document.getElementById('rooms-grid-container');
        if (!container) return;

        const isMyTab = this.activeTab === 'myrooms';
        const sourceRooms = isMyTab ? this.myRooms : this.allRooms;

        let filtered = sourceRooms;
        if (this.searchQuery) {
            filtered = sourceRooms.filter(r =>
                (r.name || '').toLowerCase().includes(this.searchQuery) ||
                (r.id || '').toLowerCase().includes(this.searchQuery) ||
                (r.createdByName || '').toLowerCase().includes(this.searchQuery)
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" size="48" style="opacity:0.4; margin-bottom:12px;"></i>
                    <p>${isMyTab ? "Sizda hali yaratilgan xonalar yo'q" : "Mos xonalar topilmadi"}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = filtered.map(room => {
            const isOwner = room.createdBy === this.user?.uid;
            const initial = (room.createdByName || 'U').charAt(0).toUpperCase();

            return `
                <div class="room-card" onclick="window.location.href='/board/?room=${room.id}'">
                    <div class="room-card-header">
                        <span class="room-title">${Utils.sanitize(room.name || 'Nomsiz xona')}</span>
                        <span class="room-badge ${room.isPublic ? 'active' : 'private'}">
                            ${room.isPublic ? '<i data-lucide="globe" size="12"></i> Ochiq' : '<i data-lucide="lock" size="12"></i> Maxfiy'}
                        </span>
                    </div>
                    <div class="creator-info">
                        <div class="creator-avatar">${initial}</div>
                        <span>${Utils.sanitize(room.createdByName || 'Foydalanuvchi')}</span>
                    </div>
                    <div class="room-meta">
                        <span><i data-lucide="hash" size="12"></i> ${room.id}</span>
                        <span><i data-lucide="calendar" size="12"></i> ${Utils.formatDate(room.createdAt)}</span>
                    </div>
                    <div style="display:flex; gap:8px; margin-top:8px;">
                        <button class="btn btn-primary" style="flex:1;" onclick="event.stopPropagation(); window.location.href='/board/?room=${room.id}'">
                            <i data-lucide="log-in" size="14"></i> Kirish
                        </button>
                        ${isOwner ? `
                            <button class="btn btn-ghost" title="Tahrirlash" onclick="event.stopPropagation(); window.dashboardPage.openEditModal('${room.id}')">
                                <i data-lucide="edit-2" size="14"></i>
                            </button>
                            <button class="btn btn-ghost" title="O'chirish" onclick="event.stopPropagation(); window.dashboardPage.handleDeleteRoom('${room.id}')">
                                <i data-lucide="trash-2" size="14" style="color:var(--state-danger)"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    openCreateModal() {
        document.getElementById('createRoomModal')?.classList.add('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.add('is-visible');
        document.getElementById('create-room-name')?.focus();
    }

    closeCreateModal() {
        document.getElementById('createRoomModal')?.classList.remove('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.remove('is-visible');
    }

    async handleCreateRoom() {
        const name = document.getElementById('create-room-name')?.value.trim();
        const isPublic = document.getElementById('create-type-public')?.classList.contains('active');
        const password = !isPublic ? document.getElementById('create-room-password')?.value.trim() : null;

        if (!name) {
            Utils.showToast("Xona nomini kiriting", "warning");
            return;
        }

        try {
            const room = await RoomAPI.createRoom(name, isPublic, password);
            Utils.showToast("Xona muvaffaqiyatli yaratildi!", "success");
            this.closeCreateModal();
            window.location.href = `/board/#t-${room.teacherSecret}`;
        } catch (err) {
            Utils.showToast(err.message || "Xona yaratishda xatolik", "error");
        }
    }

    openJoinModal() {
        document.getElementById('joinRoomModal')?.classList.add('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.add('is-visible');
        document.getElementById('join-room-code')?.focus();
    }

    closeJoinModal() {
        document.getElementById('joinRoomModal')?.classList.remove('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.remove('is-visible');
    }

    async handleJoinRoomByCode() {
        const code = document.getElementById('join-room-code')?.value.toUpperCase().trim();
        const password = document.getElementById('join-room-password')?.value.trim();

        if (!code) {
            Utils.showToast("Xona kodini kiriting", "warning");
            return;
        }

        try {
            const room = await RoomAPI.getRoom(code);
            if (!room || room.isActive === false) {
                Utils.showToast("Bunday xona mavjud emas yoki yakunlangan", "error");
                return;
            }

            if (room.hasPassword && room.password !== password) {
                Utils.showToast("Xona paroli noto'g'ri", "error");
                return;
            }

            this.closeJoinModal();
            window.location.href = `/board/?room=${code}`;
        } catch (err) {
            Utils.showToast("Xonaga ulanishda xatolik", "error");
        }
    }

    openEditModal(roomId) {
        this.editingRoomId = roomId;
        const room = [...this.allRooms, ...this.myRooms].find(r => r.id === roomId);
        if (!room) return;

        const nameInput = document.getElementById('edit-room-name');
        const publicBtn = document.getElementById('edit-type-public');
        const privateBtn = document.getElementById('edit-type-private');
        const passGroup = document.getElementById('edit-password-group');
        const passInput = document.getElementById('edit-room-password');

        if (nameInput) nameInput.value = room.name || '';

        if (room.isPublic) {
            publicBtn?.classList.add('active');
            privateBtn?.classList.remove('active');
            if (passGroup) passGroup.style.display = 'none';
        } else {
            privateBtn?.classList.add('active');
            publicBtn?.classList.remove('active');
            if (passGroup) passGroup.style.display = 'block';
            if (passInput) passInput.value = room.password || '';
        }

        document.getElementById('editRoomModal')?.classList.add('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.add('is-visible');
    }

    closeEditModal() {
        document.getElementById('editRoomModal')?.classList.remove('is-visible');
        document.getElementById('dashModalBackdrop')?.classList.remove('is-visible');
        this.editingRoomId = null;
    }

    async handleSaveEdit() {
        if (!this.editingRoomId) return;

        const name = document.getElementById('edit-room-name')?.value.trim();
        const isPublic = document.getElementById('edit-type-public')?.classList.contains('active');
        const password = !isPublic ? document.getElementById('edit-room-password')?.value.trim() : null;

        try {
            await RoomAPI.updateRoom(this.editingRoomId, {
                name: name || 'Nomsiz xona',
                isPublic: !!isPublic,
                hasPassword: !!password,
                password: password || null
            });

            Utils.showToast("Xona muvaffaqiyatli yangilandi", "success");
            this.closeEditModal();
            await this.loadPublicRooms();
            await this.loadMyRooms();
        } catch (err) {
            Utils.showToast("Saqlashda xatolik", "error");
        }
    }

    async handleDeleteRoom(roomId) {
        if (!confirm("Ushbu xonani o'chirishni tasdiqlaysizmi?")) return;

        try {
            await RoomAPI.deleteRoom(roomId);
            Utils.showToast("Xona o'chirildi", "success");
            await this.loadPublicRooms();
            await this.loadMyRooms();
        } catch (err) {
            Utils.showToast("O'chirishda xatolik", "error");
        }
    }

    closeAllModals() {
        this.closeCreateModal();
        this.closeJoinModal();
        this.closeEditModal();
    }
}

// Auto-boot on DOM ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardPage = new DashboardPage();
    });
}

export default DashboardPage;
