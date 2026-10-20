// js/store.js - MR BOARD Reactive Central State

import { appConfig } from './config.js';

function createId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export const Store = {
    uid: createId(),
    user: null,
    name: '',
    isTeacher: false,
    roomId: '',
    teacherSecret: '',
    perms: { draw: false, speak: false },
    micActive: false,
    tool: 'draw',
    color: appConfig.defaultStrokeColor,
    size: appConfig.defaultStrokeSize,
    cam: { x: 0, y: 0, z: appConfig.defaultZoom },
    elements: [],
    livePaths: {},
    laserPaths: {},
    cursors: {},
    users: {},
    unread: 0,
    textPos: null,
    laserEnabled: true,
    minimapVisible: true,

    resetRoomState() {
        this.elements = [];
        this.livePaths = {};
        this.laserPaths = {};
        this.cursors = {};
        this.users = {};
        this.unread = 0;
        this.textPos = null;
        this.cam = { x: 0, y: 0, z: appConfig.defaultZoom };
    }
};

export default Store;
