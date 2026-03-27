// home/script.js

// Ikonkalarni yuklash
document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) lucide.createIcons();

    // Scroll Reveal Animatsiyasi
    function reveal() {
        var reveals = document.querySelectorAll(".reveal");
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 100;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add("active");
            }
        }
    }
    window.addEventListener("scroll", reveal);
    reveal();

    // IFRAME CYCLING - PART ANIMATION
    const partCount = 20;
    let currentPart = 1;
    let isWaiting = false;
    const iframe = document.getElementById('board-iframe');

    window.addEventListener('message', function(event) {
        if (event.data === 'next' && !isWaiting) {
            isWaiting = true;
            setTimeout(function() {
                let nextPart = currentPart + 1;
                if (nextPart > partCount) {
                    nextPart = 1;
                }
                currentPart = nextPart;
                iframe.src = `parts/part${currentPart}/index.html`;
                isWaiting = false;
            }, 500);
        }
    });
});
