// js/ai-modal.js - UNIVERSAL (index.html, dashboard.html, board.html uchun)
(function() {
    // ========== KONFIGURATSIYA ==========
    const CONFIG = {
        modalZIndex: 100000,
        btnZIndex: 9999,
        modalWidth: '90%',
        modalMaxWidth: '500px',
        modalHeight: '80vh',
        modalMaxHeight: '650px',
        btnBottom: '90px',
        btnRight: '24px',
        btnSize: '56px',
        btnMobileSize: '48px',
        animationDuration: '0.3s'
    };

    // ========== MODAL YARATISH ==========
    function createAIModal() {
        if (document.getElementById('aiModalOverlay')) return;
        
        const modalHTML = `
            <div id="aiModalOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); z-index: ${CONFIG.modalZIndex}; opacity: 0; visibility: hidden; transition: all ${CONFIG.animationDuration} cubic-bezier(0.2, 0.9, 0.4, 1.1); display: flex; align-items: center; justify-content: center;">
                <div id="aiModalContainer" style="width: ${CONFIG.modalWidth}; max-width: ${CONFIG.modalMaxWidth}; height: ${CONFIG.modalHeight}; max-height: ${CONFIG.modalMaxHeight}; background: transparent; border-radius: 32px; transform: scale(0.95); transition: transform ${CONFIG.animationDuration} cubic-bezier(0.34, 1.4, 0.64, 1); overflow: hidden; box-shadow: 0 32px 64px rgba(0,0,0,0.3);">
                    <iframe id="aiModalIframe" src="ai.html" style="width: 100%; height: 100%; border: none; background: #ffffff; border-radius: 32px;"></iframe>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // ========== FLOATING BUTTON YARATISH ==========
    function createFloatingButton() {
        if (document.getElementById('floatingAiBtn')) return;
        
        // Mavjud tugmani o'chirish (agar eski usulda bo'lsa)
        const existingBtn = document.querySelector('.floating-ai-btn, a[href="ai.html"].floating-ai-btn');
        if (existingBtn && existingBtn.id !== 'floatingAiBtn') {
            existingBtn.remove();
        }
        
        const btnHTML = `
            <button id="floatingAiBtn" style="position: fixed; bottom: ${CONFIG.btnBottom}; right: ${CONFIG.btnRight}; width: ${CONFIG.btnSize}; height: ${CONFIG.btnSize}; border-radius: 50%; background: linear-gradient(135deg, #007aff, #0056b3); box-shadow: 0 8px 24px rgba(0,122,255,0.4); border: none; cursor: pointer; z-index: ${CONFIG.btnZIndex}; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation: aiFloatPulse 2s ease-in-out infinite;">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 8V4H8"/>
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                </svg>
            </button>
            <style>
                @keyframes aiFloatPulse {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                #floatingAiBtn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 12px 32px rgba(0,122,255,0.6);
                }
                @media (max-width: 768px) {
                    #floatingAiBtn {
                        bottom: 80px;
                        right: 16px;
                        width: ${CONFIG.btnMobileSize};
                        height: ${CONFIG.btnMobileSize};
                    }
                    #floatingAiBtn svg {
                        width: 24px;
                        height: 24px;
                    }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', btnHTML);
    }

    // ========== MODAL FUNKSIYALARI ==========
    function openAIModal() {
        const overlay = document.getElementById('aiModalOverlay');
        const container = document.getElementById('aiModalContainer');
        if (overlay && container) {
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }
    }

    function closeAIModal() {
        const overlay = document.getElementById('aiModalOverlay');
        const container = document.getElementById('aiModalContainer');
        if (overlay && container) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            container.style.transform = 'scale(0.95)';
        }
    }

    // ========== EVENT LISTENERLAR ==========
    function setupEventListeners() {
        // Iframe dan yopish xabari
        window.addEventListener('message', (e) => {
            if (e.data === 'closeAIModal') {
                closeAIModal();
            }
        });

        // Escape tugmasi bilan yopish
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAIModal();
            }
        });

        // Overlay bosganda yopish
        const overlay = document.getElementById('aiModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeAIModal();
                }
            });
        }

        // Tugmani bosganda ochish
        const btn = document.getElementById('floatingAiBtn');
        if (btn) {
            // Eski event listenerlarni tozalash
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openAIModal();
            });
        }
    }

    // ========== MOBIL UCHUN O'LCHAMLARNI SOZLASH ==========
    function adjustForMobile() {
        if (window.innerWidth <= 768) {
            const btn = document.getElementById('floatingAiBtn');
            if (btn) {
                btn.style.bottom = '80px';
                btn.style.right = '16px';
            }
        }
    }

    // ========== INIT ==========
    function initAIModal() {
        // Modalni yaratish
        createAIModal();
        
        // Tugmani yaratish (agar mavjud bo'lmasa)
        createFloatingButton();
        
        // Event listenerlarni o'rnatish
        setupEventListeners();
        
        // Mobil uchun sozlash
        adjustForMobile();
        window.addEventListener('resize', adjustForMobile);
        
        // Agar board.html da existing tugma bo'lsa, uni o'chirish
        const existingLinks = document.querySelectorAll('a.floating-ai-btn, .floating-ai-btn[href="ai.html"]');
        existingLinks.forEach(link => {
            if (link.id !== 'floatingAiBtn') {
                link.remove();
            }
        });
    }

    // ========== ISHGA TUSHIRISH ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIModal);
    } else {
        initAIModal();
    }
})();
