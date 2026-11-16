// Nishanth Portfolio — Global Fullscreen Video Player (Mobile & Desktop)
(function() {
  const VIDEOS = {
    'marianna-caliandro': {
      title: 'Meta Ad Campaign',
      desc: 'High-Retention 9:16 Social Commercial (2026)',
      id: '1Ooc-EUPPFXGLFRNRQNJnL5eI_8h2urQA',
      slug: 'marianna-caliandro'
    },
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

  function initModal() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .ClientsSection-module__wAld6q__rows { display: none !important; }
      .NavBar-module__aMivtW__bar {
        padding: 0 20px !important;
        height: 48px !important;
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        box-sizing: border-box !important;
      }
      .NavBar-module__aMivtW__logo { display: none !important; }
      .NavBar-module__aMivtW__wordmark {
        position: static !important;
        left: auto !important;
        right: auto !important;
        top: auto !important;
        translate: none !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        font-family: var(--font-grotesk), system-ui, -apple-system, sans-serif !important;
        font-size: 1.15rem !important;
        font-weight: 700 !important;
        letter-spacing: -0.015em !important;
        line-height: 1 !important;
        text-decoration: none !important;
      }
      .NavBar-module__aMivtW__right {
        display: flex !important;
        align-items: center !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .NavBar-module__aMivtW__menuBox {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: var(--font-grotesk), system-ui, -apple-system, sans-serif !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.05em !important;
        line-height: 1 !important;
      }
      .NavBar-module__aMivtW__word {
        writing-mode: horizontal-tb !important;
        width: auto !important;
        height: auto !important;
        line-height: 1 !important;
        display: flex !important;
        align-items: center !important;
      }
    `;
    document.head.appendChild(styleEl);

    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.id = 'video-fullscreen-modal';
    modalEl.style.cssText = 'display:none;position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;background:#000000;flex-direction:column;justify-content:space-between;align-items:center;transition:opacity 0.2s ease-in-out;opacity:0;overflow:hidden;margin:0;padding:0;';

    modalEl.innerHTML = `
      <!-- Top Bar Controls -->
      <div style="width:100%;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;z-index:100;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.12);box-sizing:border-box;">
        <div style="display:flex;flex-direction:column;gap:2px;overflow:hidden;padding-right:12px;">
          <span id="vfm-title" style="color:#ffffff;font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
          <span id="vfm-desc" style="color:#a1a1aa;font-size:0.78rem;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <button id="vfm-fs-btn" type="button" style="cursor:pointer;background:rgba(255,255,255,0.14);color:#ffffff;border:1px solid rgba(255,255,255,0.25);border-radius:9999px;padding:8px 16px;font-size:0.8rem;font-weight:600;display:flex;align-items:center;gap:5px;font-family:system-ui,-apple-system,sans-serif;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            <span>Fullscreen</span>
          </button>
          <button id="vfm-close-btn" type="button" style="cursor:pointer;background:#ffffff;color:#000000;border:none;border-radius:9999px;padding:8px 20px;font-size:0.88rem;font-weight:800;display:flex;align-items:center;gap:4px;font-family:system-ui,-apple-system,sans-serif;">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Video Area: Pure 100% viewport edge-to-edge -->
      <div style="position:relative;width:100%;height:calc(100% - 65px);flex:1;display:flex;align-items:center;justify-content:center;background:#000000;overflow:hidden;">
        <iframe id="vfm-iframe" style="position:absolute;top:-65px;left:0;width:100%;height:calc(100% + 160px);border:none;background:#000000;" src="" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>
        <div id="vfm-bottom-mask" style="position:absolute;bottom:0;left:0;right:0;height:72px;background:#000000;z-index:20;pointer-events:none;"></div>
      </div>
    `;

    document.body.appendChild(modalEl);

    iframeEl = document.getElementById('vfm-iframe');
    titleEl = document.getElementById('vfm-title');
    descEl = document.getElementById('vfm-desc');

    document.getElementById('vfm-close-btn').addEventListener('click', closeVideoModal);

    document.getElementById('vfm-fs-btn').addEventListener('click', function() {
      if (!document.fullscreenElement) {
        if (modalEl.requestFullscreen) modalEl.requestFullscreen();
        else if (modalEl.webkitRequestFullscreen) modalEl.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

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
      for (const k in VIDEOS) {
        if (VIDEOS[k].id === slugOrId || VIDEOS[k].slug === slugOrId) {
          video = VIDEOS[k];
          break;
        }
      }
    }
    if (!video) video = VIDEOS['marianna-caliandro'] || VIDEOS['secnd-soul'];

    titleEl.textContent = video.title;
    descEl.textContent = video.desc;

    iframeEl.src = 'https://drive.google.com/file/d/' + video.id + '/preview?autoplay=1';
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function() {
      modalEl.style.opacity = '1';
    });

    try {
      if (modalEl.requestFullscreen) {
        modalEl.requestFullscreen().catch(function() {});
      } else if (modalEl.webkitRequestFullscreen) {
        modalEl.webkitRequestFullscreen().catch(function() {});
      }
    } catch(e) {}

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
    }, 200);
  }

  function playActiveVideo() {
    if (window.currentWorkSlug && VIDEOS[window.currentWorkSlug]) {
      playVideoFullscreen(window.currentWorkSlug);
      return;
    }
    const activeLink = document.querySelector('.WorkReel-module__olH-9q__info a[href*="/work/"]') || 
                       document.querySelector('.WorkReel-module__olH-9q__current') ||
                       document.querySelector('a.link-swap[href*="/work/"]') ||
                       document.querySelector('a[href*="/work/"]');
    if (activeLink) {
      const href = activeLink.getAttribute('href') || '';
      for (const slug in VIDEOS) {
        if (href.includes(slug)) {
          playVideoFullscreen(slug);
          return;
        }
      }
    }
    playVideoFullscreen('marianna-caliandro');
  }

  window.playVideoFullscreen = playVideoFullscreen;
  window.closeVideoModal = closeVideoModal;
  window.playActiveVideo = playActiveVideo;

  // Touch tracking for canvas tap
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  document.addEventListener('touchstart', function(e) {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    const target = e.target;
    if (!target) return;
    if (target.tagName === 'CANVAS' || target.closest('canvas')) {
      const dt = Date.now() - touchStartTime;
      const touch = e.changedTouches ? e.changedTouches[0] : null;
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);
        if (dx < 20 && dy < 20 && dt < 450) {
          playActiveVideo();
        }
      }
    }
  }, { passive: true });

  // Click tracking
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;

    // Direct click on 3D canvas
    if (target.tagName === 'CANVAS' || target.closest('canvas')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      playActiveVideo();
      return;
    }

    // Play video / View project link
    const link = target.closest('a[href*="/work/"]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      const href = link.getAttribute('href') || '';
      for (const slug in VIDEOS) {
        if (href.includes(slug)) {
          playVideoFullscreen(slug);
          return;
        }
      }
      playActiveVideo();
      return;
    }

    // Any card or data-slug
    const card = target.closest('[data-slug], [data-video-id], [data-video-slug]');
    if (card) {
      const slug = card.getAttribute('data-slug') || card.getAttribute('data-video-slug') || card.getAttribute('data-video-id');
      if (slug && VIDEOS[slug]) {
        e.preventDefault();
        e.stopPropagation();
        playVideoFullscreen(slug);
        return;
      }
    }
  }, true);

  
  function checkUrlAutoPlay() {
    const path = (window.location.pathname || '').toLowerCase();
    for (const slug in VIDEOS) {
      if (path.includes('/work/' + slug)) {
        setTimeout(function() {
          playVideoFullscreen(slug);
        }, 80);
        return;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initModal();
      checkUrlAutoPlay();
    });
  } else {
    initModal();
    checkUrlAutoPlay();
  }

})();
