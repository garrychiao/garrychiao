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

function renderProjects(projects) {
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

    body.innerHTML = `
      <h4>${escapeHtml(p.title)}</h4>
      <p>${escapeHtml(p.summary)}</p>
      <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="actions">
        ${p.url ? `<a class="action" target="_blank" rel="noreferrer" href="${escapeHtml(p.url)}">Live</a>` : ''}
        ${p.repo ? `<a class="action" target="_blank" rel="noreferrer" href="${escapeHtml(p.repo)}">Repo</a>` : ''}
      </div>
    `;

    card.appendChild(img);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderResume(resume) {
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

  block.innerHTML = `
    <div class="block">
      <h4>Experience</h4>
      ${exp || '<div class="muted">(add items in resume.json)</div>'}
    </div>

    <div class="block">
      <h4>Skills</h4>
      <div class="tags">${skills || '<span class="muted">(add skills in resume.json)</span>'}</div>
    </div>

    <div class="block">
      <h4>Education</h4>
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

  try {
    const [projects, resume] = await Promise.all([
      fetchJson('./data/projects.json'),
      fetchJson('./data/resume.json'),
    ]);
    renderProjects(projects);
    renderResume(resume);
    renderContact(resume);
  } catch (err) {
    console.error(err);
    $('#projectGrid').innerHTML = `<div class="muted">Failed to load data. Check console.</div>`;
  }
})();
