// js/components/donate-modal.js - Interactive 3D Bank Card Modal Component

export class DonateModalComponent {
    constructor() {
        this.mount();
        this.bindEvents();
    }

    mount() {
        if (document.getElementById('floatingDonateBtn')) return;

        // Floating Trigger
        const btn = document.createElement('button');
        btn.id = 'floatingDonateBtn';
        btn.innerHTML = `<i data-lucide="heart" size="18" style="color:var(--state-danger)"></i><span>Qo'llab-quvvatlash</span>`;
        document.body.appendChild(btn);

        // Modal Box
        const modal = document.createElement('div');
        modal.className = 'donate-modal';
        modal.id = 'donateModal';
        modal.innerHTML = `
            <div class="donate-modal-overlay" id="donateModalOverlay"></div>
            <div class="donate-modal-container">
                <div class="card-3d-container" id="card3d">
                    <div class="card-3d">
                        <div class="card-shine" id="cardShine"></div>
                        <div class="card-bank-name">MR BOARD</div>
                        <div class="card-chip-area">
                            <div class="card-chip"></div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8">
                                <path d="M8.5 16.5a5 5 0 0 1 0-7"/>
                                <path d="M12 19a8.5 8.5 0 0 0 0-14"/>
                            </svg>
                        </div>
                        <div class="card-number">8600 1234 5678 9012</div>
                        <div class="card-footer">
                            <div>
                                <div style="font-size:10px; opacity:0.7;">CARD HOLDER</div>
                                <div class="card-holder-name">MUHAMMADRASUL QOSIMOV</div>
                            </div>
                            <div class="card-visa-logo">VISA</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        const btn = document.getElementById('floatingDonateBtn');
        const modal = document.getElementById('donateModal');
        const overlay = document.getElementById('donateModalOverlay');
        const card = document.getElementById('card3d');
        const shine = document.getElementById('cardShine');

        btn?.addEventListener('click', () => modal?.classList.add('is-open'));
        overlay?.addEventListener('click', () => modal?.classList.remove('is-open'));

        // 3D Card Tilt Interaction
        if (card) {
            window.addEventListener('mousemove', e => {
                if (!modal?.classList.contains('is-open')) return;
                const rect = card.getBoundingClientRect();
                const cardX = rect.left + rect.width / 2;
                const cardY = rect.top + rect.height / 2;

                const rotX = -((e.clientY - cardY) / 12);
                const rotY = (e.clientX - cardX) / 12;

                card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

                if (shine) {
                    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
                    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
                    shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.3), transparent 60%)`;
                }
            });
        }
    }
}

export const initDonateModal = () => new DonateModalComponent();
export default initDonateModal;
