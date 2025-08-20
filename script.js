/* script.js
   - particle + gradient background on canvas
   - parallax (mouse/scroll) for subtle depth
   - contact form handling (placeholder)
   - small utility behaviors
*/

(() => {
  // --- canvas particles & animated gradient ---
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);
  let particles = [];
  const PARTICLE_COUNT = Math.max(40, Math.floor((W * H) / 14000));

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function setupParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.8, 3.6),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        alpha: rand(0.15, 0.9),
      });
    }
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  let t = 0;
  function draw() {
    t += 0.002;
    // animated gradient background (slowly shifting)
    const g = ctx.createLinearGradient(0, 0, W, H);
    const shift = Math.sin(t) * 0.5 + 0.5;
    g.addColorStop(0, lerpColor('#071133', '#0f2a5a', shift));
    g.addColorStop(1, lerpColor('#0b1a2a', '#072847', 1 - shift));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // soft overlay radial light
    const rg = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, Math.max(W, H) * 0.7);
    rg.addColorStop(0, 'rgba(124,92,255,0.06)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // particles
    for (let p of particles) {
      ctx.beginPath();
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // move
      p.x += p.vx + Math.sin(t + p.x * 0.001) * 0.2;
      p.y += p.vy + Math.cos(t + p.y * 0.001) * 0.2;

      // wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  function lerpColor(a, b, amount) {
    const ah = parseInt(a.replace('#', ''), 16);
    const bh = parseInt(b.replace('#', ''), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = ar + (br - ar) * amount | 0;
    const rg = ag + (bg - ag) * amount | 0;
    const rb = ab + (bb - ab) * amount | 0;
    return '#' + (rr << 16 | rg << 8 | rb).toString(16).padStart(6, '0');
  }

  // --- parallax on elements with data-parallax attribute (mouse) ---
  const parallaxElements = Array.from(document.querySelectorAll('[data-parallax]'));
  let mouse = { x: 0.5, y: 0.5 };

  function onMouseMove(e) {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
    parallaxElements.forEach(el => {
      const depth = parseFloat(el.getAttribute('data-parallax')) || 0.03;
      const translateX = (mouse.x - 0.5) * depth * 100; // px
      const translateY = (mouse.y - 0.5) * depth * 100;
      el.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
  }

  // --- small scroll parallax (slight) ---
  function onScroll() {
    const sc = window.scrollY;
    parallaxElements.forEach(el => {
      const depth = parseFloat(el.getAttribute('data-parallax')) || 0.03;
      el.style.transform = `translate3d(0, ${sc * depth * -0.04}px, 0)`;
    });
  }

  // --- contact bubble animation (decorative) ---
  function createBubbles() {
    const container = document.getElementById('bubbles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'bubble';
      const size = Math.floor(rand(20, 120));
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = Math.floor(rand(5, 95)) + '%';
      el.style.bottom = Math.floor(rand(-10, 40)) + '%';
      el.style.opacity = rand(0.06, 0.14);
      el.style.transform = `translateY(${rand(-20, 60)}px)`;
      el.style.position = 'absolute';
      el.style.borderRadius = '50%';
      el.style.background = 'linear-gradient(180deg, rgba(124,92,255,0.12), rgba(0,212,255,0.06))';
      el.style.filter = 'blur(10px)';
      container.appendChild(el);
      // animate float via CSS keyframes created inline
      el.animate([
        { transform: `translateY(${rand(0, -30)}px)` },
        { transform: `translateY(${rand(10, 80)}px)` }
      ], { duration: rand(8000, 16000), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
  }

  // --- contact form handling ---
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      // simple front-end validation
      const name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
      if (!name || !email || !message) {
        alert('Please fill all fields.');
        return;
      }
      // here you could integrate an email API or send to server
      alert('Thanks, ' + name + '! Your message has been recorded (demo).');
      form.reset();
    });
  }

  // --- small utilities & events ---
  function init() {
    resize();
    setupParticles();
    draw();
    createBubbles();
    // populate year
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }
  window.addEventListener('resize', () => {
    resize();
    setupParticles();
  });
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('scroll', onScroll);

  init();

  // --- optional: animate some entrance transitions for project cards & hero (scroll reveal) ---
  const animateOnVisible = (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.opacity = '1';
      }
    });
  };
  const obs = new IntersectionObserver(animateOnVisible, { threshold: 0.12 });
  document.querySelectorAll('.card, .skill-card, .hero-text, .profile-img').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'all .7s cubic-bezier(.2,.9,.3,1)';
    obs.observe(el);
  });

})();
