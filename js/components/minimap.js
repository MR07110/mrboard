// js/components/minimap.js - Real-time Board Minimap Component

import { Store } from '../store.js';
import { Events } from '../events.js';
import { Renderer } from '../engine/renderer.js';

export class MinimapComponent {
    constructor() {
        this.widget = document.getElementById('minimap-widget');
        this.canvas = document.getElementById('minimap-cvs');
        this.ctx = this.canvas?.getContext('2d');
        this.viewIndicator = document.getElementById('minimap-view');
        this.closeBtn = document.getElementById('btn-close-minimap');

        this.init();
    }

    init() {
        if (!this.widget || !this.canvas || !this.ctx || !this.viewIndicator) return;

        this.closeBtn?.addEventListener('click', () => this.toggle(false));

        Events.on('bounds-updated', ({ bounds, viewWidth, viewHeight }) => {
            this.render(bounds, viewWidth, viewHeight);
        });
    }

    toggle(forceState) {
        Store.minimapVisible = typeof forceState === 'boolean' ? forceState : !Store.minimapVisible;
        if (Store.minimapVisible) {
            this.widget?.classList.remove('is-hidden');
        } else {
            this.widget?.classList.add('is-hidden');
        }
    }

    render(bounds, viewWidth, viewHeight) {
        if (!Store.minimapVisible || bounds.xMin === Infinity) return;

        const mmW = this.canvas.parentElement.clientWidth || 180;
        const mmH = this.canvas.parentElement.clientHeight || 110;

        this.canvas.width = mmW;
        this.canvas.height = mmH;
        this.ctx.clearRect(0, 0, mmW, mmH);

        const pad = Math.max(60, (bounds.xMax - bounds.xMin) * 0.12);
        const b = {
            xMin: bounds.xMin - pad,
            xMax: bounds.xMax + pad,
            yMin: bounds.yMin - pad,
            yMax: bounds.yMax + pad
        };

        const scale = Math.min(mmW / (b.xMax - b.xMin), mmH / (b.yMax - b.yMin));
        const offX = mmW / 2 - (b.xMin + (b.xMax - b.xMin) / 2) * scale;
        const offY = mmH / 2 - (b.yMin + (b.yMax - b.yMin) / 2) * scale;

        this.ctx.save();
        this.ctx.translate(offX, offY);
        this.ctx.scale(scale, scale);

        Store.elements?.forEach(el => {
            if (el.type === 'path') {
                Renderer.drawPath(this.ctx, el.p, el.c, Math.max(1.5, el.s * scale));
            } else if (el.type === 'shape') {
                Renderer.drawShape(this.ctx, el);
            }
        });

        this.ctx.restore();

        const viewX = (-Store.cam.x / Store.cam.z) * scale + offX;
        const viewY = (-Store.cam.y / Store.cam.z) * scale + offY;
        const viewW = (viewWidth / Store.cam.z) * scale;
        const viewH = (viewHeight / Store.cam.z) * scale;

        this.viewIndicator.style.width = `${Math.max(20, viewW)}px`;
        this.viewIndicator.style.height = `${Math.max(15, viewH)}px`;
        this.viewIndicator.style.transform = `translate(${Math.max(0, Math.min(viewX, mmW - viewW))}px, ${Math.max(0, Math.min(viewY, mmH - viewH))}px)`;
    }
}

export default MinimapComponent;
