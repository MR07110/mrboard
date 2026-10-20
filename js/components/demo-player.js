// js/components/demo-player.js - High-Performance Interactive Demo Player for Landing Page

export class DemoPlayerComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = null;
        this.ctx = null;
        this.cursor = null;
        this.stepLabel = null;
        this.progressBar = null;

        this.currentStep = 0;
        this.totalSteps = 6;
        this.timer = null;

        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div style="position:relative; width:100%; height:100%; background:var(--bg-canvas); overflow:hidden;">
                <canvas id="demo-canvas" style="width:100%; height:100%;"></canvas>
                <div id="demo-cursor" style="position:absolute; width:28px; height:28px; pointer-events:none; z-index:10; transform:translate(-50%, -50%); transition:all 0.6s cubic-bezier(0.25, 1, 0.5, 1);">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#007aff" stroke="#ffffff" stroke-width="1.5">
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    </svg>
                </div>
                <div style="position:absolute; bottom:16px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:center; z-index:20; background:var(--bg-panel); backdrop-filter:blur(16px); padding:8px 16px; border-radius:99px; border:1px solid var(--border-subtle); box-shadow:var(--shadow-sm);">
                    <div id="demo-step-label" style="font-size:12px; font-weight:700; color:var(--text-main);">✨ MR BOARD Enterprise Demo</div>
                    <div style="display:flex; gap:6px;">
                        <button id="demo-prev-btn" style="background:var(--bg-hover); border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">◀</button>
                        <button id="demo-next-btn" style="background:var(--brand-primary); color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">▶</button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('demo-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.cursor = document.getElementById('demo-cursor');
        this.stepLabel = document.getElementById('demo-step-label');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        document.getElementById('demo-prev-btn')?.addEventListener('click', () => this.prevStep());
        document.getElementById('demo-next-btn')?.addEventListener('click', () => this.nextStep());

        this.playStep(0);
    }

    resize() {
        if (!this.canvas || !this.container) return;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.redrawCurrent();
    }

    playStep(index) {
        this.currentStep = (index + this.totalSteps) % this.totalSteps;
        clearTimeout(this.timer);

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        switch (this.currentStep) {
            case 0:
                this.stepIntro(w, h);
                break;
            case 1:
                this.stepDraw(w, h);
                break;
            case 2:
                this.stepLaser(w, h);
                break;
            case 3:
                this.stepShapes(w, h);
                break;
            case 4:
                this.stepText(w, h);
                break;
            case 5:
                this.stepCollab(w, h);
                break;
        }

        this.timer = setTimeout(() => this.nextStep(), 3600);
    }

    nextStep() {
        this.playStep(this.currentStep + 1);
    }

    prevStep() {
        this.playStep(this.currentStep - 1);
    }

    moveCursor(x, y) {
        if (this.cursor) {
            this.cursor.style.left = `${x}px`;
            this.cursor.style.top = `${y}px`;
        }
    }

    stepIntro(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "1/6 · Xush kelibsiz — Cheksiz Canvas";
        this.moveCursor(w * 0.5, h * 0.5);

        this.ctx.fillStyle = "#007aff";
        this.ctx.font = "900 36px -apple-system, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("MR BOARD", w * 0.5, h * 0.45);

        this.ctx.fillStyle = "#64748b";
        this.ctx.font = "600 16px -apple-system, sans-serif";
        this.ctx.fillText("Real-vaqtda jamoaviy ishlash platformasi", w * 0.5, h * 0.53);
    }

    stepDraw(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "2/6 · Silliq 60FPS Erkin Chizish";
        this.moveCursor(w * 0.7, h * 0.6);

        this.ctx.strokeStyle = "#007aff";
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.2, h * 0.5);
        this.ctx.bezierCurveTo(w * 0.35, h * 0.2, w * 0.55, h * 0.8, w * 0.75, h * 0.4);
        this.ctx.stroke();
    }

    stepLaser(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "3/6 · Laser Wand (O'qituvchi ko'rsatkichi)";
        this.moveCursor(w * 0.65, h * 0.45);

        this.ctx.shadowBlur = 18;
        this.ctx.shadowColor = "#ff3b30";
        this.ctx.strokeStyle = "#ff3b30";
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.arc(w * 0.5, h * 0.5, 60, 0, Math.PI * 1.5);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    stepShapes(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "4/6 · Geometrik Shakllar & O'qlar";
        this.moveCursor(w * 0.7, h * 0.35);

        this.ctx.strokeStyle = "#34c759";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(w * 0.2, h * 0.3, 140, 90);

        this.ctx.strokeStyle = "#af52de";
        this.ctx.beginPath();
        this.ctx.arc(w * 0.65, h * 0.45, 55, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    stepText(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "5/6 · Matn va Formula Yozish";
        this.moveCursor(w * 0.5, h * 0.5);

        this.ctx.fillStyle = "#0f172a";
        this.ctx.font = "800 24px -apple-system, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("E = mc²", w * 0.5, h * 0.46);

        this.ctx.fillStyle = "#64748b";
        this.ctx.font = "600 15px -apple-system, sans-serif";
        this.ctx.fillText("Formula va izohlar doska koordinatasida saqlanadi", w * 0.5, h * 0.55);
    }

    stepCollab(w, h) {
        if (this.stepLabel) this.stepLabel.innerText = "6/6 · Real-Vaqt Hamkorlik va Audio Chat";
        this.moveCursor(w * 0.6, h * 0.5);

        // Remote cursor 1
        this.ctx.fillStyle = "#ff9500";
        this.ctx.beginPath();
        this.ctx.arc(w * 0.35, h * 0.4, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#0f172a";
        this.ctx.font = "bold 12px sans-serif";
        this.ctx.fillText("Aziz (Student)", w * 0.35, h * 0.4 - 12);

        // Remote cursor 2
        this.ctx.fillStyle = "#007aff";
        this.ctx.beginPath();
        this.ctx.arc(w * 0.65, h * 0.6, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#0f172a";
        this.ctx.fillText("Madina (Teacher 👑)", w * 0.65, h * 0.6 - 12);
    }

    redrawCurrent() {
        this.playStep(this.currentStep);
    }
}

export default DemoPlayerComponent;
