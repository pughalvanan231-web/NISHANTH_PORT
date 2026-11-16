// Vercel Insights & Analytics mock script
(function() {
  window.va = window.va || function() {};
  window.vaq = window.vaq || [];
})();

// Nishanth Portfolio — Global Fullscreen Video Player
(function() {
  const VIDEOS = {
    'secnd-soul': {
      title: 'TVK Campaign Film',
      desc: 'Campaign & Event Film (2026)',
      id: '1y0deGPbUyPDxEbK-EXuEznXEvxcO26-e',
      slug: 'secnd-soul'
    },
    'lijoi': {
      title: 'Karuppatti Heritage Film',
      desc: 'Brand Commercial & Documentary (2026)',
      id: '1mD7lxOPurNbsdH-9TFxsl6CCbEhVwccj',
      slug: 'lijoi'
    },
    'afflu': {
      title: 'Angel One Commercial',
      desc: 'Fintech Commercial Campaign (2026)',
      id: '1Z4I7i13aeDysTj-MlQNT79DnCmJ89Twq',
      slug: 'afflu'
    },
    'marianna-caliandro': {
      title: 'Meta Ad Campaign',
      desc: 'High-Retention 9:16 Social Commercial (2026)',
      id: '1Ooc-EUPPFXGLFRNRQNJnL5eI_8h2urQA',
      slug: 'marianna-caliandro'
    },
    'stratedgy': {
      title: 'Fire Work Commercial',
      desc: 'High-Energy Festival Commercial (2026)',
      id: '1WNhfK7bB_SHnIxPQP1r6SGboflN4v1Vy',
      slug: 'stratedgy'
    }
  };

  let modalEl = null;
  let iframeEl = null;
  let titleEl = null;
  let descEl = null;
  let detailsLinkEl = null;
  let fsBtnEl = null;

  function initModal() {
    if (modalEl) return;
    
    // Create modal DOM
    modalEl = document.createElement('div');
    modalEl.id = 'video-fullscreen-modal';
    modalEl.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999999;
      background: rgba(4, 4, 6, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.25s ease;
      opacity: 0;
    `;

    modalEl.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;z-index:10;background:linear-gradient(to bottom, rgba(0,0,0,0.85), transparent);">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span id="vfm-title" style="color:#ffffff;font-size:1.15rem;font-weight:700;letter-spacing:-0.02em;font-family:system-ui,-apple-system,sans-serif;"></span>
          <span id="vfm-desc" style="color:#9ca3af;font-size:0.8rem;font-family:system-ui,-apple-system,sans-serif;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button id="vfm-expand" type="button" style="cursor:pointer;background:rgba(255,255,255,0.12);color:#ffffff;border:1px solid rgba(255,255,255,0.2);border-radius:9999px;padding:8px 16px;font-size:0.8rem;font-weight:600;display:flex;align-items:center;gap:6px;transition:background 0.2s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            <span>Fullscreen</span>
          </button>
          <button id="vfm-close" type="button" style="cursor:pointer;background:#ffffff;color:#000000;border:none;border-radius:9999px;padding:8px 18px;font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:4px;transition:background 0.2s;">
            ✕ Close
          </button>
        </div>
      </div>
      <div id="vfm-box" style="position:relative;width:94vw;max-width:1320px;height:78vh;max-height:820px;margin-top:20px;display:flex;align-items:center;justify-content:center;">
        <iframe id="vfm-iframe" style="width:100%;height:100%;border:1px solid rgba(255,255,255,0.15);border-radius:18px;box-shadow:0 25px 60px -15px rgba(0,0,0,0.9);background:#000;" src="" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
      </div>
      <div style="position:absolute;bottom:14px;left:0;right:0;display:flex;align-items:center;justify-content:center;z-index:10;">
        <a id="vfm-details" href="#" style="color:#a1a1aa;font-size:0.8rem;text-decoration:underline;text-underline-offset:4px;font-family:system-ui,-apple-system,sans-serif;transition:color 0.2s;">
          View full project details &amp; case study →
        </a>
      </div>
    `;

    document.body.appendChild(modalEl);

    iframeEl = document.getElementById('vfm-iframe');
    titleEl = document.getElementById('vfm-title');
    descEl = document.getElementById('vfm-desc');
    detailsLinkEl = document.getElementById('vfm-details');
    fsBtnEl = document.getElementById('vfm-expand');

    // Close handlers
    document.getElementById('vfm-close').addEventListener('click', closeVideoModal);
    modalEl.addEventListener('click', function(e) {
      if (e.target === modalEl) closeVideoModal();
    });

    // Expand fullscreen
    fsBtnEl.addEventListener('click', function() {
      if (!document.fullscreenElement) {
        if (modalEl.requestFullscreen) modalEl.requestFullscreen();
        else if (modalEl.webkitRequestFullscreen) modalEl.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modalEl && modalEl.style.display === 'flex') {
        closeVideoModal();
      }
    });
  }

  function playVideoFullscreen(slugOrId) {
    initModal();
    let video = VIDEOS[slugOrId];
    if (!video) {
      // Try search by ID or title
      for (const k in VIDEOS) {
        if (VIDEOS[k].id === slugOrId || VIDEOS[k].slug === slugOrId) {
          video = VIDEOS[k];
          break;
        }
      }
    }
    if (!video) video = VIDEOS['secnd-soul']; // fallback

    titleEl.textContent = video.title;
    descEl.textContent = video.desc;
    detailsLinkEl.href = '/work/' + video.slug;
    detailsLinkEl.onclick = function() { closeVideoModal(); };

    iframeEl.src = 'https://drive.google.com/file/d/' + video.id + '/preview';
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Fade in
    requestAnimationFrame(function() {
      modalEl.style.opacity = '1';
    });
    return true;
  }

  function closeVideoModal() {
    if (!modalEl) return;
    modalEl.style.opacity = '0';
    document.body.style.overflow = '';
    setTimeout(function() {
      modalEl.style.display = 'none';
      if (iframeEl) iframeEl.src = '';
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch(e) {}
      }
    }, 250);
  }

  // Export to window
  window.playVideoFullscreen = playVideoFullscreen;
  window.closeVideoModal = closeVideoModal;

  // Global click interceptor
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;

    // 1. Any link to /work/<slug> (e.g. "View project")
    const link = target.closest('a[href*="/work/"]');
    if (link) {
      const href = link.getAttribute('href');
      for (const slug in VIDEOS) {
        if (href.endsWith('/work/' + slug) || href.endsWith('/work/' + slug + '/') || href === '/work/' + slug) {
          e.preventDefault();
          e.stopPropagation();
          playVideoFullscreen(slug);
          return;
        }
      }
    }

    // 2. Any element with data-video-slug or data-video-id
    const videoTrigger = target.closest('[data-video-slug], [data-video-id]');
    if (videoTrigger) {
      const slug = videoTrigger.getAttribute('data-video-slug') || videoTrigger.getAttribute('data-video-id');
      if (slug) {
        e.preventDefault();
        e.stopPropagation();
        playVideoFullscreen(slug);
        return;
      }
    }

    // 3. Any featured video card or iframe overlay
    const card = target.closest('.featured-video-card, [data-featured-video]');
    if (card) {
      const slug = card.getAttribute('data-slug');
      if (slug) {
        e.preventDefault();
        e.stopPropagation();
        playVideoFullscreen(slug);
        return;
      }
    }
  }, true);

  // Auto-init DOM once ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
})();
