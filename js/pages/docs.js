// js/pages/docs.js - Documentation Page Controller

import { initDonateModal } from '../components/donate-modal.js';

export class DocsPage {
    constructor() {
        this.init();
    }

    init() {
        initDonateModal();

        // Active link tracking
        const sections = document.querySelectorAll('.docs-section');
        const links = document.querySelectorAll('.docs-nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(sec => {
                const top = sec.offsetTop - 100;
                if (window.scrollY >= top) {
                    current = sec.getAttribute('id');
                }
            });

            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }
}

// Auto-boot on DOM ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.docsPage = new DocsPage();
    });
}

export default DocsPage;
