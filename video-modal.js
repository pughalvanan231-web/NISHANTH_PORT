// Nishanth Portfolio — Global Fullscreen Video Player (Mobile & Desktop)
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

  function initModal() {
    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.id = 'video-fullscreen-modal';
    modalEl.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: #000000;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      transition: opacity 0.2s ease-in-out;
      opacity: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
    `;

    modalEl.innerHTML = `
      <!-- Top Bar -->
      <div style="width:100%;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;z-index:100;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.1);box-sizing:border-box;">
        <div style="display:flex;flex-direction:column;gap:1px;overflow:hidden;padding-right:12px;">
          <span id="vfm-title" style="color:#ffffff;font-size:1.05rem;font-weight:700;letter-spacing:-0.02em;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
          <span id="vfm-desc" style="color:#9ca3af;font-size:0.75rem;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          <button id="vfm-fs-btn" type="button" style="cursor:pointer;background:rgba(255,255,255,0.15);color:#ffffff;border:1px solid rgba(255,255,255,0.25);border-radius:9999px;padding:8px 14px;font-size:0.78rem;font-weight:600;display:flex;align-items:center;gap:5px;font-family:system-ui,-apple-system,sans-serif;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            <span>Fullscreen</span>
          </button>
          <button id="vfm-close-btn" type="button" style="cursor:pointer;background:#ffffff;color:#000000;border:none;border-radius:9999px;padding:8px 18px;font-size:0.85rem;font-weight:800;display:flex;align-items:center;gap:4px;font-family:system-ui,-apple-system,sans-serif;">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Video Area: 100% full screen responsive -->
      <div style="position:relative;width:100%;height:calc(100% - 95px);flex:1;display:flex;align-items:center;justify-content:center;background:#000000;overflow:hidden;">
        <iframe id="vfm-iframe" style="width:100%;height:100%;border:none;background:#000000;" src="" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>
      </div>

      <!-- Bottom Bar -->
      <div style="width:100%;padding:8px 16px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.08);box-sizing:border-box;">
        <a id="vfm-details" href="#" style="color:#d4d4d8;font-size:0.78rem;text-decoration:underline;text-underline-offset:3px;font-family:system-ui,-apple-system,sans-serif;">
          View project details &amp; case study →
        </a>
      </div>
    `;

    document.body.appendChild(modalEl);

    iframeEl = document.getElementById('vfm-iframe');
    titleEl = document.getElementById('vfm-title');
    descEl = document.getElementById('vfm-desc');
    detailsLinkEl = document.getElementById('vfm-details');

    // Close button
    document.getElementById('vfm-close-btn').addEventListener('click', closeVideoModal);

    // Fullscreen toggle
    document.getElementById('vfm-fs-btn').addEventListener('click', function() {
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
      for (const k in VIDEOS) {
        if (VIDEOS[k].id === slugOrId || VIDEOS[k].slug === slugOrId) {
          video = VIDEOS[k];
          break;
        }
      }
    }
    if (!video) video = VIDEOS['secnd-soul'];

    titleEl.textContent = video.title;
    descEl.textContent = video.desc;
    detailsLinkEl.href = '/work/' + video.slug;
    detailsLinkEl.onclick = function() { closeVideoModal(); };

    iframeEl.src = 'https://drive.google.com/file/d/' + video.id + '/preview?autoplay=1';
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function() {
      modalEl.style.opacity = '1';
    });

    // Attempt native fullscreen if initiated by user tap/click
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

  window.playVideoFullscreen = playVideoFullscreen;
  window.closeVideoModal = closeVideoModal;

  // Intercept click on links, canvas, buttons
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;

    // "View project" link or work link
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
})();
