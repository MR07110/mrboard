// js/config.js - MR BOARD Configuration

export const firebaseConfig = {
    apiKey: "AIzaSyDAsbqgXxl69P-yhOn3L2puTBmLxG70Ao0",
    authDomain: "basic-formula-484419-k8.firebaseapp.com",
    databaseURL: "https://basic-formula-484419-k8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "basic-formula-484419-k8",
    storageBucket: "basic-formula-484419-k8.firebasestorage.app",
    messagingSenderId: "629679926764",
    appId: "1:629679926764:web:0cff483e9c4752fbd024c9",
    measurementId: "G-WR9D0BWR86"
};

export const groqConfig = {
    apiKey: "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",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile"
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
    groq: groqConfig,
    app: appConfig
};
