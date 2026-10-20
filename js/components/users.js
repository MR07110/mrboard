// js/components/users.js - Participants & Permissions Component

import { Store } from '../store.js';
import { Events } from '../events.js';
import { DB } from '../api/firebase.js';
import { Utils } from '../utils.js';

export class UsersComponent {
    constructor() {
        this.list = document.getElementById('ui-participants-list');
        this.badge = document.getElementById('badge-users-count');

        this.init();
    }

    init() {
        Events.on('users', () => this.render());
    }

    render() {
        if (!this.list) return;

        let html = '';
        let studentCount = 0;

        Object.values(Store.users || {}).forEach(p => {
            if (p.t && p.id !== Store.uid) return;
            if (!p.t) studentCount++;

            const displayName = Utils.sanitize(p.n || 'Foydalanuvchi');
            const initial = displayName.charAt(0).toUpperCase() || 'U';

            html += `
                <div class="user-card">
                    <div class="user-meta">
                        <div class="avatar">${initial}</div>
                        <span>${displayName}</span>
                        ${p.t ? '<i data-lucide="crown" size="14" style="color:var(--state-warning)"></i>' : ''}
                    </div>
                    <div class="perm-actions">
            `;

            if (Store.isTeacher && !p.t) {
                html += `
                    <button class="perm-btn ${p.d ? 'is-granted' : ''}" data-user="${p.id}" data-perm="d" title="Chizish huquqi">
                        <i data-lucide="pencil" size="14"></i>
                    </button>
                    <button class="perm-btn ${p.s ? 'is-granted' : ''}" data-user="${p.id}" data-perm="s" title="Mikrofon huquqi">
                        <i data-lucide="mic" size="14"></i>
                    </button>
                    <button class="perm-btn" data-user="${p.id}" data-perm="kick" title="Chiqarib yuborish">
                        <i data-lucide="user-x" size="14"></i>
                    </button>
                `;
            } else if (!Store.isTeacher && p.t) {
                html += `<span style="font-size:11px; color:var(--text-muted);">O'qituvchi</span>`;
            } else if (!Store.isTeacher) {
                html += `<span style="font-size:12px;">${p.d ? '✏️' : '👁️'} ${p.s ? '🎤' : '🔇'}</span>`;
            }

            html += `</div></div>`;
        });

        if (studentCount === 0) {
            html = `<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">
                ${Store.isTeacher ? "Hozircha o'quvchilar yo'q" : "Xonada faqat o'qituvchi"}
            </div>`;
        }

        this.list.innerHTML = html;

        if (this.badge) {
            this.badge.innerText = studentCount;
            this.badge.style.display = studentCount > 0 ? 'flex' : 'none';
        }

        if (window.lucide) window.lucide.createIcons();

        // Teacher actions binding
        if (Store.isTeacher) {
            this.list.querySelectorAll('.perm-btn[data-perm="d"]').forEach(btn => {
                btn.onclick = () => {
                    const uid = btn.dataset.user;
                    const granted = btn.classList.contains('is-granted');
                    DB.setPerm(uid, 'd', !granted);
                };
            });

            this.list.querySelectorAll('.perm-btn[data-perm="s"]').forEach(btn => {
                btn.onclick = () => {
                    const uid = btn.dataset.user;
                    const granted = btn.classList.contains('is-granted');
                    DB.setPerm(uid, 's', !granted);
                };
            });

            this.list.querySelectorAll('.perm-btn[data-perm="kick"]').forEach(btn => {
                btn.onclick = () => {
                    if (confirm("Ushbu foydalanuvchini xonadan chiqarmoqchimisiz?")) {
                        DB.kickUser(btn.dataset.user);
                    }
                };
            });
        }
    }
}

export default UsersComponent;
