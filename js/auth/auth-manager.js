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

        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    if (user.isAnonymous) {
                        Store.uid = user.uid;
                        Store.name = localStorage.getItem('guest_name') || 'Mehmon';
                        Store.user = { uid: user.uid, isAnonymous: true, name: Store.name };
                        resolve(Store.user);
                    } else {
                        this.userData = await this.fetchUserData(user.uid);
                        Store.user = { uid: user.uid, email: user.email, isAnonymous: false, ...this.userData };
                        Store.uid = user.uid;
                        Store.name = this.getDisplayName();
                        localStorage.setItem('mr_user', JSON.stringify(Store.user));
                        resolve(Store.user);
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
                        resolve(Store.user);
                    } catch (e) {
                        console.warn('[AuthManager] Anonymous auth fallback:', e);
                        this.currentUser = null;
                        this.userData = null;
                        Store.user = null;
                        localStorage.removeItem('mr_user');
                        resolve(null);
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

    async login(email, password) {
        const { auth } = getFirebase();
        if (!auth) throw new Error("Firebase Auth topilmadi");
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    }

    async register(email, password, { firstName, lastName, username }) {
        const { auth, db } = getFirebase();
        if (!auth || !db) throw new Error("Firebase Auth topilmadi");

        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;

        const profileData = {
            uid: user.uid,
            email: email,
            firstName: firstName || '',
            lastName: lastName || '',
            fullName: `${firstName || ''} ${lastName || ''}`.trim() || username,
            username: username || email.split('@')[0],
            createdAt: Date.now()
        };

        await db.ref(`users/${user.uid}`).set(profileData);
        await user.updateProfile({ displayName: profileData.fullName });

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
        return "Email yoki parol noto'g'ri kiritildi!";
    }
    if (code.includes('user-not-found') || msg.includes('user_not_found')) {
        return "Ushbu email bilan ro'yxatdan o'tilmagan. Avval ro'yxatdan o'ting!";
    }
    if (code.includes('email-already-in-use') || msg.includes('email_exists')) {
        return "Bu email allaqachon ro'yxatdan o'tgan! Tizimga kiring.";
    }
    if (code.includes('weak-password') || msg.includes('weak_password')) {
        return "Parol juda oddiy. Kamida 6 ta belgi kiriting!";
    }
    if (code.includes('invalid-email') || msg.includes('invalid_email')) {
        return "Email manzili noto'g'ri kiritildi!";
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
