// js/components/color-picker.js - HSV Color Wheel & Enterprise Palette Component

import { Store } from '../store.js';
import { Events } from '../events.js';

export class ColorPickerComponent {
    constructor() {
        this.canvas = document.getElementById('cvs-color-picker');
        this.ctx = this.canvas?.getContext('2d');
        this.brightSlider = document.getElementById('inp-color-bright');
        this.indicator = document.getElementById('ui-current-color');
        this.paletteContainer = document.getElementById('ui-quick-palette');

        this.brightness = 1;
        this.palette = [
            '#007aff', '#34c759', '#ff3b30', '#ff9500', '#af52de',
            '#ff2d55', '#5856d6', '#00c7be', '#32ade6', '#a2845e',
            '#0f172a', '#334155', '#64748b', '#94a3b8', '#ffffff'
        ];

        this.init();
    }

    init() {
        if (!this.canvas || !this.ctx) return;

        this.drawWheel();
        this.renderPalette();
        this.bindEvents();
        this.updateIndicator(Store.color);
    }

    drawWheel() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - 4;

        const imgData = this.ctx.createImageData(w, h);
        const data = imgData.data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.hypot(dx, dy);

                if (dist <= radius) {
                    const angle = Math.atan2(dy, dx) + Math.PI;
                    const hue = (angle / (Math.PI * 2)) * 360;
                    const sat = dist / radius;
                    const [r, g, b] = this.hsvToRgb(hue, sat, this.brightness);

                    const idx = (y * w + x) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
    }

    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let [r, g, b] = [0, 0, 0];

        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    bindEvents() {
        const pick = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const pixel = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;

            if (pixel[3] > 0) {
                const hex = this.rgbToHex(pixel[0], pixel[1], pixel[2]);
                this.setColor(hex);
            }
        };

        let dragging = false;
        this.canvas.addEventListener('pointerdown', e => {
            dragging = true;
            pick(e);
        });

        window.addEventListener('pointermove', e => {
            if (dragging) pick(e);
        });

        window.addEventListener('pointerup', () => {
            dragging = false;
        });

        this.brightSlider?.addEventListener('input', e => {
            this.brightness = parseInt(e.target.value) / 100;
            this.drawWheel();
        });
    }

    renderPalette() {
        if (!this.paletteContainer) return;
        this.paletteContainer.innerHTML = '';

        this.palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-swatch';
            swatch.style.backgroundColor = color;
            if (color.toLowerCase() === Store.color.toLowerCase()) {
                swatch.classList.add('active');
            }

            swatch.addEventListener('click', () => {
                this.setColor(color);
                document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });

            this.paletteContainer.appendChild(swatch);
        });
    }

    setColor(hex) {
        Store.color = hex;
        this.updateIndicator(hex);
        Events.emit('color-changed', hex);
    }

    updateIndicator(hex) {
        if (this.indicator) {
            this.indicator.style.backgroundColor = hex;
        }
    }
}

export default ColorPickerComponent;
