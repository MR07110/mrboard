// js/components/audio.js - Web Audio Equalizer & Microphone Component

import { Store } from '../store.js';
import { Events } from '../events.js';
import { Utils } from '../utils.js';

export class AudioComponent {
    constructor() {
        this.micBtn = document.getElementById('btn-action-mic');
        this.eqBars = document.querySelectorAll('.viz-bar');

        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.animFrameId = null;

        this.init();
    }

    init() {
        this.micBtn?.addEventListener('click', () => this.toggle());

        Events.on('mic', () => this.updateUI());
    }

    async toggle() {
        if (!Store.isTeacher && !Store.perms?.speak) {
            Utils.showToast("Mikrofon huquqingiz yo'q", "warning");
            this.micBtn?.classList.add('error-shake');
            setTimeout(() => this.micBtn?.classList.remove('error-shake'), 300);
            return;
        }

        if (Store.micActive) {
            this.stopMic();
        } else {
            await this.startMic();
        }
    }

    async startMic() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 32;
            source.connect(this.analyser);

            Store.micActive = true;
            Events.emit('mic');
            this.startVisualizer();
            Utils.showToast("Mikrofon yoqildi", "success");
        } catch (err) {
            console.error('[Audio] getUserMedia error:', err);
            Store.micActive = false;
            Events.emit('mic');
            this.showPermissionModal();
        }
    }

    stopMic() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        this.eqBars.forEach(b => { b.style.height = '4px'; });

        Store.micActive = false;
        Events.emit('mic');
        Utils.showToast("Mikrofon o'chirildi", "info");
    }

    startVisualizer() {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const update = () => {
            if (!Store.micActive || !this.analyser) {
                this.eqBars.forEach(b => { b.style.height = '4px'; });
                return;
            }

            this.analyser.getByteFrequencyData(dataArray);

            this.eqBars.forEach((bar, index) => {
                const val = dataArray[index * 2] || 0;
                const h = Math.max(4, (val / 255) * 20);
                bar.style.height = `${h}px`;
            });

            this.animFrameId = requestAnimationFrame(update);
        };

        this.animFrameId = requestAnimationFrame(update);
    }

    updateUI() {
        if (!this.micBtn) return;

        if (Store.micActive) {
            this.micBtn.className = 'action-btn mic-on';
            this.micBtn.innerHTML = '<i data-lucide="mic"></i>';
        } else {
            this.micBtn.className = 'action-btn mic-off';
            this.micBtn.innerHTML = '<i data-lucide="mic-off"></i>';
        }

        if (window.lucide) window.lucide.createIcons();
    }

    showPermissionModal() {
        Utils.showToast("Brauzer sozlamalaridan mikrofonga ruxsat bering!", "error", 4000);
    }
}

export const AudioSystem = new AudioComponent();
export default AudioSystem;
