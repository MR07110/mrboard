// js/api/firebase.js - Modular Firebase RTDB & Auth Service

import { firebaseConfig } from '../config.js';
import { Store } from '../store.js';
import { Events } from '../events.js';
import { Utils } from '../utils.js';

let initialized = false;
let db = null;
let auth = null;
let currentRoomRef = null;

export function getFirebase() {
    if (!initialized && typeof window !== 'undefined' && window.firebase) {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        db = window.firebase.database();
        auth = window.firebase.auth();
        initialized = true;
    }
    return { db, auth, firebase: window.firebase };
}

export const DB = {
    init(roomId, teacherSecret) {
        const { db } = getFirebase();
        if (!db) {
            console.error('[Firebase] Database not available');
            return;
        }

        currentRoomRef = db.ref(`mrboard_final/${roomId}`);

        // Presence & disconnect
        const meRef = currentRoomRef.child(`users/${Store.uid}`);
        meRef.onDisconnect().remove();
        meRef.set({
            id: Store.uid,
            n: Store.name,
            t: Store.isTeacher,
            d: Store.perms.draw,
            s: Store.perms.speak
        });

        if (Store.isTeacher && teacherSecret) {
            currentRoomRef.child('meta/teacherSecret').set(teacherSecret);
            currentRoomRef.child('meta/studentCode').set(roomId);
            currentRoomRef.child('meta/laserEnabled').set(true);
        }

        this.attachListeners();
    },

    attachListeners() {
        if (!currentRoomRef) return;

        currentRoomRef.child('elements').on('value', snap => {
            Store.elements = snap.val() ? Object.values(snap.val()) : [];
            Events.emit('render');
        });

        currentRoomRef.child('live').on('value', snap => {
            Store.livePaths = snap.val() || {};
            Events.emit('render');
        });

        currentRoomRef.child('laser').on('value', snap => {
            Store.laserPaths = snap.val() || {};
            Events.emit('render');
        });

        currentRoomRef.child('cursors').on('value', snap => {
            Store.cursors = snap.val() || {};
            Events.emit('render');
        });

        currentRoomRef.child('meta/laserEnabled').on('value', snap => {
            Store.laserEnabled = snap.val() !== false;
            Events.emit('render');
        });

        if (!Store.isTeacher) {
            currentRoomRef.child('camera').on('value', snap => {
                if (snap.val() && !Store.perms.draw) {
                    Store.cam = snap.val();
                    Events.emit('render');
                    Events.emit('zoom');
                }
            });
        }

        currentRoomRef.child('users').on('value', snap => {
            Store.users = snap.val() || {};
            if (!Store.isTeacher && Store.users[Store.uid]) {
                const u = Store.users[Store.uid];
                if (Store.perms.draw !== u.d) {
                    Store.perms.draw = u.d;
                    Utils.showToast(u.d ? "Chizish huquqi berildi" : "Chizish huquqi olindi", u.d ? "success" : "warning");
                }
                if (Store.perms.speak !== u.s) {
                    Store.perms.speak = u.s;
                    if (!u.s && Store.micActive) {
                        Store.micActive = false;
                        Events.emit('mic');
                    }
                    Utils.showToast(u.s ? "Mikrofon huquqi berildi" : "Mikrofon huquqi olindi", u.s ? "success" : "warning");
                }
                Events.emit('role');
            }
            Events.emit('users');
        });

        currentRoomRef.child('chat').on('child_added', snap => {
            Events.emit('chat', snap.val());
        });
    },

    addElement(el) {
        if (!currentRoomRef) return;
        el.u = Store.uid;
        el.t = Date.now();
        currentRoomRef.child('elements').push(el);
    },

    addLive(id, data, isLaser) {
        if (!currentRoomRef) return;
        if (isLaser && !Store.laserEnabled && !Store.isTeacher) return;
        currentRoomRef.child(`${isLaser ? 'laser' : 'live'}/${id}`).set(data);
        if (isLaser) {
            setTimeout(() => {
                if (currentRoomRef) currentRoomRef.child(`laser/${id}`).remove();
            }, 1000);
        }
    },

    updateLive(id, points, isLaser) {
        if (!currentRoomRef) return;
        const target = isLaser ? 'laser' : 'live';
        if (points) {
            currentRoomRef.child(`${target}/${id}`).update({ p: points });
        } else {
            currentRoomRef.child(`${target}/${id}`).remove();
        }
    },

    removeLive(id) {
        if (!currentRoomRef) return;
        currentRoomRef.child(`live/${id}`).remove();
    },

    updateCursor: Utils.throttle((pos) => {
        if (!currentRoomRef) return;
        currentRoomRef.child(`cursors/${Store.uid}`).set({
            x: pos.x,
            y: pos.y,
            n: Store.name,
            t: Store.isTeacher
        });
    }, 50),

    syncCamera() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('camera').set(Store.cam);
        }
    },

    undo() {
        if (!currentRoomRef) return;
        currentRoomRef.child('elements').once('value', snap => {
            const val = snap.val();
            if (!val) return;
            const els = Object.entries(val)
                .map(([k, v]) => ({ k, ...v }))
                .filter(e => Store.isTeacher || e.u === Store.uid);

            if (els.length > 0) {
                const last = els.sort((a, b) => b.t - a.t)[0];
                currentRoomRef.child(`elements/${last.k}`).remove();
                Utils.showToast("Bekor qilindi", "success");
            }
        });
    },

    clearBoard() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('meta/teacherSecret').once('value', snap => {
                if (snap.val() === Store.teacherSecret) {
                    currentRoomRef.child('elements').remove();
                    Utils.showToast("Doska tozalandi", "success");
                }
            });
        }
    },

    toggleLaser() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('meta/teacherSecret').once('value', snap => {
                if (snap.val() === Store.teacherSecret) {
                    const next = !Store.laserEnabled;
                    currentRoomRef.child('meta/laserEnabled').set(next);
                    Utils.showToast(next ? "Lazer yoqildi" : "Lazer o'chirildi", "info");
                }
            });
        }
    },

    setPerm(userId, type, val) {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child(`users/${userId}`).update({ [type]: val });
        }
    },

    kickUser(userId) {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child(`users/${userId}`).remove();
            Utils.showToast("Foydalanuvchi chiqarildi", "success");
        }
    },

    sendChat(msg) {
        if (!currentRoomRef) return;
        currentRoomRef.child('chat').push({
            u: Store.uid,
            n: Store.name,
            t: Store.isTeacher,
            m: msg,
            tm: Utils.getTime()
        });
    },

    destroy() {
        if (currentRoomRef) {
            currentRoomRef.off();
            currentRoomRef.child(`users/${Store.uid}`).remove();
            currentRoomRef = null;
        }
    }
};

// Top-level room management methods for dashboard and modals
export const RoomAPI = {
    async createRoom(name, isPublic = true, password = null) {
        const { db, auth } = getFirebase();
        const user = auth?.currentUser;
        if (!user) throw new Error("Avtorizatsiyadan o'tilmagan!");

        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const teacherSecret = roomCode + Math.random().toString(36).substring(2, 10);
        const now = Date.now();

        const roomData = {
            id: roomCode,
            name: name || `Xona ${roomCode}`,
            createdBy: user.uid,
            createdByName: user.displayName || user.email?.split('@')[0] || 'Foydalanuvchi',
            createdAt: now,
            isPublic: !!isPublic,
            hasPassword: !!password,
            password: password || null,
            isActive: true,
            teacherSecret
        };

        await db.ref(`rooms/${roomCode}`).set(roomData);
        return { roomCode, teacherSecret, ...roomData };
    },

    async getRoom(roomId) {
        const { db } = getFirebase();
        const snap = await db.ref(`rooms/${roomId}`).once('value');
        return snap.val();
    },

    async getPublicRooms() {
        const { db } = getFirebase();
        const snap = await db.ref('rooms').once('value');
        const val = snap.val() || {};
        return Object.entries(val)
            .map(([id, r]) => ({ id, ...r }))
            .filter(r => r.isActive !== false && r.isPublic === true)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    async getUserRooms(uid) {
        const { db } = getFirebase();
        const snap = await db.ref('rooms').once('value');
        const val = snap.val() || {};
        return Object.entries(val)
            .map(([id, r]) => ({ id, ...r }))
            .filter(r => r.createdBy === uid && r.isActive !== false)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    async updateRoom(roomId, updates) {
        const { db } = getFirebase();
        await db.ref(`rooms/${roomId}`).update(updates);
    },

    async deleteRoom(roomId) {
        const { db } = getFirebase();
        await db.ref(`rooms/${roomId}`).update({ isActive: false });
    }
};

export default DB;
