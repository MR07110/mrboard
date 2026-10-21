// js/api/firebase.js - Modular Firebase RTDB & Auth Service

import { firebaseConfig } from '../config.js';
import { Store } from '../store.js';
import { Events } from '../events.js';
import { Utils } from '../utils.js';

let initialized = false;
let db = null;
let auth = null;
let firestore = null;
let analytics = null;
let currentRoomRef = null;

export function getFirebase() {
    if (!initialized && typeof window !== 'undefined' && window.firebase) {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        db = window.firebase.database();
        auth = window.firebase.auth();
        if (typeof window.firebase.firestore === 'function') {
            try {
                firestore = window.firebase.firestore();
            } catch (_) {}
        }
        if (typeof window.firebase.analytics === 'function') {
            try {
                analytics = window.firebase.analytics();
            } catch (_) {}
        }
        initialized = true;
    }
    return { db, auth, firestore, analytics, firebase: window.firebase };
}

export function getFirestore() {
    const { firestore } = getFirebase();
    return firestore;
}

export const DB = {
    init(roomId, teacherSecret) {
        const { db } = getFirebase();
        if (!db) {
            console.error('[Firebase] Database not available');
            return;
        }

        currentRoomRef = db.ref(`mrboard/${roomId}`);

        // Presence & disconnect
        const meRef = currentRoomRef.child(`users/${Store.uid}`);
        try {
            meRef.onDisconnect().remove();
        } catch (_) {}

        meRef.set({
            id: Store.uid,
            n: Store.name || 'Mehmon',
            t: !!Store.isTeacher,
            d: !!Store.perms.draw,
            s: !!Store.perms.speak
        }).catch(err => {
            console.warn('[Firebase] presence set warning:', err.message);
        });

        if (Store.isTeacher && teacherSecret) {
            currentRoomRef.child('meta/teacherSecret').set(teacherSecret).catch(() => {});
            currentRoomRef.child('meta/studentCode').set(roomId).catch(() => {});
            currentRoomRef.child('meta/laserEnabled').set(true).catch(() => {});
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
        const cleanEl = {
            type: el.type || 'path',
            u: Store.uid || 'guest',
            t: Date.now(),
            c: el.c || Store.color || '#007aff',
            s: typeof el.s === 'number' ? el.s : (Store.size || 4)
        };
        if (el.p && Array.isArray(el.p)) cleanEl.p = el.p;
        if (el.p1) cleanEl.p1 = el.p1;
        if (el.p2) cleanEl.p2 = el.p2;
        if (el.tl) cleanEl.tl = el.tl;
        if (el.text) cleanEl.text = el.text;
        if (typeof el.x === 'number') cleanEl.x = el.x;
        if (typeof el.y === 'number') cleanEl.y = el.y;
        if (el.data) {
            cleanEl.data = el.data;
            cleanEl.width = el.width || 200;
            cleanEl.height = el.height || 150;
        }

        currentRoomRef.child('elements').push(cleanEl).catch(err => {
            console.warn('[Firebase] elements.push warning:', err.message);
        });
    },

    addLive(id, data, isLaser) {
        if (!currentRoomRef || !id || !data) return;
        if (isLaser && !Store.laserEnabled && !Store.isTeacher) return;

        const cleanData = {
            u: Store.uid || 'guest',
            tl: data.tl || 'draw',
            c: data.c || Store.color || '#007aff',
            s: typeof data.s === 'number' ? data.s : (Store.size || 4)
        };
        if (data.p && Array.isArray(data.p)) cleanData.p = data.p;
        if (data.p1) cleanData.p1 = data.p1;
        if (data.p2) cleanData.p2 = data.p2;

        const target = isLaser ? 'laser' : 'live';
        currentRoomRef.child(`${target}/${id}`).set(cleanData).catch(err => {
            console.warn('[Firebase] addLive warning:', err.message);
        });

        if (isLaser) {
            setTimeout(() => {
                if (currentRoomRef) {
                    currentRoomRef.child(`laser/${id}`).remove().catch(() => {});
                }
            }, 1000);
        }
    },

    updateLive(id, points, isLaser) {
        if (!currentRoomRef || !id) return;
        const target = isLaser ? 'laser' : 'live';
        if (points && points.length) {
            currentRoomRef.child(`${target}/${id}`).update({
                u: Store.uid || 'guest',
                p: points
            }).catch(err => {
                console.warn('[Firebase] updateLive warning:', err.message);
            });
        } else {
            currentRoomRef.child(`${target}/${id}`).remove().catch(() => {});
        }
    },

    removeLive(id) {
        if (!currentRoomRef || !id) return;
        currentRoomRef.child(`live/${id}`).remove().catch(() => {});
    },

    updateCursor: Utils.throttle((pos) => {
        if (!currentRoomRef || !pos) return;
        currentRoomRef.child(`cursors/${Store.uid}`).set({
            x: pos.x,
            y: pos.y,
            n: Store.name || 'Mehmon',
            t: !!Store.isTeacher
        }).catch(() => {});
    }, 50),

    syncCamera() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('camera').set(Store.cam).catch(() => {});
        }
    },

    undo() {
        if (!currentRoomRef) return;
        currentRoomRef.child('elements').once('value').then(snap => {
            const val = snap.val();
            if (!val) return;
            const els = Object.entries(val)
                .map(([k, v]) => ({ k, ...v }))
                .filter(e => Store.isTeacher || e.u === Store.uid);

            if (els.length > 0) {
                const last = els.sort((a, b) => b.t - a.t)[0];
                currentRoomRef.child(`elements/${last.k}`).remove().catch(() => {});
                Utils.showToast("Bekor qilindi", "success");
            }
        }).catch(err => {
            console.warn('[Firebase] undo warning:', err.message);
        });
    },

    clearBoard() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('meta/teacherSecret').once('value').then(snap => {
                if (snap.val() === Store.teacherSecret) {
                    currentRoomRef.child('elements').remove().catch(() => {});
                    Utils.showToast("Doska tozalandi", "success");
                }
            }).catch(() => {});
        }
    },

    toggleLaser() {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child('meta/teacherSecret').once('value').then(snap => {
                if (snap.val() === Store.teacherSecret) {
                    const next = !Store.laserEnabled;
                    currentRoomRef.child('meta/laserEnabled').set(next).catch(() => {});
                    Utils.showToast(next ? "Lazer yoqildi" : "Lazer o'chirildi", "info");
                }
            }).catch(() => {});
        }
    },

    setPerm(userId, type, val) {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child(`users/${userId}`).update({ [type]: val }).catch(() => {});
        }
    },

    kickUser(userId) {
        if (Store.isTeacher && currentRoomRef) {
            currentRoomRef.child(`users/${userId}`).remove().catch(() => {});
            Utils.showToast("Foydalanuvchi chiqarildi", "success");
        }
    },

    sendChat(msg) {
        if (!currentRoomRef || !msg) return;
        currentRoomRef.child('chat').push({
            u: Store.uid || 'guest',
            n: Store.name || 'Foydalanuvchi',
            t: !!Store.isTeacher,
            m: msg,
            tm: Utils.getTime()
        }).catch(err => {
            console.warn('[Firebase] sendChat warning:', err.message);
        });
    },

    destroy() {
        if (currentRoomRef) {
            currentRoomRef.off();
            if (Store.uid) {
                currentRoomRef.child(`users/${Store.uid}`).remove().catch(() => {});
            }
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
        await db.ref(`mrboard/${roomCode}/meta`).set({
            teacherSecret,
            studentCode: roomCode,
            laserEnabled: true,
            createdAt: now
        }).catch(() => {});

        return { roomCode, teacherSecret, ...roomData };
    },

    async getRoom(roomId) {
        const { db } = getFirebase();
        if (!db || !roomId) return null;
        try {
            const snap = await db.ref(`rooms/${roomId}`).once('value');
            const val = snap.val();
            if (val) return val;

            const metaSnap = await db.ref(`mrboard/${roomId}/meta`).once('value');
            const meta = metaSnap.val();
            if (meta) {
                return {
                    id: roomId,
                    name: `Xona ${roomId}`,
                    isActive: true,
                    isPublic: true,
                    teacherSecret: meta.teacherSecret
                };
            }
        } catch (e) {
            console.warn('[RoomAPI] getRoom fallback:', e);
        }
        return null;
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
