const canvas = document.getElementById('naniteCanvas');
const ctx = canvas.getContext('2d');
let nanites = [];
let mouseX = null;
let mouseY = null;
let clickMode = 'none';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Nanite {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = 4 + Math.random() * 3;
    this.color = 'rgba(0, 247, 255, 0.8)';
    this.pulse = Math.random() * Math.PI * 2;
  }

  draw() {
    ctx.beginPath();
    let glow = 2 + Math.sin(this.pulse) * 2;
    ctx.shadowBlur = glow * 3;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  update() {
    if (mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.hypot(dx, dy);
      let fx = dx / dist;
      let fy = dy / dist;

      if (clickMode === 'left') {
        this.vx += fx * 0.07;
        this.vy += fy * 0.07;
      } else if (clickMode === 'right' && dist < 100) {
        this.vx -= fx * 0.07;
        this.vy -= fy * 0.07;
      } else if (clickMode === 'none' && dist < 20) {
        this.vx -= fx * 0.03;
        this.vy -= fy * 0.03;
      }

      const maxSpeed = 2;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    this.pulse += 0.05;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  react() {
    this.vx *= -1.5;
    this.vy *= -1.5;
    setTimeout(() => {
      this.vx *= -0.666;
      this.vy *= -0.666;
    }, 200);
  }
}

function createNanites(count = 100) {
  for (let i = 0; i < count; i++) {
    nanites.push(new Nanite());
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let n of nanites) {
    n.update();
    n.draw();
  }
  requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mousedown', (e) => {
  if (e.button === 0) clickMode = 'left';
  else if (e.button === 2) clickMode = 'right';
});

window.addEventListener('mouseup', () => {
  clickMode = 'none';
});

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

createNanites();
animate();
