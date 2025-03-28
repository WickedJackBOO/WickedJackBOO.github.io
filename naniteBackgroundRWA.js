const canvas = document.getElementById('naniteCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const nanites = [];
const blobs = [];
const totalNanites = 60;
const naniteSpeed = 1.5;
const attackSpeed = 2.5;
const visionRange = 500;
const blobSpawnInterval = { min: 1000, max: 20000 };
const maxNanitesPerBlob = 5;
let dragging = false;
let dragX = 0;
let dragY = 0;
let dragInterval = null;

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

class Nanite {
    constructor(id) {
        this.id = id;
        this.x = getRandom(50, canvas.width - 50);
        this.y = getRandom(50, canvas.height - 50);
        this.dx = getRandom(-1, 1);
        this.dy = getRandom(-1, 1);
        this.state = 'wandering';
        this.targetBlob = null;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.state === 'attacking' ? '#ff0000' : '#00ff88';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.state === 'attacking' ? '#ff0000' : '#00ff88';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (this.state === 'wandering') {
            this.bounceAround();
            this.scanForBlobs();
        } else if (this.state === 'attacking') {
            this.moveToBlob();
        }
        this.draw();
    }

    bounceAround() {
        this.x += this.dx * naniteSpeed;
        this.y += this.dy * naniteSpeed;
        if (this.x <= 0 || this.x >= canvas.width) this.dx *= -1;
        if (this.y <= 0 || this.y >= canvas.height) this.dy *= -1;
    }

    scanForBlobs() {
        let closest = null;
        let closestDist = Infinity;

        for (let blob of blobs) {
            if (blob.opacityFade || blob.attackers.length >= blob.maxAttackers || blob.attackers.includes(this)) continue;
            const dist = getDistance(this.x, this.y, blob.x, blob.y);
            if (dist < visionRange && dist < closestDist) {
                closest = blob;
                closestDist = dist;
            }
        }

        if (closest) {
            this.state = 'attacking';
            this.targetBlob = closest;
            closest.attackers.push(this);
        }
    }

    moveToBlob() {
        const blob = this.targetBlob;
        if (!blob || blob.opacityFade || blob.attackers.length > blob.maxAttackers) {
            this.state = 'wandering';
            this.targetBlob = null;
            return;
        }

        const dx = blob.x - this.x;
        const dy = blob.y - this.y;
        const dist = getDistance(this.x, this.y, blob.x, blob.y);
        if (dist > 5) {
            this.x += (dx / dist) * attackSpeed;
            this.y += (dy / dist) * attackSpeed;
        } else {
            blob.checkCollision(this);
        }
    }
}

class Blob {
    constructor(x, y, isMega = false) {
        this.x = x ?? getRandom(100, canvas.width - 100);
        this.y = y ?? getRandom(100, canvas.height - 100);
        this.opacity = 1;
        this.opacityFade = false;
        this.attackers = [];
        this.touched = [];
        this.pulse = 0;
        this.isMega = isMega;
        this.maxAttackers = isMega ? 10 : maxNanitesPerBlob;
        this.particles = [];

        for (let i = 0; i < (isMega ? 20 : 10); i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: getRandom(25, 40),
                size: getRandom(1.5, 3),
                speed: getRandom(0.005, 0.02)
            });
        }

        blobs.push(this);
    }

    draw() {
        this.pulse += 0.05;
        const baseSize = this.isMega ? 30 : 20;
        const radius = baseSize + Math.sin(this.pulse) * 4;

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${this.opacity})`;
        ctx.shadowBlur = this.isMega ? 30 : 20;
        ctx.shadowColor = `rgba(255, 0, 0, ${this.opacity})`;
        ctx.fill();
        ctx.closePath();

        this.particles.forEach(p => {
            p.angle += p.speed;
            const px = this.x + Math.cos(p.angle) * p.radius;
            const py = this.y + Math.sin(p.angle) * p.radius;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${this.opacity * 0.4})`;
            ctx.fill();
            ctx.closePath();
        });

        if (this.opacityFade) {
            this.opacity -= 0.01;
            if (this.opacity <= 0) this.remove();
        }
    }

    checkCollision(nanite) {
        if (!this.touched.includes(nanite)) {
            this.touched.push(nanite);
        }
        if (this.touched.length >= this.maxAttackers && !this.opacityFade) {
            this.opacityFade = true;
        }
    }

    remove() {
        blobs.splice(blobs.indexOf(this), 1);
    }
}

for (let i = 0; i < totalNanites; i++) {
    nanites.push(new Nanite(i));
}

function spawnBlob() {
    if (blobs.length < 12) new Blob();
    const next = getRandom(blobSpawnInterval.min, blobSpawnInterval.max);
    setTimeout(spawnBlob, next);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nanites.forEach(n => n.update());
    blobs.forEach(b => b.draw());
    requestAnimationFrame(animate);
}

animate();
spawnBlob();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    updateDragPosition(e);
    spawnBlobAtCursor(e);
    dragInterval = setInterval(() => {
        if (dragging) {
            spawnBlobAtCursor(e);
        }
    }, 100);
});

canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
        updateDragPosition(e);
    }
});

canvas.addEventListener('mouseup', () => {
    dragging = false;
    clearInterval(dragInterval);
});

canvas.addEventListener('mouseleave', () => {
    dragging = false;
    clearInterval(dragInterval);
});

function updateDragPosition(e) {
    const rect = canvas.getBoundingClientRect();
    dragX = e.clientX - rect.left;
    dragY = e.clientY - rect.top;
}

function spawnBlobAtCursor(e) {
    const isMega = e.shiftKey;
    new Blob(dragX, dragY, isMega);
}
