// js/auth/auth-manager.js - Central Authentication & Profile Manager

import { getFirebase } from '../api/firebase.js';
import { Store } from '../store.js';
import { Utils } from '../utils.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
    }

    async init() {
        const { auth, db } = getFirebase();
        if (!auth) return null;

        // 1. Immediately hydrate from cache to eliminate 1s delay
        let cachedUser = null;
        try {
            cachedUser = JSON.parse(localStorage.getItem('mr_user') || 'null');
            if (cachedUser && cachedUser.uid) {
                this.userData = cachedUser;
                Store.user = cachedUser;
                Store.uid = cachedUser.uid;
                Store.name = cachedUser.fullName || cachedUser.username || cachedUser.name || cachedUser.email?.split('@')[0] || 'Foydalanuvchi';
            }
        } catch (_) {}

        return new Promise((resolve) => {
            let resolved = false;
            const complete = (user) => {
                if (!resolved) {
                    resolved = true;
                    resolve(user);
                }
            };

            // Safety timeout: resolve cached or guest user if network is slow
            setTimeout(() => {
                if (!resolved) {
                    complete(Store.user || cachedUser || null);
                }
            }, 1200);

            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    if (user.isAnonymous) {
                        Store.uid = user.uid;
                        Store.name = localStorage.getItem('guest_name') || 'Mehmon';
                        Store.user = { uid: user.uid, isAnonymous: true, name: Store.name };
                        complete(Store.user);
                    } else {
                        this.userData = await this.fetchUserData(user.uid);
                        Store.user = { uid: user.uid, email: user.email, isAnonymous: false, ...this.userData };
                        Store.uid = user.uid;
                        Store.name = this.getDisplayName();
                        localStorage.setItem('mr_user', JSON.stringify(Store.user));
                        complete(Store.user);
                    }
                } else {
                    // Sign in anonymously to satisfy RTDB auth != null rules
                    try {
                        const anonCred = await auth.signInAnonymously();
                        const anonUser = anonCred.user;
                        this.currentUser = anonUser;
                        Store.uid = anonUser.uid;
                        Store.name = localStorage.getItem('guest_name') || 'Mehmon';
                        Store.user = { uid: anonUser.uid, isAnonymous: true, name: Store.name };
                        complete(Store.user);
                    } catch (e) {
                        console.warn('[AuthManager] Anonymous auth fallback:', e);
                        if (cachedUser && cachedUser.uid) {
                            complete(cachedUser);
                        } else {
                            const fallbackUid = localStorage.getItem('guest_uid') || ('guest_' + Math.random().toString(36).substring(2, 9));
                            localStorage.setItem('guest_uid', fallbackUid);
                            const guestUser = {
                                uid: fallbackUid,
                                isAnonymous: true,
                                name: localStorage.getItem('guest_name') || 'Mehmon'
                            };
                            Store.uid = fallbackUid;
                            Store.name = guestUser.name;
                            Store.user = guestUser;
                            complete(guestUser);
                        }
                    }
                }
            });
        });
    }

    async fetchUserData(uid) {
        const { db } = getFirebase();
        if (!db) return {};
        try {
            const snap = await db.ref(`users/${uid}`).once('value');
            return snap.val() || {};
        } catch (e) {
            console.error('[AuthManager] Error fetching user data:', e);
            return {};
        }
    }

    getDisplayName() {
        if (!this.currentUser) return 'Foydalanuvchi';
        return this.userData?.firstName ||
               (this.userData?.fullName ? this.userData.fullName.split(' ')[0] : null) ||
               this.userData?.username ||
               this.currentUser.displayName ||
               this.currentUser.email?.split('@')[0] ||
               'Foydalanuvchi';
    }

    toAuthEmail(identifier) {
        const clean = (identifier || '').trim().toLowerCase();
        if (clean.includes('@')) {
            return clean;
        }
        const safe = clean.replace(/[^a-z0-9._-]/g, '');
        return `${safe || 'user'}@mrboard.internal`;
    }

    async login(identifier, password) {
        const { auth } = getFirebase();
        if (!auth) throw new Error("Firebase Auth topilmadi");
        const email = this.toAuthEmail(identifier);
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    }

    async register(arg1, arg2, arg3 = {}) {
        const { auth, db } = getFirebase();
        if (!auth || !db) throw new Error("Firebase Auth topilmadi");

        let username = '';
        let password = '';
        let firstName = '';
        let lastName = '';

        if (typeof arg1 === 'object' && arg1 !== null) {
            username = arg1.username || '';
            password = arg1.password || '';
            firstName = arg1.firstName || '';
            lastName = arg1.lastName || '';
        } else if (typeof arg2 === 'object' && arg2 !== null) {
            password = arg1 || '';
            const opts = arg2 || {};
            username = opts.username || '';
            firstName = opts.firstName || '';
            lastName = opts.lastName || '';
        } else {
            const opts = arg3 || {};
            password = arg2 || '';
            username = opts.username || (typeof arg1 === 'string' ? arg1 : '');
            firstName = opts.firstName || '';
            lastName = opts.lastName || '';
        }

        const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (!cleanUsername) throw new Error("Foydalanuvchi nomini kiriting!");
        if (!password) throw new Error("Parolni kiriting!");

        const authEmail = `${cleanUsername}@mrboard.internal`;

        const cred = await auth.createUserWithEmailAndPassword(authEmail, password);
        const user = cred.user;

        const profileData = {
            uid: user.uid,
            firstName: firstName || '',
            lastName: lastName || '',
            fullName: `${firstName || ''} ${lastName || ''}`.trim() || cleanUsername,
            username: cleanUsername,
            createdAt: Date.now()
        };

        await db.ref(`users/${user.uid}`).set(profileData);
        if (user.updateProfile) {
            await user.updateProfile({ displayName: profileData.fullName }).catch(() => {});
        }

        Store.user = { uid: user.uid, ...profileData };
        Store.uid = user.uid;
        Store.name = profileData.fullName;
        localStorage.setItem('mr_user', JSON.stringify(Store.user));

        return user;
    }

    async logout() {
        const { auth } = getFirebase();
        if (auth) {
            await auth.signOut();
        }
        localStorage.removeItem('mr_user');
    }
}

export function formatAuthError(err) {
    if (!err) return "Noma'lum xatolik yuz berdi";
    const msg = (typeof err === 'string' ? err : (err.message || '')).toLowerCase();
    const code = (err.code || '').toLowerCase();

    if (code.includes('invalid-credential') || msg.includes('invalid_login_credentials') || code.includes('wrong-password')) {
        return "Foydalanuvchi nomi yoki parol noto'g'ri kiritildi!";
    }
    if (code.includes('user-not-found') || msg.includes('user_not_found')) {
        return "Ushbu foydalanuvchi topilmadi. Avval ro'yxatdan o'ting!";
    }
    if (code.includes('email-already-in-use') || msg.includes('email_exists')) {
        return "Bu foydalanuvchi nomi allaqachon band! Boshqa nom tanlang.";
    }
    if (code.includes('weak-password') || msg.includes('weak_password')) {
        return "Parol juda oddiy. Kamida 6 ta belgi kiriting!";
    }
    if (code.includes('too-many-requests') || msg.includes('too_many_attempts')) {
        return "Ko'p marta xato urinish bo'ldi. Biroz kuting va qayta urinib ko'ring.";
    }
    if (code.includes('network-request-failed')) {
        return "Internet aloqasida xatolik yuz berdi. Tarmoqni tekshiring.";
    }

    try {
        const jsonMatch = err.message?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const subMsg = (parsed.error?.message || '').toUpperCase();
            if (subMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
                return "Email yoki parol noto'g'ri kiritildi!";
            }
            if (subMsg.includes('EMAIL_EXISTS')) {
                return "Bu email allaqachon ro'yxatdan o'tgan! Tizimga kiring.";
            }
        }
    } catch (_) {}

    return err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

export const authManager = new AuthManager();
export default authManager;
