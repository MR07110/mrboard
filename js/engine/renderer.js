// js/engine/renderer.js - Multi-Layer Canvas Renderer

import { Store } from '../store.js';

export class Renderer {
    static drawPath(ctx, points, color, width, glow = false) {
        if (!points || points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (glow) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = color;
        }

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const midX = (points[i].x + points[i + 1].x) / 2;
            const midY = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();

        if (glow) {
            ctx.shadowBlur = 0;
        }
    }

    static drawShape(ctx, el) {
        const { p1, p2, tl, c, s } = el;
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.strokeStyle = c;
        ctx.lineWidth = s;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tl === 'rect') {
            ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        } else if (tl === 'circle') {
            const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tl === 'line') {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        } else if (tl === 'arrow') {
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const headSize = Math.max(14, 20 / (Store.cam?.z || 1));

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(
                p2.x - headSize * Math.cos(angle - Math.PI / 6),
                p2.y - headSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(
                p2.x - headSize * Math.cos(angle + Math.PI / 6),
                p2.y - headSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }
    }

    static drawText(ctx, el) {
        ctx.font = `800 ${Math.min(el.s || 24, 48)}px -apple-system, sans-serif`;
        ctx.fillStyle = el.c || '#007aff';
        ctx.fillText(el.text, el.x, el.y);
    }

    static drawImage(ctx, el, onImageLoaded) {
        if (!el.img) {
            el.img = new Image();
            el.img.src = el.data;
            el.img.onload = () => {
                if (onImageLoaded) onImageLoaded();
            };
        }
        if (el.img.complete) {
            ctx.drawImage(el.img, el.x, el.y, el.width || 200, el.height || 150);
        }
    }

    static drawCursors(ctx, cursors, currentUserName, toScreenFn) {
        if (!cursors) return;

        Object.values(cursors).forEach(c => {
            if (!c || c.n === currentUserName || typeof c.x !== 'number') return;
            const pos = toScreenFn(c.x, c.y);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = c.t ? '#ffcc00' : '#ff3b30';
            ctx.fill();

            // Name tag
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            const textWidth = ctx.measureText(c.n).width;
            ctx.fillRect(pos.x + 8, pos.y - 12, textWidth + 12, 18);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.fillText(c.n, pos.x + 14, pos.y + 1);
        });
    }
}

export default Renderer;
