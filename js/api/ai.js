// js/api/ai.js - AI Assistant Client (Groq Integration)

import { groqConfig } from '../config.js';

export class AIAssistant {
    constructor() {
        this.apiKey = groqConfig.apiKey;
        this.apiUrl = groqConfig.apiUrl;
        this.model = groqConfig.model;
        this.systemPrompt = `Siz MR BOARD - zamonaviy real-vaqt onlayn interaktiv doska platformasining sun'iy intellekt yordamchisisiz.
Vazifangiz foydalanuvchilarga do'stona, aniq, xushmuomala va qisqa javob berish.
O'zbek tilida gaplashing. Doska asboblari (qalam, lazer wand, shakllar, audio chat, xona yaratish) bo'yicha maslahatlar bering.`;
    }

    async chat(messages) {
        if (!this.apiKey) {
            return "Kechirasiz, AI kaliti sozlanmagan. Iltimos keyinroq urinib ko'ring.";
        }

        try {
            const formatted = [
                { role: "system", content: this.systemPrompt },
                ...messages
            ];

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: formatted,
                    temperature: 0.7,
                    max_tokens: 600
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Kechirasiz, javob olishda xatolik yuz berdi.";
        } catch (err) {
            console.warn('[AI Assistant] API call error, providing helpful fallback:', err);
            return `Assalomu alaykum! Men MR BOARD sun'iy intellekt yordamchisiman.
Sizga doskadan foydalanish, yangi xona ochish yoki dars jarayonini tashkillashtirishda bajonidil yordam beraman.

💡 **Tezkor maslahatlar:**
- **B**: Qalam asbobini tanlash
- **L**: Lazer wand ko'rsatkichini yoqish
- **M**: Mikrofonni yoqish / o'chirish
- **Ctrl+Z**: So'nggi amalni bekor qilish`;
        }
    }
}

export const aiAssistant = new AIAssistant();
export default aiAssistant;
