/* =========================================================
   Krrish Nyoupane — Gallery JS
   Implements: handwriting reveal, canvas sketch background,
   lazy-loading lightbox, keyboard & swipe nav, filters/search,
   mobile toolbar, contact modal, export snippet.
   ========================================================= */

(() => {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------- Prefers Reduced Motion -------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------- Header year -------------- */
  $('#year').textContent = new Date().getFullYear();

  /* -------------- Mobile toolbar toggle -------------- */
  const toolbar = $('#toolbar');
  const menuToggle = $('#menuToggle');
  menuToggle?.addEventListener('click', () => {
    const open = toolbar.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  /* -------------- Handwriting reveal tuning -------------- */
  // If reduced-motion, skip animation by making clip rect full width immediately
  const clipRect = $('#clip-rect');
  if (prefersReduced && clipRect) {
    clipRect.setAttribute('width', '100%');
  } else {
    // progressive enhancement: extend width after webfont paints
    document.fonts?.ready?.then(() => {
      // no-op: animation handled in CSS; presence of webfont ensures accurate width feel
    });
  }

  /* =====================================================
     Sketch Background (Canvas pencil strokes)
     API: window.initSketchBackground({ reducedMotion?: boolean, maxStrokesPerMinute?: number })
     Persists user toggle in localStorage key 'sketchBG'
     ===================================================== */
  const sketchCanvas = $('#sketch-canvas');
  const ctx = sketchCanvas.getContext('2d', { alpha: true, desynchronized: true });

  let sketchEnabled = JSON.parse(localStorage.getItem('sketchBG') ?? 'true');
  const bgToggle = $('#bgToggle');
  const setBgToggleUI = () => {
    bgToggle.textContent = `Sketch BG: ${sketchEnabled ? 'On' : 'Off'}`;
    bgToggle.setAttribute('aria-pressed', String(sketchEnabled));
  };
  setBgToggleUI();

  bgToggle.addEventListener('click', () => {
    sketchEnabled = !sketchEnabled;
    localStorage.setItem('sketchBG', JSON.stringify(sketchEnabled));
    setBgToggleUI();
    if (!sketchEnabled) ctx.clearRect(0,0,sketchCanvas.width, sketchCanvas.height);
  });

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sketchCanvas.width = Math.floor(window.innerWidth * dpr);
    sketchCanvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let rafId = null;
  let strokesPerMinute = 60; // default
  let last = performance.now();
  let particles = [];

  function random(a,b){ return a + Math.random()*(b-a); }
  function addStroke() {
    const x = random(-50, window.innerWidth+50);
    const y = random(-20, window.innerHeight+20);
    const len = random(20, 160);
    const angle = random(-Math.PI, Math.PI);
    const life = random(1800, 4200);
    const w = random(0.6, 1.4);
    const opacity = random(0.06, 0.18);
    particles.push({x,y,len,angle,w,opacity,t:0,life});
  }
  function drawStroke(p, dt) {
    p.t += dt;
    const fade = Math.max(0, 1 - p.t / p.life);
    ctx.save();
    ctx.globalAlpha = p.opacity * fade;
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = p.w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // slightly noisy polyline to feel pencil-y
    const steps = 6;
    for (let i=0;i<=steps;i++){
      const tt = i/steps;
      const nx = p.x + Math.cos(p.angle)*p.len*tt + Math.sin(i*2.1)*1.6;
      const ny = p.y + Math.sin(p.angle)*p.len*tt + Math.cos(i*1.9)*1.4;
      if (i===0) ctx.moveTo(nx, ny); else ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.restore();
  }

  function loop(ts){
    const dt = ts - last;
    last = ts;

    if (sketchEnabled && !prefersReduced && !document.hidden){
      // spawn rate based on strokesPerMinute
      const spawnProb = (strokesPerMinute/60) * (dt/1000);
      if (Math.random() < spawnProb) addStroke();
      // clear with very low alpha for smudge effect
      ctx.fillStyle = 'rgba(244, 242, 238, 0.06)';
      ctx.fillRect(0,0,sketchCanvas.width, sketchCanvas.height);

      particles = particles.filter(p => p.t < p.life);
      particles.forEach(p => drawStroke(p, dt));
    }

    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { /* implicit pause via check */ }
  });

  // Expose small API
  window.initSketchBackground = ({ reducedMotion = prefersReduced, maxStrokesPerMinute = 60 } = {}) => {
    strokesPerMinute = Math.max(8, Math.min(180, maxStrokesPerMinute));
    if (reducedMotion){
      // disable
      sketchEnabled = false;
      localStorage.setItem('sketchBG', 'false');
      setBgToggleUI();
      ctx.clearRect(0,0,sketchCanvas.width, sketchCanvas.height);
    }
  };

  // Respect reduced motion initially
  if (prefersReduced) window.initSketchBackground({ reducedMotion: true });

  /* =====================================================
     GALLERY: filter/search/sort
     ===================================================== */
  const gallery = $('#gallery');

  // Optional: auto-load from gallery.json (if present)
  fetch('gallery.json').then(r => r.ok ? r.json() : null).then(data => {
    if (!data) return;
    // If JSON is present, replace current children with generated figures
    gallery.innerHTML = '';
    for (const item of data){
      const fig = document.createElement('figure');
      fig.className = 'art-card';
      fig.dataset.tags = (item.tags||[]).join(',');
      fig.dataset.year = item.year;
      fig.innerHTML = `
        <picture>
          <img 
            src="assets/art/thumbs/${item.filename}-640.jpg"
            srcset="assets/art/thumbs/${item.filename}-640.jpg 640w, assets/art/thumbs/${item.filename}-1280.jpg 1280w"
            sizes="(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 33vw"
            loading="lazy"
            alt="${escapeHtml(item.alt || item.title)}"/>
        </picture>
        <figcaption>
          <span class="title">${escapeHtml(item.title)}</span>
          <span class="meta">${item.year} — ${escapeHtml(item.medium)}</span>
        </figcaption>
        <div class="overlay" aria-hidden="true">
          <div class="overlay-meta"><strong>${escapeHtml(item.title)}</strong><span>${item.year} · ${escapeHtml(item.medium)}</span></div>
          <div class="overlay-actions">
            <button class="icon-button view-btn" aria-label="View ${escapeHtml(item.title)} fullscreen" data-hires="${item.hi_res_url}">⤢</button>
            ${item.hi_res_url ? `<a class="icon-button" href="${item.hi_res_url}" download aria-label="Download high-res">⬇</a>` : ''}
          </div>
        </div>
      `;
      gallery.appendChild(fig);
    }
    wireCardEvents();
  }).catch(()=>{/* ignore */});

  function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

  // Filter chips
  const chips = $$('.chip[data-filter]');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.toggle('is-active', c===chip));
    const filter = chip.dataset.filter;
    filterGallery({ filter, search: $('#searchInput').value.trim(), sort: $('#sortSelect').value });
  }));

  // Search
  $('#searchInput').addEventListener('input', (e) => {
    filterGallery({ filter: $('.chip.is-active').dataset.filter, search: e.target.value.trim(), sort: $('#sortSelect').value });
  });

  // Sort
  $('#sortSelect').addEventListener('change', (e) => {
    filterGallery({ filter: $('.chip.is-active').dataset.filter, search: $('#searchInput').value.trim(), sort: e.target.value });
  });

  function filterGallery({ filter='all', search='', sort='newest' } = {}){
    const cards = $$('.art-card', gallery);
    const q = search.toLowerCase();

    // sort: create array of nodes -> sort -> append
    const arr = Array.from(cards);
    arr.sort((a,b) => {
      if (sort === 'title') {
        return a.querySelector('.title').textContent.localeCompare(b.querySelector('.title').textContent);
      } else {
        const ya = parseInt(a.dataset.year||'0',10);
        const yb = parseInt(b.dataset.year||'0',10);
        return sort==='newest' ? (yb-ya) : (ya-yb);
      }
    });
    arr.forEach(n => gallery.appendChild(n)); // reflow order

    for (const card of arr){
      const tags = (card.dataset.tags||'').toLowerCase();
      const title = card.querySelector('.title').textContent.toLowerCase();
      const text = `${tags} ${title}`;
      const matchFilter = (filter==='all') || tags.includes(filter);
      const matchSearch = !q || text.includes(q);
      card.style.display = (matchFilter && matchSearch) ? 'inline-block' : 'none';
    }
  }
  filterGallery();

  /* =====================================================
     LIGHTBOX
     ===================================================== */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCaption = $('#lbCaption');
  const lbDownload = $('.lb-download');
  const btnPrev = $('.lb-prev'), btnNext = $('.lb-next');
  const btnClose = $('.lb-close');
  const btnZoomIn = $('.lb-zoom-in'), btnZoomOut = $('.lb-zoom-out');
  const btnExport = $('.lb-export');
  let currentIndex = -1;
  let zoom = 1;

  function wireCardEvents(){
    $$('.view-btn').forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(getCardIndexFromButton(btn));
      });
    });
    // tap-on-card behavior for mobile: first tap shows overlay, second opens
    $$('.art-card').forEach(card => {
      let tapped = false;
      card.addEventListener('click', (e) => {
        const overlay = card.querySelector('.overlay');
        if (window.matchMedia('(hover: none)').matches){
          if (!tapped) { overlay.style.opacity = '1'; tapped = true; setTimeout(()=>tapped=false, 900); return; }
          const btn = card.querySelector('.view-btn');
          btn?.click();
        }
      });
    });
  }
  wireCardEvents();

  function getCards(){ return $$('.art-card').filter(c => c.style.display !== 'none'); }
  function getCardIndexFromButton(btn){
    const card = btn.closest('.art-card');
    return getCards().indexOf(card);
  }

  function openLightbox(index){
    const cards = getCards();
    if (index<0 || index>=cards.length) return;
    currentIndex = index;
    const card = cards[currentIndex];
    const title = card.querySelector('.title').textContent;
    const year = card.dataset.year || '';
    const meta = card.querySelector('.meta')?.textContent || '';
    const hires = card.querySelector('.view-btn').dataset.hires || card.querySelector('img').src;

    lbCaption.textContent = `${title} — ${meta}`;
    lbImg.alt = card.querySelector('img').alt || title;
    lbImg.src = ''; // trigger loader
    $('.sketch-loader').style.display = 'block';
    lbImg.onload = () => { $('.sketch-loader').style.display = 'none'; };
    lbImg.src = hires;
    lbDownload.href = hires;

    lightbox.setAttribute('aria-hidden', 'false');
    zoom = 1; applyZoom();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function show(delta){
    const cards = getCards();
    if (!cards.length) return;
    currentIndex = (currentIndex + delta + cards.length) % cards.length;
    openLightbox(currentIndex);
  }

  btnPrev.addEventListener('click', () => show(-1));
  btnNext.addEventListener('click', () => show(1));
  btnClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (lightbox.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
    if (e.key === '+' || e.key === '=') { zoom*=1.2; applyZoom(); }
    if (e.key === '-' || e.key === '_') { zoom/=1.2; applyZoom(); }
  });

  function applyZoom(){
    zoom = Math.max(1, Math.min(4, zoom));
    lbImg.style.transform = `scale(${zoom})`;
  }
  btnZoomIn.addEventListener('click', () => { zoom*=1.2; applyZoom(); });
  btnZoomOut.addEventListener('click', () => { zoom/=1.2; applyZoom(); });

  // swipe gestures
  (function enableSwipe(){
    let x0=null,y0=null;
    $('.lb-stage').addEventListener('touchstart', e => {
      const t = e.changedTouches[0]; x0=t.clientX; y0=t.clientY;
    }, {passive:true});
    $('.lb-stage').addEventListener('touchend', e => {
      if (x0==null) return;
      const t = e.changedTouches[0]; const dx=t.clientX-x0; const dy=t.clientY-y0;
      if (Math.abs(dx)>50 && Math.abs(dy)<60){ show(dx>0 ? -1 : 1); }
      x0=y0=null;
    });
  })();

  // click outside image closes
  $('.lb-stage').addEventListener('click', (e) => {
    if (e.target === $('.lb-stage')) closeLightbox();
  });

  /* =====================================================
     CONTACT MODAL
     ===================================================== */
  const contactModal = $('#contactModal');
  $('#contactFab').addEventListener('click', () => contactModal.showModal());
  contactModal.addEventListener('click', (e) => {
    const rect = $('.modal-inner', contactModal).getBoundingClientRect();
    const inDialog = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
    if (!inDialog) contactModal.close('cancel');
  });

  /* =====================================================
     BONUS: Export snippet for current artwork
     ===================================================== */
  btnExport.addEventListener('click', () => {
    const snippet = generateSnippet();
    // copy to clipboard
    navigator.clipboard?.writeText(snippet).then(() => {
      btnExport.textContent = '✓';
      setTimeout(()=> btnExport.textContent = '⧉', 900);
    });
    // also show a prompt for manual copy if clipboard not available
    if (!navigator.clipboard) alert(snippet);
  });

  function generateSnippet(){
    const title = lbCaption.textContent || 'Artwork';
    const src = lbImg.src;
    return [
`<!-- Embed: Krrish Nyoupane Artwork -->
<figure style="max-width:800px;margin:auto;text-align:center;font-family:system-ui;">
  <img src="${src}" alt="${lbImg.alt || 'Artwork by Krrish Nyoupane'}" style="width:100%;height:auto;border:2px dashed #bbb;border-radius:12px;padding:6px;background:#fff"/>
  <figcaption style="color:#444;margin-top:.5rem">${title}</figcaption>
  <small>© ${new Date().getFullYear()} Krrish Nyoupane</small>
</figure>`
    ].join('\n');
  }

})();
