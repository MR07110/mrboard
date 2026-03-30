// js/ai-modal.js - Barcha sahifalarda AI modal oynasini ochish
(function() {
    // Modal HTML yaratish
    function createAIModal() {
        const modalHTML = `
            <div id="aiModalOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); z-index: 10000; opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1); display: flex; align-items: center; justify-content: center;">
                <div id="aiModalContainer" style="width: 90%; max-width: 500px; height: 80vh; max-height: 700px; background: transparent; border-radius: 32px; transform: scale(0.95); transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); overflow: hidden; box-shadow: 0 32px 64px rgba(0,0,0,0.2);">
                    <iframe id="aiModalIframe" src="ai.html" style="width: 100%; height: 100%; border: none; background: white; border-radius: 32px;"></iframe>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Floating AI tugmasi yaratish
    function createFloatingAIButton() {
        const btnHTML = `
            <button id="floatingAiBtn" style="position: fixed; bottom: 90px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #007aff, #0056b3); box-shadow: 0 8px 24px rgba(0,122,255,0.4); border: none; cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation: aiFloatPulse 2s ease-in-out infinite;">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 8V4H8"/><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>
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
                    #floatingAiBtn { bottom: 80px; right: 16px; width: 48px; height: 48px; }
                    #floatingAiBtn svg { width: 24px; height: 24px; }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', btnHTML);
    }

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

    // Listen for close message from iframe
    window.addEventListener('message', (e) => {
        if (e.data === 'closeAIModal') {
            closeAIModal();
        }
    });

    // Initialize
    function initAIModal() {
        if (!document.getElementById('aiModalOverlay')) {
            createAIModal();
        }
        if (!document.getElementById('floatingAiBtn')) {
            createFloatingAIButton();
        }
        
        const btn = document.getElementById('floatingAiBtn');
        if (btn) {
            btn.addEventListener('click', openAIModal);
        }
        
        // Overlay bosganda yopish
        const overlay = document.getElementById('aiModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeAIModal();
                }
            });
        }
    }

    // Sahifa yuklanganda ishga tushirish
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIModal);
    } else {
        initAIModal();
    }
})();
