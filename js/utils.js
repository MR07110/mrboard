// js/utils.js - Shared Production Utilities

export const Utils = {
    generateId(length = 8) {
        return Math.random().toString(36).substring(2, 2 + length) + Date.now().toString(36).slice(-4);
    },

    sanitize(str) {
        if (!str || typeof str !== 'string') return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    escapeHtml(str) {
        return this.sanitize(str);
    },

    throttle(fn, wait) {
        let lastTime = 0;
        let timeout = null;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= wait) {
                lastTime = now;
                fn.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    lastTime = Date.now();
                    timeout = null;
                    fn.apply(this, args);
                }, wait - (now - lastTime));
            }
        };
    },

    debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    vibrate(pattern = 15) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (_) {}
        }
    },

    getTime() {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    formatDate(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    },

    showToast(message, type = 'info', duration = 3000) {
        let wrapper = document.getElementById('toast-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'toast-wrapper';
            wrapper.className = 'toast-wrapper';
            document.body.appendChild(wrapper);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'check-circle-2',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" size="18"></i>
            <span>${this.sanitize(message)}</span>
        `;

        wrapper.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-12px)';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },

    async copyToClipboard(text, successMessage = "Nusxa olindi!") {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            this.showToast(successMessage, 'success');
            return true;
        } catch (err) {
            this.showToast("Nusxa olishda xatolik yuz berdi", 'error');
            return false;
        }
    },

    downloadFile(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

export const showToast = (msg, type, duration) => Utils.showToast(msg, type, duration);
export default Utils;
