
let nanites = [];
let restartClicked = false;
let titleExploded = false;
let simulationRunning = true;
let controlPanel;

window.addEventListener("DOMContentLoaded", () => {
const isFuturePage = document.title.toLowerCase().includes("future");
if (!isFuturePage) return;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function makeNanite(color, x = null, y = null, growRate = 0.001) {
    const baseSize = 10;
    const maxSize = baseSize * 2;
    return {
        x: x !== null ? x : Math.random() * canvas.width,
        y: y !== null ? y : Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: baseSize,
        distanceMoved: 0,
        color: color,
        growRate: growRate,
        maxSize: maxSize,
        splitSize: maxSize,
        baseSize: baseSize
    };
}

function createNanites(count, color, growRate) {
    for (let i = 0; i < count; i++) {
        nanites.push(makeNanite(color, null, null, growRate));
    }
}

function drawNanites() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nanites.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 30;
        ctx.fill();
    });
}

function updateNanites() {
    if (!simulationRunning) return;
    const newNanites = [];
    for (let i = 0; i < nanites.length; i++) {
        const n = nanites[i];
        const oldX = n.x;
        const oldY = n.y;
        n.x += n.vx;
        n.y += n.vy;

        const dx = n.x - oldX;
        const dy = n.y - oldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        n.distanceMoved += dist;
        n.radius = n.baseSize + n.distanceMoved * n.growRate;

        if (n.radius >= n.splitSize) {
            const angle = Math.atan2(n.vy, n.vx);
            const offset = n.radius / 2;
            const childX = n.x + Math.cos(angle) * offset;
            const childY = n.y + Math.sin(angle) * offset;
            n.x -= Math.cos(angle) * offset;
            n.y -= Math.sin(angle) * offset;
            n.radius = n.baseSize;
            n.distanceMoved = 0;
            newNanites.push(makeNanite(n.color, childX, childY, n.growRate));
        }

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    }
    nanites.push(...newNanites);
}

function animate() {
    drawNanites();
    updateNanites();
    checkNaniteThresholdTriggers();
    requestAnimationFrame(animate);
}

function getColor() {
    return '#444';
}

window.killSimulation = function () {
    simulationRunning = false;
    nanites = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

window.restartSimulation = function () {
    restartClicked = true;
    simulationRunning = true;
    nanites = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const count = parseInt(document.getElementById("naniteCountInput").value);
    const growRate = parseFloat(document.getElementById("growthRateInput").value);
    createNanites(count, getColor(), growRate);
};

function createControlPanel() {
    controlPanel = document.createElement("div");
    controlPanel.classList.add("no-nanite");
    controlPanel.style.cssText = "position:fixed;bottom:60px;right:10px;background:rgba(0,0,0,0.85);color:#ff0000;padding:10px;border-radius:10px;border:1px solid #ff0000;font-family:monospace;z-index:9999;display:none;";
    controlPanel.innerHTML = `
    <div id="debugReadout" style="font-size:12px;color:#ff0000;margin-bottom:4px;">Nanites: 0</div>
    <div>Nanite Controls</div>
    <label>Start Count: <input id="naniteCountInput" type="number" value="60" min="0" max="1000" style="width:60px;"></label><br>
    <label>Grow Rate: <input id="growthRateInput" type="number" value="0.001" step="0.0005" min="0" max="0.01" style="width:60px;"></label><br>
    <label><input id="toggleText" type="checkbox" checked> Show All Text</label><br>
    <button onclick="restartSimulation()" style="background-color: transparent; border: 1px solid lightgreen; color: lightgreen;">▶ Restart Sim</button>
    <button onclick="killSimulation()" style="background-color: transparent; border: 1px solid orange; color: orange;">🛑 Kill Sim</button>
    `;
    document.body.appendChild(controlPanel);
    attachTextToggle();

}
function attachTextToggle() {
    const toggle = document.getElementById("toggleText");
    if (!toggle) return;
    const textElements = [
        document.querySelector('h1'),
        document.querySelector('.infoBox'),
        document.querySelector('.navMenu')
    ];
    toggle.addEventListener('change', () => {
        textElements.forEach(el => {
            if (el) el.style.display = toggle.checked ? '' : 'none';
        });
    });
}


function createToggleButton() {
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "⚙";
    toggleButton.classList.add("no-nanite");
    toggleButton.style.cssText = "position:fixed;bottom:10px;right:10px;width:40px;height:40px;font-size:20px;background:#111;color:#ff0000;border:1px solid #ff0000;border-radius:50%;cursor:pointer;z-index:9999;";
    toggleButton.onclick = () => {
        controlPanel.style.display = controlPanel.style.display === "none" ? "block" : "none";
    };
    document.body.appendChild(toggleButton);
}

function updateDebugCounter() {
    const debug = document.getElementById("debugReadout");
    if (debug) debug.textContent = `Nanites: ${nanites.length}`;
}

function checkNaniteThresholdTriggers() {
    if (restartClicked && nanites.length >= 300) {
        document.querySelectorAll('.no-nanite *').forEach(el => {
            el.classList.add('menu-glitch');
        });
    }

    updateDebugCounter();
    if (restartClicked && nanites.length >= 300 && !titleExploded && document.title.toLowerCase().includes('future')) {
        triggerTextDevour();
        titleExploded = true;
    }
}

function triggerTextDevour() {
    document.querySelectorAll("h1, p, a").forEach(el => {
        if (el.closest(".no-nanite")) return;
        const text = el.textContent;
        el.textContent = "";
        for (let char of text) {
            const span = document.createElement("span");
            span.textContent = char;
            span.style.display = "inline-block";
            span.style.transition = "transform 1s ease, opacity 1.5s ease"; span.style.fontSize = "inherit";
            el.appendChild(span);
        }
    });

    const spans = Array.from(document.querySelectorAll("h1 span, p span, a span"));
    spans.sort(() => Math.random() - 0.5);

    spans.forEach((span, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 100 + 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        setTimeout(() => {
            span.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg)`;
            span.style.opacity = 0;
        }, i * 30);
    });
}

const style = document.createElement("style");
style.textContent = `
@keyframes glitchEffect {
    0% { text-shadow: 1px 1px red, -1px -1px blue; }
    20% { text-shadow: 2px -1px lime, -2px 1px magenta; }
    40% { text-shadow: -1px 2px yellow, 1px -2px cyan; }
    60% { text-shadow: 1px -1px #0ff, -1px 1px #f0f; }
    80% { text-shadow: -2px 2px #fff, 2px -2px #000; }
    100% { text-shadow: 1px 1px red, -1px -1px blue; }
}
.menu-glitch {
    animation: glitchEffect 0.8s infinite;
}`;
document.head.appendChild(style);

createControlPanel();
createToggleButton();
createNanites(60, getColor(), 0.001);
animate();
});
