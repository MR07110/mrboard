// js/pages/landing.js - Landing Page Controller

import { DemoPlayerComponent } from '../components/demo-player.js';
import { initAIAssistant } from '../components/ai-assistant.js';
import { initDonateModal } from '../components/donate-modal.js';

export class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        // Mount interactive simulation inside mockup
        new DemoPlayerComponent('mockup-viewport');

        // Mount floating AI and Donate triggers
        initAIAssistant();
        initDonateModal();

        // Smooth scroll for anchors
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }
}

// Auto-boot on DOM ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.landingPage = new LandingPage();
    });
}

export default LandingPage;
