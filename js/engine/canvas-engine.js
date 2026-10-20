// js/engine/canvas-engine.js - Main Canvas Engine Coordinating 3 Layers

import { Store } from '../store.js';
import { Events } from '../events.js';
import { DB } from '../api/firebase.js';
import { Utils } from '../utils.js';
import { camera } from './camera.js';
import { Renderer } from './renderer.js';

export class CanvasEngine {
    constructor() {
        this.layers = {
            base: document.getElementById('layer-base'),
            live: document.getElementById('layer-live'),
            laser: document.getElementById('layer-laser')
        };

        this.ctx = {
            base: this.layers.base?.getContext('2d'),
            live: this.layers.live?.getContext('2d'),
            laser: this.layers.laser?.getContext('2d')
        };

        this.isDrawing = false;
        this.lastPos = null;
        this.activeId = null;
        this.shapeStart = null;
        this.dirty = true;
        this.pinchDist = null;

        this.bounds = { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity };
    }

    getBackgroundColor() {
        return '#e2e8f0';
    }

    init() {
        if (!this.layers.base || !this.layers.live || !this.layers.laser) {
            console.error('[CanvasEngine] Canvas layers not found');
            return;
        }

        window.addEventListener('resize', () => this.resize());
        this.resize();

        Events.on('render', () => { this.dirty = true; });

        this.bindEvents();
        requestAnimationFrame(() => this.loop());
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        ['base', 'live', 'laser'].forEach(k => {
            if (this.layers[k]) {
                this.layers[k].width = w;
                this.layers[k].height = h;
            }
        });

        this.dirty = true;
    }

    bindEvents() {
        const container = document.getElementById('app-container');
        if (!container) return;

        // Mouse Wheel (Zoom & Pan)
        container.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const factor = e.deltaY > 0 ? 0.9 : 1.1;
                camera.zoomAtPoint(e.clientX, e.clientY, factor);
                Events.emit('zoom');
            } else {
                camera.pan(-e.deltaX, -e.deltaY);
            }
            this.dirty = true;
            DB.syncCamera();
        }, { passive: false });

        // Pointer Down
        container.addEventListener('pointerdown', e => {
            if (e.target.closest('.drawer') || e.target.closest('.bottom-dock') || e.target.closest('.minimap-widget') || e.target.closest('.user-info-bar')) {
                return;
            }

            e.preventDefault();
            const worldP = camera.toWorld(e.clientX, e.clientY);

            if (Store.tool === 'text') {
                if (Store.perms?.draw) {
                    Store.textPos = worldP;
                    Events.emit('open-text-modal');
                }
                return;
            }

            if (!Store.perms?.draw && Store.tool !== 'pan' && Store.tool !== 'laser') {
                return;
            }

            this.isDrawing = true;
            this.lastPos = { x: e.clientX, y: e.clientY };
            this.activeId = Utils.generateId();
            const isLaser = Store.tool === 'laser' && Store.laserEnabled;

            if (['draw', 'erase', 'laser'].includes(Store.tool)) {
                let strokeColor = Store.color;
                if (Store.tool === 'erase') {
                    strokeColor = this.getBackgroundColor();
                } else if (isLaser) {
                    strokeColor = '#ff3b30';
                }

                const strokeWidth = (Store.tool === 'erase' ? 40 : Store.size) / Store.cam.z;

                DB.addLive(this.activeId, {
                    p: [worldP],
                    c: strokeColor,
                    s: strokeWidth,
                    tl: Store.tool
                }, isLaser);
            } else if (['rect', 'circle', 'line', 'arrow'].includes(Store.tool)) {
                this.shapeStart = worldP;
                DB.addLive(this.activeId, {
                    tl: Store.tool,
                    p1: worldP,
                    p2: worldP,
                    c: Store.color,
                    s: Store.size / Store.cam.z
                });
            }
        });

        // Pointer Move
        window.addEventListener('pointermove', e => {
            if (!this.isDrawing) {
                DB.updateCursor(camera.toWorld(e.clientX, e.clientY));
                return;
            }

            if (Store.tool === 'pan') {
                camera.pan(e.clientX - this.lastPos.x, e.clientY - this.lastPos.y);
                this.lastPos = { x: e.clientX, y: e.clientY };
                this.dirty = true;
                return;
            }

            const worldP = camera.toWorld(e.clientX, e.clientY);
            const isLaser = Store.tool === 'laser' && Store.laserEnabled;
            const targetMap = isLaser ? Store.laserPaths : Store.livePaths;
            const active = targetMap?.[this.activeId];

            if (['draw', 'erase', 'laser'].includes(Store.tool) && active?.p) {
                const lastPoint = active.p[active.p.length - 1];
                if (Math.hypot(worldP.x - lastPoint.x, worldP.y - lastPoint.y) > 3 / Store.cam.z) {
                    active.p.push(worldP);
                    DB.updateLive(this.activeId, active.p, isLaser);
                }
            } else if (['rect', 'circle', 'line', 'arrow'].includes(Store.tool) && this.shapeStart) {
                DB.addLive(this.activeId, {
                    tl: Store.tool,
                    p1: this.shapeStart,
                    p2: worldP,
                    c: Store.color,
                    s: Store.size / Store.cam.z
                });
            }

            this.lastPos = { x: e.clientX, y: e.clientY };
        });

        // Pointer Up
        window.addEventListener('pointerup', () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            if (['draw', 'erase'].includes(Store.tool) && Store.livePaths?.[this.activeId]) {
                const path = Store.livePaths[this.activeId];
                if (path?.p?.length > 1) {
                    DB.addElement({
                        type: 'path',
                        p: path.p,
                        c: path.c,
                        s: path.s
                    });
                }
                DB.removeLive(this.activeId);
            } else if (['rect', 'circle', 'line', 'arrow'].includes(Store.tool) && Store.livePaths?.[this.activeId]) {
                const shape = Store.livePaths[this.activeId];
                if (shape?.p1 && shape?.p2 && Math.hypot(shape.p1.x - shape.p2.x, shape.p1.y - shape.p2.y) > 4) {
                    DB.addElement({
                        type: 'shape',
                        tl: shape.tl,
                        p1: shape.p1,
                        p2: shape.p2,
                        c: shape.c,
                        s: shape.s
                    });
                }
                DB.removeLive(this.activeId);
                this.shapeStart = null;
            } else if (Store.tool === 'laser') {
                DB.removeLive(this.activeId);
            }

            this.activeId = null;
        });

        // Touch Pinch-to-Zoom
        container.addEventListener('touchstart', e => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this.pinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });

        container.addEventListener('touchmove', e => {
            if (e.touches.length === 2 && this.pinchDist) {
                e.preventDefault();
                const newDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                const factor = newDist / this.pinchDist;
                camera.zoomAtPoint(midX, midY, factor);
                this.pinchDist = newDist;
                this.dirty = true;
                Events.emit('zoom');
                DB.syncCamera();
            }
        });

        container.addEventListener('touchend', () => {
            this.pinchDist = null;
        });
    }

    loop() {
        if (this.dirty) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const { base, live, laser } = this.ctx;

            if (base) base.clearRect(0, 0, w, h);
            if (live) live.clearRect(0, 0, w, h);
            if (laser) laser.clearRect(0, 0, w, h);

            this.bounds = { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity };

            // 1. Base Layer (Persisted elements)
            if (base) {
                base.save();
                base.translate(Store.cam.x, Store.cam.y);
                base.scale(Store.cam.z, Store.cam.z);

                Store.elements?.forEach(el => {
                    if (el.type === 'path') {
                        Renderer.drawPath(base, el.p, el.c, el.s);
                        el.p?.forEach(p => this.updateBounds(p.x, p.y));
                    } else if (el.type === 'shape') {
                        Renderer.drawShape(base, el);
                        this.updateBounds(el.p1.x, el.p1.y);
                        this.updateBounds(el.p2.x, el.p2.y);
                    } else if (el.type === 'text') {
                        Renderer.drawText(base, el);
                        this.updateBounds(el.x, el.y);
                    } else if (el.type === 'image' && el.data) {
                        Renderer.drawImage(base, el, () => { this.dirty = true; });
                        this.updateBounds(el.x, el.y);
                        this.updateBounds(el.x + (el.width || 200), el.y + (el.height || 150));
                    }
                });

                base.restore();
            }

            // 2. Live Layer (In-progress strokes & shapes)
            if (live) {
                live.save();
                live.translate(Store.cam.x, Store.cam.y);
                live.scale(Store.cam.z, Store.cam.z);

                Object.values(Store.livePaths || {}).forEach(e => {
                    if (e?.p) Renderer.drawPath(live, e.p, e.c, e.s);
                    else if (e?.p1) Renderer.drawShape(live, e);
                });

                live.restore();
            }

            // 3. Laser Layer (Wand trails)
            if (Store.laserEnabled && laser) {
                laser.save();
                laser.translate(Store.cam.x, Store.cam.y);
                laser.scale(Store.cam.z, Store.cam.z);

                Object.values(Store.laserPaths || {}).forEach(e => {
                    if (e?.p) Renderer.drawPath(laser, e.p, e.c, e.s, true);
                });

                laser.restore();
            }

            // 4. Remote Cursors
            if (live) {
                live.save();
                Renderer.drawCursors(live, Store.cursors, Store.name, (x, y) => camera.toScreen(x, y));
                live.restore();
            }

            Events.emit('bounds-updated', { bounds: this.bounds, viewWidth: w, viewHeight: h });
            this.dirty = false;
        }

        requestAnimationFrame(() => this.loop());
    }

    updateBounds(x, y) {
        if (x !== undefined && y !== undefined) {
            this.bounds.xMin = Math.min(this.bounds.xMin, x);
            this.bounds.xMax = Math.max(this.bounds.xMax, x);
            this.bounds.yMin = Math.min(this.bounds.yMin, y);
            this.bounds.yMax = Math.max(this.bounds.yMax, y);
        }
    }
}

export default CanvasEngine;
