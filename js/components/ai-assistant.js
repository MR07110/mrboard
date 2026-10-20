// js/components/ai-assistant.js - Floating AI Assistant Component

import { aiAssistant } from '../api/ai.js';
import { Utils } from '../utils.js';

export class AIAssistantComponent {
    constructor() {
        this.history = [];
        this.isProcessing = false;

        this.mount();
        this.bindEvents();
    }

    mount() {
        if (document.getElementById('floatingAiBtn')) return;

        // 1. Floating Trigger Button
        const btn = document.createElement('button');
        btn.id = 'floatingAiBtn';
        btn.setAttribute('title', 'MR BOARD AI Yordamchi');
        btn.innerHTML = `<i data-lucide="sparkles" size="26"></i>`;
        document.body.appendChild(btn);

        // 2. Modal Overlay & Container
        const overlay = document.createElement('div');
        overlay.id = 'aiModalOverlay';
        overlay.innerHTML = `
            <div id="aiModalContainer">
                <div class="ai-header-bar">
                    <div class="ai-header-title">
                        <div class="ai-status-dot"></div>
                        <span>MR BOARD AI</span>
                    </div>
                    <button class="btn-close" id="btn-close-ai"><i data-lucide="x"></i></button>
                </div>
                <div class="ai-messages-body" id="ai-messages-body">
                    <div class="ai-bubble assistant">
                        👋 Salom! Men MR BOARD sun'iy intellekt yordamchisiman. Doskadan samarali foydalanish, darslar o'tish yoki xonalar yaratish bo'yicha qanday yordam bera olaman?
                    </div>
                </div>
                <div class="ai-composer">
                    <input type="text" id="ai-chat-input" class="ai-input" placeholder="Savolingizni yozing..." maxlength="400">
                    <button id="btn-send-ai" class="ai-send-btn"><i data-lucide="send" size="18"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        const btn = document.getElementById('floatingAiBtn');
        const overlay = document.getElementById('aiModalOverlay');
        const closeBtn = document.getElementById('btn-close-ai');
        const sendBtn = document.getElementById('btn-send-ai');
        const input = document.getElementById('ai-chat-input');

        btn?.addEventListener('click', () => this.open());
        closeBtn?.addEventListener('click', () => this.close());

        overlay?.addEventListener('click', e => {
            if (e.target === overlay) this.close();
        });

        sendBtn?.addEventListener('click', () => this.send());
        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.send();
            }
        });
    }

    open() {
        const overlay = document.getElementById('aiModalOverlay');
        overlay?.classList.add('is-open');
        setTimeout(() => document.getElementById('ai-chat-input')?.focus(), 200);
    }

    close() {
        const overlay = document.getElementById('aiModalOverlay');
        overlay?.classList.remove('is-open');
    }

    async send() {
        const input = document.getElementById('ai-chat-input');
        if (!input || this.isProcessing) return;

        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.appendMessage('user', text);
        this.history.push({ role: 'user', content: text });

        this.isProcessing = true;
        const loadingBubble = this.appendMessage('assistant', '🤔 O\'ylayapman...');

        try {
            const answer = await aiAssistant.chat(this.history);
            loadingBubble.innerHTML = Utils.sanitize(answer).replace(/\n/g, '<br>');
            this.history.push({ role: 'assistant', content: answer });
        } catch (err) {
            loadingBubble.innerText = "Kechirasiz, xatolik yuz berdi.";
        } finally {
            this.isProcessing = false;
        }
    }

    appendMessage(role, text) {
        const body = document.getElementById('ai-messages-body');
        if (!body) return null;

        const bubble = document.createElement('div');
        bubble.className = `ai-bubble ${role}`;
        bubble.innerHTML = Utils.sanitize(text).replace(/\n/g, '<br>');

        body.appendChild(bubble);
        body.scrollTop = body.scrollHeight;
        return bubble;
    }
}

export const initAIAssistant = () => new AIAssistantComponent();
export default initAIAssistant;
