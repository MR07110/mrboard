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
                    this.userData = await this.fetchUserData(user.uid);
                    Store.user = { uid: user.uid, email: user.email, ...this.userData };
                    Store.name = this.getDisplayName();
                    localStorage.setItem('mr_user', JSON.stringify(Store.user));
                    resolve(Store.user);
                } else {
                    this.currentUser = null;
                    this.userData = null;
                    Store.user = null;
                    localStorage.removeItem('mr_user');
                    resolve(null);
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

export const authManager = new AuthManager();
export default authManager;
