# 🎨 MR BOARD · ENTERPRISE · 2.0

<p align="center">
  <img src="favicon.svg" width="100" alt="MR Board Logo">
</p>

<p align="center">
  <strong>Professional darajadagi real-vaqt interaktiv onlayn doska va jamoaviy ta'lim platformasi.</strong><br>
  Nol kechikish (Zero-latency), o'rnatilgan Web Audio ekvalayzer, sun'iy intellekt yordamchisi va 60FPS multi-layer canvas dvigateli.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Modular%20ES%20Components-blue?style=flat-square" alt="Modular Components">
  <img src="https://img.shields.io/badge/Vercel-Production%20Ready-black?style=flat-square&logo=vercel" alt="Vercel Ready">
  <img src="https://img.shields.io/badge/Canvas-60FPS%20Multi--Layer-success?style=flat-square" alt="60FPS Canvas">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

---

## 🏗 Arxitektura va Komponentlar Tizimi

Loyiha to'liq modulli komponentlarga ajratilgan va toza monolitik ES arxitekturasiga ega:

```
mrboard/
├── index.html               # Tezkor, silliq landing page & interaktiv jonli namoyish
├── board.html               # Interaktiv whiteboard ilovasi
├── dashboard.html           # Xonalarni boshqarish & shaxsiy kabinet
├── doc.html                 # To'liq hujjatlar va qo'llanma
├── ai.html                  # MR BOARD AI suhbat oynasi
├── favicon.svg              # Brend SVG belgisi
├── vercel.json              # Vercel production xavfsizlik va kesh sozlamalari
├── package.json             # Loyiha boshqaruvi va skriptlar
├── .env.example             # Muhit o'zgaruvchilari namunasi
│
├── css/                     # Modulli CSS Tizimi
│   ├── base.css             # Dizayn tokenlari, ranglar, animatsiyalar
│   ├── components.css       # Tugmalar, modallar, drawerlar, toastlar
│   ├── board.css            # 3-qatlamli canvas, quyi dock, asboblar, minimap
│   ├── dashboard.css        # Dashboard grid, xona kartalari, profil
│   ├── landing.css          # Landing hero, mockup, feature kartalari
│   ├── docs.css             # Dokumentatsiya sahifasi stili
│   ├── ai-modal.css         # AI yordamchi popup & suzuvchi tugma
│   ├── donate-modal.css     # 3D interaktiv Visa kartasi
│   └── style.css            # Barcha modullarni birlashtiruvchi markaziy import
│
├── js/                      # Modulli JavaScript Tizimi
│   ├── config.js            # Firebase va Groq AI konfiguratsiyasi
│   ├── store.js             # Reaktiv holat (Single Source of Truth)
│   ├── events.js            # Voqealar shinalari (EventEmitter Pub/Sub)
│   ├── utils.js             # Xavfsiz sanitize, throttle, vibratsiya, toastlar
│   ├── api/
│   │   ├── firebase.js      # RTDB, sinxronizatsiya, ruxsatlar boshqaruvi
│   │   └── ai.js            # Groq Llama-3.3 sun'iy intellekt integratsiyasi
│   ├── auth/
│   │   └── auth-manager.js  # Foydalanuvchi hisobi, login, register, profil
│   ├── engine/
│   │   ├── camera.js        # Koordinatalar transformatsiyasi, zoom (0.2x-5.0x), pan
│   │   ├── renderer.js      # Silliq egri chiziqlar, shakllar, matn, lazer, kursorlar
│   │   └── canvas-engine.js # 3 qatlamli 60FPS canvas koordinatori
│   ├── components/
│   │   ├── minimap.js       # Real-vaqt kichik xarita va ko'rish maydoni
│   │   ├── color-picker.js  # HSV rang g'ildiragi va ranglar palitrasi
│   │   ├── chat.js          # Real-vaqt xona chati va yangi xabar bildirishnomalari
│   │   ├── users.js         # Qatnashchilar ro'yxati va o'qituvchi boshqaruvi
│   │   ├── audio.js         # Web Audio chastota ekvalayzeri & mikrofon
│   │   ├── shortcuts.js     # Global klaviatura qisqartmalari
│   │   ├── ai-assistant.js  # MR AI sun'iy intellekt suzuvchi moduli
│   │   ├── donate-modal.js  # 3D holo-kartali qo'llab-quvvatlash oynasi
│   │   └── demo-player.js   # 60FPS interaktiv namoyish pleyeri
│   └── pages/
│       ├── landing.js       # Bosh sahifa boshqaruvi
│       ├── board.js         # Doska sahifasi orkestratori
│       ├── dashboard.js     # Dashboard sahifasi boshqaruvi
│       └── docs.js          # Qo'llanma sahifasi boshqaruvi
│
├── scripts/                 # Avtomatlashtirish & Testlar
│   ├── test.mjs             # Loyiha yaxlitligi va sintaksis tekshiruvi
│   └── build.mjs            # Production uchun tekshiruv va tahlil
└── archive/                 # Eski statik fayllar arxivi
```

---

## ✨ Asosiy Imkoniyatlar (Features)

### 🎨 3-Qatlamli Canvas Dvigateli
1. **Base Layer:** Doimiy saqlanadigan vektor chizmalar (qalam, shakllar, matn, rasmlar).
2. **Live Layer:** Real-vaqtda chizilayotgan faol chiziqlar va boshqa qatnashchilarning jonli kursorlari.
3. **Laser Wand Layer:** O'qituvchilar va ma'ruzachilar uchun diqqatni tortuvchi, avtomatik ravishda so'nuvchi lazer izlari.

### 👥 Rollar va Xavfsizlik
* **O'qituvchi (Host):**
  - Xona linklari (`#t-SECRET` va `#s-ROOMCODE`).
  - Har bir o'quvchiga chizish yoki mikrofon ruxsatini berish / bekor qilish.
  - Doskani butunlay tozalash yoki lazer vositasini o'chirish.
  - Qoidalarga rioya qilmagan qatnashchilarni chiqarish.
* **O'quvchi (Student):**
  - O'qituvchi ruxsat berganida erkin chizish, mikrofonni yoqish va chatda muloqot qilish.

### 🎙 Web Audio & Ekvalayzer
* Web Audio API orqali mikrofon chastotasini tahlil qiluvchi va quyi dockda jonli to'lqinlanuvchi audio vizualizator.

### 🤖 MR BOARD AI
* O'rnatilgan Groq `llama-3.3-70b-versatile` sun'iy intellekti orqali platformadan foydalanish va savollarga do'stona o'zbek tilida javob berish.

---

## ⌨️ Klaviatura Qisqartmalari (Shortcuts)

| Tugma | Vazifasi |
| :--- | :--- |
| <kbd>Ctrl + Z</kbd> | Oxirgi amalni bekor qilish (Undo) |
| <kbd>B</kbd> | Qalam (Pen tool) |
| <kbd>L</kbd> | Lazer Wand ko'rsatkichi |
| <kbd>E</kbd> | O'chirg'ich (Eraser) |
| <kbd>H</kbd> | Qo'l vositasi (Pan) |
| <kbd>T</kbd> | Matn kiritish |
| <kbd>S</kbd> | Geometrik shakllar |
| <kbd>M</kbd> | Mikrofonni yoqish / o'chirish |
| <kbd>C</kbd> | Xona chati |
| <kbd>U</kbd> | Qatnashchilar ro'yxati |
| <kbd>F</kbd> | Zen Mode (To'liq ekran) |
| <kbd>Esc</kbd> | Ochiq panellarni yopish |

---

## 🚀 Ishga Tushirish va O'rnatish

### 1. Mahalliy Serverda Ishga Tushirish
```bash
# Repozitoriyaga o'ting
cd mrboard

# Testlarni ishga tushiring
npm test

# Mahalliy serverda oching
npm start
```
Brauzerda `http://localhost:3000` manzilini oching.

### 2. Vercel ga Production Deploy Qilish
Loyiha `vercel.json` bilan to'liq jihozlangan:
```bash
npx vercel --prod
```

---

## 👨‍💻 Muallif
**Muhammadrasul Qosimov (MR07110)**
* GitHub: [@MR07110](https://github.com/MR07110)
* Maqsad: Onlayn ta'lim va jamoaviy masofaviy ishlashni yangi bosqichga olib chiqish.

---
<p align="center">Yaratildi ❤️ Muhammadrasul tomonidan · Linux Muhiti</p>
