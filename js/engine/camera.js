// js/engine/camera.js - Camera Pan & Zoom Controller

import { Store } from '../store.js';
import { appConfig } from '../config.js';

export class Camera {
    constructor() {
        this.minZoom = appConfig.minZoom;
        this.maxZoom = appConfig.maxZoom;
    }

    toWorld(clientX, clientY) {
        const cam = Store.cam || { x: 0, y: 0, z: 1 };
        return {
            x: (clientX - cam.x) / cam.z,
            y: (clientY - cam.y) / cam.z
        };
    }

    toScreen(worldX, worldY) {
        const cam = Store.cam || { x: 0, y: 0, z: 1 };
        return {
            x: worldX * cam.z + cam.x,
            y: worldY * cam.z + cam.y
        };
    }

    zoomAtPoint(clientX, clientY, factor) {
        const cam = Store.cam;
        const worldP = this.toWorld(clientX, clientY);
        const newZ = Math.min(this.maxZoom, Math.max(this.minZoom, cam.z * factor));
        cam.z = newZ;
        cam.x = clientX - worldP.x * newZ;
        cam.y = clientY - worldP.y * newZ;
    }

    pan(deltaX, deltaY) {
        Store.cam.x += deltaX;
        Store.cam.y += deltaY;
    }

    reset() {
        Store.cam.x = 0;
        Store.cam.y = 0;
        Store.cam.z = 1;
    }
}

export const camera = new Camera();
export default camera;
