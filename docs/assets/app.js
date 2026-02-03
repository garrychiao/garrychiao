const $ = (sel) => document.querySelector(sel);

const escapeHtml = (s) => String(s ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

function getLang() {
  // GitHub Pages base path: /<repo>/
  // We use /en/ for English, default zh-TW.
  const p = window.location.pathname;
  return p.includes('/en/') ? 'en' : 'zh-TW';
}

function applyI18nStrings(strings) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const parts = key.split('.');
    let val = strings;
    for (const k of parts) {
      val = val?.[k];
    }
    if (typeof val === 'string' && val.trim()) {
      el.textContent = val;
    }
  });
}

function renderProjects(projects, i18n) {
  const grid = $('#projectGrid');
  grid.innerHTML = '';

  projects.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = p.title ? `${p.title} screenshot` : 'Project screenshot';
    img.loading = 'lazy';
    img.src = p.screenshot || './assets/placeholder.svg';
    img.addEventListener('click', () => openLightbox(img.src, p.title || ''));

    const body = document.createElement('div');
    body.className = 'body';

    const labelLive = i18n?.project?.live || 'Live';
    const labelRepo = i18n?.project?.repo || 'Repo';

    body.innerHTML = `
      <h4>${escapeHtml(p.title)}</h4>
      <p>${escapeHtml(p.summary)}</p>
      <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="actions">
        ${p.url ? `<a class="action" target="_blank" rel="noreferrer" href="${escapeHtml(p.url)}">${escapeHtml(labelLive)}</a>` : ''}
        ${p.repo ? `<a class="action" target="_blank" rel="noreferrer" href="${escapeHtml(p.repo)}">${escapeHtml(labelRepo)}</a>` : ''}
      </div>
    `;

    card.appendChild(img);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderResume(resume, i18n) {
  const block = $('#resumeBlock');

  const exp = (resume.experience || []).map((e) => {
    const bullets = (e.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');
    return `
      <div class="block">
        <h4>${escapeHtml(e.role)} · <span class="muted">${escapeHtml(e.company)}</span></h4>
        <div class="muted small">${escapeHtml(e.period)}${e.location ? ` · ${escapeHtml(e.location)}` : ''}</div>
        ${bullets ? `<ul>${bullets}</ul>` : ''}
      </div>
    `;
  }).join('');

  const skills = (resume.skills || []).map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('');

  const edu = (resume.education || []).map((e) => `
    <div class="block">
      <h4>${escapeHtml(e.school)}</h4>
      <div class="muted small">${escapeHtml(e.degree)}${e.period ? ` · ${escapeHtml(e.period)}` : ''}</div>
    </div>
  `).join('');

  const labelExp = i18n?.resume?.experience || 'Experience';
  const labelSkills = i18n?.resume?.skills || 'Skills';
  const labelEdu = i18n?.resume?.education || 'Education';

  block.innerHTML = `
    <div class="block">
      <h4>${escapeHtml(labelExp)}</h4>
      ${exp || '<div class="muted">(add items in resume.json)</div>'}
    </div>

    <div class="block">
      <h4>${escapeHtml(labelSkills)}</h4>
      <div class="tags">${skills || '<span class="muted">(add skills in resume.json)</span>'}</div>
    </div>

    <div class="block">
      <h4>${escapeHtml(labelEdu)}</h4>
      ${edu || '<div class="muted">(add education in resume.json)</div>'}
    </div>
  `;
}

function renderContact(resume) {
  const block = $('#contactBlock');
  const links = resume.links || [];
  block.innerHTML = '';

  links.forEach((l) => {
    const a = document.createElement('a');
    a.className = 'pill';
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.innerHTML = `<strong>${escapeHtml(l.label)}</strong><span>${escapeHtml(l.url)}</span>`;
    block.appendChild(a);
  });
}

function openLightbox(src, caption) {
  const dlg = $('#lightbox');
  const img = $('#lightboxImg');
  const cap = $('#lightboxCaption');
  img.src = src;
  cap.textContent = caption;
  dlg.showModal();
}

function initLightbox() {
  const dlg = $('#lightbox');
  $('#lightboxClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    const rect = dlg.getBoundingClientRect();
    const inDialog = rect.top <= e.clientY && e.clientY <= rect.bottom && rect.left <= e.clientX && e.clientX <= rect.right;
    if (!inDialog) dlg.close();
  });
}

(async function main(){
  $('#year').textContent = String(new Date().getFullYear());
  initLightbox();

  const lang = getLang();

  try {
    const base = lang === 'en' ? '../data' : './data';
    const [i18n, projects, resume] = await Promise.all([
      fetchJson(`${base}/i18n.${lang}.json`),
      fetchJson(`${base}/projects.${lang}.json`),
      fetchJson(`${base}/resume.${lang}.json`),
    ]);

    applyI18nStrings(i18n);
    renderProjects(projects, i18n);
    renderResume(resume, i18n);
    renderContact(resume);
  } catch (err) {
    console.error(err);
    $('#projectGrid').innerHTML = `<div class="muted">Failed to load data. Check console.</div>`;
  }
})();
