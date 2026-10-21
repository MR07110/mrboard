// js/config.js - MR BOARD Configuration

export const firebaseConfig = {
    apiKey: "AIzaSyB1I15bWEAO8rYc3THB_kbPqLzshVQ-9Tc",
    authDomain: "mrboard-1cc5a.firebaseapp.com",
    databaseURL: "https://mrboard-1cc5a-default-rtdb.firebaseio.com",
    projectId: "mrboard-1cc5a",
    storageBucket: "mrboard-1cc5a.firebasestorage.app",
    messagingSenderId: "540950972360",
    appId: "1:540950972360:web:0460b399bc6e6ea0fbe2fd",
    measurementId: "G-N4QLMJMQFY"
};

export const appConfig = {
    appName: "MR BOARD",
    version: "2.0.0",
    maxFileSize: 5 * 1024 * 1024,
    maxMessageLength: 250,
    defaultZoom: 1,
    minZoom: 0.2,
    maxZoom: 5,
    defaultStrokeSize: 4,
    defaultStrokeColor: "#007aff",
    defaultLaserColor: "#ff3b30"
};

export default {
    firebase: firebaseConfig,
    app: appConfig
};
