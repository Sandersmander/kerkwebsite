/* ==========================================================================
   Protestantse Gemeente Ginneken — Interactieve Applicatielogica
   ========================================================================== */

(function () {
  'use strict';

  const SECTIONS = [
    'welkom',
    'diensten',
    'nieuws',
    'publiciteit',
    'verdieping',
    'jeugd',
    'fotos',
    'pastoraat',
    'diaconaat',
    'kerkenwerk',
    'organisatie',
    'anbi',
    'geschiedenis',
    'verhuur',
    'contact'
  ];

  // Map legacy filenames from protestantsegemeenteginneken.nl to new sections
  const LEGACY_MAP = {
    'index.php': 'welkom',
    'agenda.php': 'nieuws',
    'agendaarchief.php': 'nieuws',
    'zondagdiensten.php': 'diensten',
    'rondomhetvieren.html': 'diensten',
    'verdieping.php': 'verdieping',
    'verdiepingarchief.php': 'verdieping',
    'rondomhetleren.html': 'verdieping',
    'kerkgids.php': 'organisatie',
    'kerkgids.html': 'organisatie',
    'pastoraat.html': 'pastoraat',
    'anbi.html': 'anbi',
    'anbi-diaconie.html': 'anbi',
    'diaconaat.html': 'diaconaat',
    'kerkrentmeesters.html': 'organisatie',
    'publiciteit.html': 'publiciteit',
    'privacyverklaring.html': 'organisatie',
    'werkaandekerk.html': 'kerkenwerk',
    'jeugd.html': 'jeugd',
    'dekleinekerk.php': 'jeugd',
    'paperclip.html': 'jeugd',
    'studenten.html': 'jeugd',
    'service.html': 'organisatie',
    'verhuur.html': 'organisatie',
    'burgerlijkhuwelijk.html': 'organisatie',
    'fotos.php': 'fotos',
    'geschiedenis.html': 'geschiedenis',
    'extrageschiedenis.html': 'geschiedenis',
    'contact.html': 'contact'
  };

  window.navigateTo = function (sectionId, subAnchor) {
    if (!SECTIONS.includes(sectionId)) {
      sectionId = 'welkom';
    }

    // Update active view
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === 'sec-' + sectionId);
    });

    // Update quick pills
    document.querySelectorAll('.quick-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.target === sectionId);
    });

    // Update top nav active state
    document.querySelectorAll('.nav-link[data-nav]').forEach((link) => {
      const targets = link.dataset.nav.split(',');
      link.classList.toggle('active', targets.includes(sectionId));
    });

    // Close mobile menu or modals if open
    closeModal('sitemap-modal');
    closeModal('search-modal');

    // Update URL hash without jumping
    if (history.pushState) {
      history.pushState(null, '', '#' + sectionId);
    } else {
      window.location.hash = sectionId;
    }

    if (subAnchor) {
      setTimeout(() => {
        const el = document.getElementById(subAnchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sub-tab switcher (e.g. ANBI Kerk vs ANBI Diaconie)
  window.switchSubTab = function (group, tabId, btnEl) {
    document.querySelectorAll(`[data-tab-group="${group}"]`).forEach((panel) => {
      panel.style.display = panel.id === tabId ? 'block' : 'none';
    });
    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll('.subnav-btn').forEach((b) => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
  };

  window.switchAnbiTab = function (which) {
    const panelId = which === 'diaconie' ? 'anbi-diaconie-panel' : 'anbi-kerk-panel';
    const buttons = document.querySelectorAll('#sec-anbi .subnav-btn');
    const targetBtn = which === 'diaconie' ? buttons[1] : buttons[0];
    window.switchSubTab('anbi', panelId, targetBtn);
  };

  // Modal helpers
  window.openModal = function (id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeModal = function (id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  let featuredNewsIds = ['539', '538', '537', '536', '535', '534', '533', '532', '529', '528', '531', '527'];
  let activeVerdiepingFilter = 'all';

  function renderNewsViews() {
    const data = window.PGG_SCRAPED_DATA;
    if (!data) return;

    const newsGrid = document.getElementById('news-grid-main');
    const homeFeatured = document.getElementById('home-news-featured');
    const homeSide = document.getElementById('home-news-side');
    const archiveTableBody = document.getElementById('news-archive-tbody');

    if (newsGrid) {
      newsGrid.innerHTML = featuredNewsIds
        .map((id) => {
          const art = data.agenda_articles[id] || (data.agenda_archive || []).find((x) => x.id === id);
          if (!art) return '';
          const plain = (art.html || art.summary || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const excerpt = plain.length > 140 ? plain.slice(0, 140) + '…' : plain;
          const img = art.local_image || art.image || 'assets/images/herfst-2022.jpg';
          return `
            <article class="article-card" onclick="openArticle('agenda', '${id}')">
              <img class="article-card-img" src="${img}" alt="${escapeHtml(art.title)}" onerror="this.src='assets/images/herfst-2022.jpg'" loading="lazy" />
              <div class="article-card-body">
                <div class="article-card-date">${escapeHtml(art.date || 'Actueel')}</div>
                <h3 class="article-card-title">${escapeHtml(art.title)}</h3>
                <p class="article-card-excerpt">${escapeHtml(excerpt)}</p>
                <span class="article-card-link">Lees volledig bericht &rarr;</span>
              </div>
            </article>
          `;
        })
        .join('');
    }

    // Master-Detail op de Homepagina (volgens ontwerp KerkWebsite.pdf)
    if (homeFeatured && featuredNewsIds.length > 0) {
      const mainId = featuredNewsIds[0];
      const mainArt = data.agenda_articles[mainId] || (data.agenda_archive || []).find((x) => x.id === mainId);
      if (mainArt) {
        const plain = (mainArt.html || mainArt.summary || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const excerpt = plain.length > 340 ? plain.slice(0, 340) + '…' : plain;
        const img = mainArt.local_image || mainArt.image || 'assets/images/kerk-en-laurentiushof.jpg';
        homeFeatured.innerHTML = `
          <article class="news-featured-card" onclick="openArticle('agenda', '${mainId}')">
            <img class="news-featured-img" src="${img}" alt="${escapeHtml(mainArt.title)}" onerror="this.src='assets/images/kerk-en-laurentiushof.jpg'" />
            <div class="news-featured-body">
              <div><span class="badge badge-orange">${escapeHtml(mainArt.date || 'Actueel')}</span></div>
              <h3>${escapeHtml(mainArt.title)}</h3>
              <p>${escapeHtml(excerpt)}</p>
              <div>
                <span class="btn btn-orange" style="padding:0.55rem 1.35rem;font-size:0.9rem;">lees meer &rarr;</span>
              </div>
            </div>
          </article>
        `;
      }
    }

    if (homeSide) {
      homeSide.innerHTML = featuredNewsIds
        .slice(1, 5)
        .map((id) => {
          const art = data.agenda_articles[id] || (data.agenda_archive || []).find((x) => x.id === id);
          if (!art) return '';
          const plain = (art.html || art.summary || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const excerpt = plain.length > 110 ? plain.slice(0, 110) + '…' : plain;
          const img = art.local_image || art.image || 'assets/images/herfst-2022.jpg';
          return `
            <article class="news-compact-card" onclick="openArticle('agenda', '${id}')">
              <img class="news-compact-thumb" src="${img}" alt="${escapeHtml(art.title)}" onerror="this.src='assets/images/herfst-2022.jpg'" loading="lazy" />
              <div>
                <div style="font-size:0.75rem;color:var(--pkn-orange-dark);font-weight:700;margin-bottom:0.15rem;">${escapeHtml(art.date || '')}</div>
                <div class="news-compact-title">${escapeHtml(art.title)}</div>
                <div class="news-compact-excerpt">${escapeHtml(excerpt)}</div>
              </div>
            </article>
          `;
        })
        .join('');
    }

    if (archiveTableBody && data.agenda_archive) {
      renderArchiveRows(data.agenda_archive);
    }
  }

  window.filterVerdieping = function (cat) {
    activeVerdiepingFilter = cat || 'all';
    const data = window.PGG_SCRAPED_DATA;
    if (!data || !data.verdieping_articles) return;

    // Update active tab styling
    ['all', 'gedicht', 'verhaal'].forEach((t) => {
      const btn = document.getElementById('verdieping-tab-' + t);
      if (btn) btn.classList.toggle('active', t === activeVerdiepingFilter);
    });

    const headingEl = document.getElementById('verdieping-list-heading');
    if (headingEl) {
      if (activeVerdiepingFilter === 'gedicht') {
        headingEl.textContent = 'Gedichten & Liederen';
      } else if (activeVerdiepingFilter === 'verhaal') {
        headingEl.textContent = 'Verhalen, Meditaties & Schatten van Laurentius';
      } else {
        headingEl.textContent = 'Gedichten, Verhalen & Schatten van Laurentius';
      }
    }

    const verdiepingGrid = document.getElementById('verdieping-grid');
    if (!verdiepingGrid) return;

    const vKeys = Object.keys(data.verdieping_articles).sort((a, b) => {
      const na = Number(String(a).replace('a_', ''));
      const nb = Number(String(b).replace('a_', ''));
      return nb - na;
    });

    const filteredKeys = vKeys.filter((id) => {
      if (activeVerdiepingFilter === 'all') return true;
      return (data.verdieping_articles[id].category || 'verhaal') === activeVerdiepingFilter;
    });

    verdiepingGrid.innerHTML = filteredKeys
      .map((id) => {
        const art = data.verdieping_articles[id];
        const plain = (art.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const excerpt = plain.length > 150 ? plain.slice(0, 150) + '…' : plain;
        const isPoem = art.category === 'gedicht';
        const img = art.local_image || art.image || (isPoem ? 'assets/images/kaars_kroonluchter_web.jpg' : 'assets/images/Bijbel-PGG.png');
        const badgeHtml = isPoem
          ? '<span class="badge badge-purple" style="margin-right:0.4rem;">Gedicht</span>'
          : '<span class="badge badge-orange" style="margin-right:0.4rem;">Verhaal</span>';
        return `
          <article class="article-card" onclick="openArticle('verdieping', '${id}')">
            <img class="article-card-img" src="${img}" alt="${escapeHtml(art.title)}" onerror="this.src='assets/images/Bijbel-PGG.png'" loading="lazy" />
            <div class="article-card-body">
              <div class="article-card-date">${badgeHtml}${escapeHtml(art.date)}</div>
              <h3 class="article-card-title" style="margin-top:0.35rem;">${escapeHtml(art.title)}</h3>
              <p class="article-card-excerpt">${escapeHtml(excerpt)}</p>
              <span class="article-card-link">Lees ${isPoem ? 'gedicht' : 'verhaal'} &rarr;</span>
            </div>
          </article>
        `;
      })
      .join('');
  };

  // Webmaster Portal (invoerAgenda) handler
  window.submitPortalArticle = function (e) {
    e.preventDefault();
    const data = window.PGG_SCRAPED_DATA;
    if (!data) return;

    const cat = document.getElementById('portal-category').value;
    const date = document.getElementById('portal-date').value.trim();
    const title = document.getElementById('portal-title').value.trim();
    const img = document.getElementById('portal-image').value.trim() || 'assets/images/kerk-en-laurentiushof.jpg';
    const body = document.getElementById('portal-body').value.trim();
    const htmlBody = escapeHtml(body).replace(/\n/g, '<br />\n');

    if (cat === 'agenda') {
      const newId = String(Date.now()).slice(-4);
      data.agenda_articles[newId] = {
        title: title,
        date: date,
        image: img,
        local_image: img,
        html: htmlBody
      };
      if (data.agenda_archive) {
        data.agenda_archive.unshift({
          id: newId,
          date: date,
          title: title,
          summary: body.slice(0, 140)
        });
      }
      featuredNewsIds.unshift(newId);
      renderNewsViews();
      closeModal('portal-modal');
      navigateTo('welkom');
      openArticle('agenda', newId);
    } else {
      const newId = String(Date.now()).slice(-4);
      data.verdieping_articles[newId] = {
        title: title,
        date: date,
        image: img,
        local_image: img,
        html: htmlBody,
        category: cat
      };
      closeModal('portal-modal');
      navigateTo('verdieping');
      window.filterVerdieping(cat);
      openArticle('verdieping', newId);
    }
  };

  // Render scraped articles & archives
  function initScrapedContent() {
    const data = window.PGG_SCRAPED_DATA;
    if (!data) return;

    // 1. Render latest news on Home & Nieuws page
    renderNewsViews();

    // 2. Render Verdieping articles (Gedichten & Verhalen)
    window.filterVerdieping('all');

    // 3. Render Kleine Kerk articles
    const kkGrid = document.getElementById('kleinekerk-grid');
    if (kkGrid && data.kleinekerk_articles) {
      const kKeys = Object.keys(data.kleinekerk_articles).sort((a, b) => Number(b) - Number(a));
      kkGrid.innerHTML = kKeys
        .map((id) => {
          const art = data.kleinekerk_articles[id];
          const plain = (art.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const excerpt = plain.length > 130 ? plain.slice(0, 130) + '…' : plain;
          const img = art.local_image || art.image || 'assets/images/Gezocht-versterking-knd.jpg';
          return `
            <article class="article-card" onclick="openArticle('kleinekerk', '${id}')">
              <img class="article-card-img" src="${img}" alt="${escapeHtml(art.title)}" onerror="this.src='assets/images/Gezocht-versterking-knd.jpg'" loading="lazy" />
              <div class="article-card-body">
                <div class="article-card-date">${escapeHtml(art.date)}</div>
                <h3 class="article-card-title">${escapeHtml(art.title)}</h3>
                <p class="article-card-excerpt">${escapeHtml(excerpt)}</p>
                <span class="article-card-link">Lees bericht &rarr;</span>
              </div>
            </article>
          `;
        })
        .join('');
    }

    // 4. Render Photo Albums
    const albumsGrid = document.getElementById('albums-grid');
    if (albumsGrid && data.photo_albums) {
      albumsGrid.innerHTML = data.photo_albums
        .map((album, idx) => {
          return `
            <article class="article-card" onclick="openAlbum(${idx})">
              <img class="article-card-img" src="${album.cover}" alt="${escapeHtml(album.title)}" onerror="this.src='assets/images/kerk-zomer2017-2.jpg'" loading="lazy" />
              <div class="article-card-body">
                <div class="article-card-date"><span class="badge badge-orange">${album.count} foto's</span></div>
                <h3 class="article-card-title" style="margin-top:0.4rem;">${escapeHtml(album.title)}</h3>
                <span class="article-card-link">Bekijk fotoalbum &rarr;</span>
              </div>
            </article>
          `;
        })
        .join('');
    }
  }

  window.filterNewsArchive = function (query) {
    const data = window.PGG_SCRAPED_DATA;
    if (!data || !data.agenda_archive) return;
    const q = (query || '').toLowerCase().trim();
    const filtered = !q
      ? data.agenda_archive
      : data.agenda_archive.filter(
          (item) =>
            (item.title || '').toLowerCase().includes(q) ||
            (item.summary || '').toLowerCase().includes(q) ||
            (item.date || '').toLowerCase().includes(q)
        );
    renderArchiveRows(filtered);
  };

  function renderArchiveRows(list) {
    const tbody = document.getElementById('news-archive-tbody');
    if (!tbody) return;
    tbody.innerHTML = list
      .map(
        (item) => `
        <tr style="cursor:pointer;" onclick="openArticle('agenda', '${item.id}')">
          <td style="white-space:nowrap;color:var(--pkn-taupe);font-weight:700;">${escapeHtml(item.date)}</td>
          <td style="font-weight:700;color:var(--text-main);">${escapeHtml(item.title)}</td>
          <td style="color:var(--text-secondary);font-size:0.88rem;">${escapeHtml((item.summary || '').slice(0, 110))}…</td>
          <td><span class="badge badge-red">Lees &rarr;</span></td>
        </tr>
      `
      )
      .join('');
  }

  // Open full article modal
  window.openArticle = function (category, id) {
    const data = window.PGG_SCRAPED_DATA;
    if (!data) return;

    let art = null;
    let catLabel = 'Gemeentenieuws';
    if (category === 'agenda') {
      art = data.agenda_articles[id] || (data.agenda_archive || []).find((x) => x.id === String(id));
      catLabel = 'Gemeentenieuws & Agenda';
    } else if (category === 'verdieping') {
      art = data.verdieping_articles[id] || (data.verdieping_archive || []).find((x) => x.id === String(id));
      catLabel = 'Verdieping';
    } else if (category === 'kleinekerk') {
      art = data.kleinekerk_articles[id] || (data.kleinekerk_archive || []).find((x) => x.id === String(id));
      catLabel = 'De Kleine Kerk';
    }

    if (!art) return;

    const titleEl = document.getElementById('article-modal-title');
    const metaEl = document.getElementById('article-modal-meta');
    const bodyEl = document.getElementById('article-modal-body');

    titleEl.textContent = art.title || 'Artikel';
    metaEl.innerHTML = `<span class="badge badge-red">${catLabel}</span> &nbsp; <span>${escapeHtml(art.date || '')}</span>`;

    const img = art.local_image || art.image;
    const htmlContent = art.html || `<p>${escapeHtml(art.summary || '')}</p>`;

    bodyEl.innerHTML = `
      ${img ? `<img src="${img}" alt="${escapeHtml(art.title)}" style="max-height:340px;width:auto;max-width:100%;border-radius:12px;margin-bottom:1.5rem;box-shadow:var(--shadow-sm);" onerror="this.style.display='none'" />` : ''}
      <div style="font-size:1.03rem;line-height:1.75;color:var(--text-main);">
        ${htmlContent}
      </div>
    `;

    openModal('article-modal');
  };

  // Open Photo Album Modal & Lightbox
  let currentAlbum = null;
  let currentPhotoIdx = 0;

  window.openAlbum = function (albumIdx) {
    const data = window.PGG_SCRAPED_DATA;
    if (!data || !data.photo_albums || !data.photo_albums[albumIdx]) return;

    currentAlbum = data.photo_albums[albumIdx];
    currentPhotoIdx = 0;

    const titleEl = document.getElementById('album-modal-title');
    const metaEl = document.getElementById('album-modal-meta');
    const bodyEl = document.getElementById('album-modal-body');

    titleEl.textContent = currentAlbum.title;
    metaEl.innerHTML = `<span class="badge badge-orange">${currentAlbum.count} foto's in dit album</span>`;

    renderAlbumView(bodyEl);
    openModal('album-modal');
  };

  function renderAlbumView(container) {
    if (!currentAlbum) return;
    const photos = currentAlbum.photos || [];
    const activePhoto = photos[currentPhotoIdx];

    container.innerHTML = `
      ${
        activePhoto
          ? `
        <div style="background:#181514;border-radius:12px;padding:1rem;text-align:center;margin-bottom:1.5rem;position:relative;">
          <img id="album-main-photo" src="${activePhoto.full}" alt="Foto ${currentPhotoIdx + 1}" style="max-height:460px;margin:0 auto;border-radius:8px;" onerror="this.src='${activePhoto.thumb}'" />
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.85rem;color:#fff;">
            <button class="btn btn-outline-light" style="padding:0.4rem 1rem;font-size:0.85rem;" onclick="stepAlbumPhoto(-1)">&larr; Vorige</button>
            <span style="font-size:0.9rem;font-weight:700;">Foto ${currentPhotoIdx + 1} van ${photos.length}</span>
            <button class="btn btn-outline-light" style="padding:0.4rem 1rem;font-size:0.85rem;" onclick="stepAlbumPhoto(1)">Volgende &rarr;</button>
          </div>
        </div>
      `
          : ''
      }
      <h4 style="margin-bottom:0.5rem;">Alle miniaturen in dit album (klik om te vergroten):</h4>
      <div class="album-photo-grid">
        ${photos
          .map(
            (p, idx) => `
          <div class="album-photo-item" style="${idx === currentPhotoIdx ? 'outline:3px solid var(--pkn-red);' : ''}" onclick="selectAlbumPhoto(${idx})">
            <img src="${p.thumb}" alt="Foto ${idx + 1}" loading="lazy" />
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  window.selectAlbumPhoto = function (idx) {
    if (!currentAlbum) return;
    currentPhotoIdx = idx;
    renderAlbumView(document.getElementById('album-modal-body'));
  };

  window.stepAlbumPhoto = function (delta) {
    if (!currentAlbum || !currentAlbum.photos.length) return;
    currentPhotoIdx = (currentPhotoIdx + delta + currentAlbum.photos.length) % currentAlbum.photos.length;
    renderAlbumView(document.getElementById('album-modal-body'));
  };

  // Global Search across all sections and scraped articles
  window.runGlobalSearch = function (query) {
    const resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;

    const q = (query || '').toLowerCase().trim();
    if (q.length < 2) {
      resultsContainer.innerHTML = `<p style="color:var(--text-muted);font-size:0.92rem;">Typ minimaal 2 letters om te zoeken in alle pagina's, diensten, nieuwsberichten en verdiepingsartikelen…</p>`;
      return;
    }

    const matches = [];

    // 1. Search DOM sections
    document.querySelectorAll('.view-section').forEach((sec) => {
      const secId = sec.id.replace('sec-', '');
      const titleEl = sec.querySelector('.section-title');
      const secTitle = titleEl ? titleEl.textContent : secId;
      const text = sec.textContent.replace(/\s+/g, ' ');
      const idx = text.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const snippet = text.slice(Math.max(0, idx - 50), idx + 110);
        matches.push({
          type: 'Pagina',
          title: secTitle,
          snippet: '…' + snippet + '…',
          action: () => navigateTo(secId)
        });
      }
    });

    // 2. Search scraped articles
    const data = window.PGG_SCRAPED_DATA;
    if (data) {
      (data.agenda_archive || []).forEach((art) => {
        if ((art.title || '').toLowerCase().includes(q) || (art.summary || '').toLowerCase().includes(q)) {
          matches.push({
            type: 'Nieuws (' + (art.date || '') + ')',
            title: art.title,
            snippet: art.summary || '',
            action: () => {
              closeModal('search-modal');
              openArticle('agenda', art.id);
            }
          });
        }
      });

      Object.entries(data.verdieping_articles || {}).forEach(([id, art]) => {
        const plain = (art.html || '').replace(/<[^>]+>/g, ' ');
        if ((art.title || '').toLowerCase().includes(q) || plain.toLowerCase().includes(q)) {
          matches.push({
            type: 'Verdieping (' + (art.date || '') + ')',
            title: art.title,
            snippet: plain.slice(0, 130) + '…',
            action: () => {
              closeModal('search-modal');
              openArticle('verdieping', id);
            }
          });
        }
      });
    }

    if (!matches.length) {
      resultsContainer.innerHTML = `<p style="color:var(--pkn-red);font-weight:600;">Geen resultaten gevonden voor "${escapeHtml(query)}".</p>`;
      return;
    }

    resultsContainer.innerHTML = matches
      .slice(0, 18)
      .map(
        (m, i) => `
        <div class="card" style="padding:1rem 1.25rem;margin-bottom:0.75rem;cursor:pointer;" data-search-idx="${i}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
            <span class="badge badge-red">${escapeHtml(m.type)}</span>
          </div>
          <h4 style="margin-bottom:0.25rem;">${escapeHtml(m.title)}</h4>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin:0;">${escapeHtml(m.snippet)}</p>
        </div>
      `
      )
      .join('');

    resultsContainer.querySelectorAll('[data-search-idx]').forEach((el) => {
      const idx = Number(el.dataset.searchIdx);
      el.addEventListener('click', () => matches[idx].action());
    });
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Intercept legacy internal links inside scraped HTML fragments
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (LEGACY_MAP[href]) {
      e.preventDefault();
      navigateTo(LEGACY_MAP[href]);
    } else if (href.includes('agendaartikel.php?ID=')) {
      e.preventDefault();
      const id = href.split('ID=')[1];
      openArticle('agenda', id);
    } else if (href.includes('verdiepingartikel.php?ID=')) {
      e.preventDefault();
      const id = href.split('ID=')[1];
      openArticle('verdieping', id);
    } else if (href.includes('dekleinekerkartikel.php?ID=')) {
      e.preventDefault();
      const id = href.split('ID=')[1];
      openArticle('kleinekerk', id);
    }
  });

  // Close modal when clicking backdrop or pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach((m) => closeModal(m.id));
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    initScrapedContent();
    const initialHash = (window.location.hash || '').replace('#', '');
    if (SECTIONS.includes(initialHash)) {
      navigateTo(initialHash);
    } else {
      navigateTo('welkom');
    }
  });
})();

