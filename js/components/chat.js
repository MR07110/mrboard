// js/components/chat.js - Real-time Chat Drawer Component

import { Store } from '../store.js';
import { Events } from '../events.js';
import { DB } from '../api/firebase.js';
import { Utils } from '../utils.js';

export class ChatComponent {
    constructor() {
        this.drawer = document.getElementById('drawer-chat');
        this.container = document.getElementById('ui-chat-messages');
        this.input = document.getElementById('inp-chat-text');
        this.submitBtn = document.getElementById('btn-submit-chat');
        this.badge = document.getElementById('badge-chat-count');

        this.init();
    }

    init() {
        this.submitBtn?.addEventListener('click', () => this.sendMessage());
        this.input?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        Events.on('chat', msg => this.renderMessage(msg));
    }

    sendMessage() {
        if (!this.input) return;
        const text = this.input.value.trim();
        if (!text) return;

        DB.sendChat(text);
        this.input.value = '';
    }

    renderMessage(msg) {
        if (!this.container || !msg) return;

        const isMine = msg.u === Store.uid;
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${isMine ? 'mine' : 'other'}`;

        const senderName = Utils.sanitize(msg.n || 'Foydalanuvchi');
        const content = Utils.sanitize(msg.m || '');
        const time = msg.tm || Utils.getTime();

        bubble.innerHTML = `
            <div class="msg-info">
                <span>${senderName}</span>
                ${msg.t ? '<i data-lucide="crown" size="12" style="color:var(--state-warning)"></i>' : ''}
            </div>
            <div>${content}</div>
            <div class="msg-time">${time}</div>
        `;

        this.container.appendChild(bubble);
        this.container.scrollTop = this.container.scrollHeight;

        if (window.lucide) window.lucide.createIcons();

        // Increment unread count if chat drawer is closed
        const isOpen = this.drawer?.classList.contains('is-open');
        if (!isMine && !isOpen) {
            Store.unread = (Store.unread || 0) + 1;
            if (this.badge) {
                this.badge.innerText = Store.unread > 9 ? '9+' : Store.unread;
                this.badge.style.display = 'flex';
            }
            Utils.vibrate([10, 30, 10]);
        }
    }

    clearUnread() {
        Store.unread = 0;
        if (this.badge) {
            this.badge.style.display = 'none';
        }
    }
}

export default ChatComponent;
