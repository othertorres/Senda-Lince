import { items, references } from "./catalog.js";
import { indicatorPresets, parameterLabels, resolvePreset, selectPreset } from "./indicator-presets.js";
import { glossary } from "./glossary.js";
import { summarizeReview, compareDrafts, createRevisionContext, createRemovalAlternative, validateRevisionSave } from "./reviewer.js";
import {
  Store,
  blankDraft,
  validateState,
  review,
  position,
  pnl,
  stats,
  roles,
  options,
  labels,
  timeframeOptions,
  normalizeDraft,
  productMarket,
  withStoreLock,
} from "./core.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const icons = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  sliders: "M4 7h16M4 17h16M8 4v6M16 14v6",
  book: "M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1",
  chart: "M3 3v18h18M6 16l4-5 4 2 6-8",
  settings:
    "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6",
  search: "M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[n] || icons.grid}"/></svg>`;
function hydrate(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((e) => (e.innerHTML = icon(e.dataset.icon)));
}
const fmt = (n, d = 2) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: d }).format(n);
const money = (n, c = store.state.currency) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 2,
  }).format(n);
const uid = () => crypto.randomUUID();
const day = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dateText = (s) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(s + "T12:00:00"));
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem() {
      throw new Error("Almacenamiento no disponible.");
    },
    setItem() {
      throw new Error("Almacenamiento no disponible.");
    },
  };
}
const store = new Store(storage);
const executionLabels = { real: "Real", simulated: "Simulada", legacy: "Sin clasificar (anterior)" };
let draft = normalizeDraft(store.state.draft),
  editingId = store.state.draftSetupId || null,
  draftComparison = structuredClone(store.state.draftComparison || store.state.setups.find(s => s.id === store.state.draftSetupId)?.comparison || null),
  comparisonOpen = false,
  page = "overview",
  filter = "Todos",
  libraryLimit = 60,
  timer,
  toastTimer,
  lastReview = null,
  lastRisk = null,
  modalAction = null,
  pendingWrites = 0,
  unsavedDraft = false,
  editorWrites = 0,
  editorControls = [];
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
function storageError(message) {
  $("#storage-error").hidden = false;
  $("#storage-error").textContent =
    message + " Puedes exportar una copia desde Ajustes.";
}
async function lockWrite(action) {
  pendingWrites++;
  try {
    return await withStoreLock(store, action, navigator.locks);
  } finally {
    pendingWrites--;
  }
}
async function commit(fn) {
  try {
    await lockWrite(() => {
      const next = structuredClone(store.state);
      fn(next);
      store.commit(next);
    });
    $("#storage-error").hidden = true;
    return true;
  } catch (e) {
    storageError(e.message);
    return false;
  }
}
async function commitEditor(fn) {
  if (editorWrites++ === 0) {
    editorControls = $$("#setup-form input,#setup-form select,#setup-form textarea,#revision-reason").map(el => [el, el.disabled]);
    editorControls.forEach(([el]) => el.disabled = true);
    $("#page-analyze").inert = true;
    $("#page-analyze").setAttribute("aria-busy", "true");
  }
  try { return await commit(fn); }
  finally {
    if (--editorWrites === 0) {
      editorControls.forEach(([el, disabled]) => { if (el.isConnected) el.disabled = disabled; });
      $("#page-analyze").inert = false;
      $("#page-analyze").removeAttribute("aria-busy");
    }
  }
}
async function saveDraft() {
  unsavedDraft = true;
  clearTimeout(timer);
  timer = null;
  const snapshot = structuredClone(draft), targetId = editingId, comparison = structuredClone(draftComparison);
  const ok = await commit((s) => {
    s.draft = snapshot;
    s.draftSetupId = targetId;
    s.draftComparison = comparison;
  });
  if (ok && JSON.stringify(snapshot) === JSON.stringify(draft) && targetId === editingId && JSON.stringify(comparison) === JSON.stringify(draftComparison)) unsavedDraft = false;
  $("#draft-status").textContent = ok
    ? "Borrador guardado en este navegador."
    : "Borrador sin guardar. Revisa el aviso de almacenamiento.";
  return ok;
}
function scheduleDraft() {
  unsavedDraft = true;
  clearTimeout(timer);
  $("#draft-status").textContent = "Guardando borrador…";
  timer = setTimeout(saveDraft, 500);
}
function navigate(name) {
  if (!["overview", "analyze", "learn", "journal", "settings"].includes(name))
    name = "overview";
  if (page === "analyze" && timer) saveDraft();
  page = name;
  $$(".page").forEach((e) => (e.hidden = e.id !== "page-" + name));
  $$("[data-page]").forEach((e) => {
    e.classList.toggle("active", e.dataset.page === name);
    if (e.dataset.page === name) e.setAttribute("aria-current", "page");
    else e.removeAttribute("aria-current");
  });
  $("#page-title").textContent = {
    overview: "Vista general",
    analyze: "Preparar setup",
    learn: "Biblioteca",
    journal: "Diario",
    settings: "Ajustes",
  }[name];
  history.replaceState(null, "", "#" + name);
  if (name === "overview") renderOverview();
  if (name === "learn") renderLibrary();
  if (name === "journal") renderJournal();
  if (name === "settings") renderSettings();
  window.scrollTo({ top: 0, behavior: "instant" });
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-new-setup]")) {
    newSetup();
    return;
  }
  const b = e.target.closest("[data-page],[data-go]");
  if (b) navigate(b.dataset.page || b.dataset.go);
});
window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
window.addEventListener("storage", (e) => {
  if (e.key === store.key || e.key === null) {
    clearTimeout(timer);
    timer = null;
    store.locked = true;
    storageError(
      "Los datos han cambiado en otra pestaña. Para evitar sobrescribirlos, exporta tu borrador y recarga.",
    );
  }
});
window.addEventListener("pagehide", () => {
  if (timer) saveDraft();
});
window.addEventListener("beforeunload", e => {
  if (timer) saveDraft();
  if (pendingWrites || unsavedDraft) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function metric(title, value, note = "", cls = "") {
  return `<div class="metric"><small>${title}</small><strong class="${cls}">${value}</strong><small>${note}</small></div>`;
}
function renderOverview() {
  const s = store.state,
    t = stats(s.trades, s.currency, "real");
  $("#overview-metrics").innerHTML =
    metric(
      "Setups en tu playbook",
      s.setups.length,
      "Métodos para seguir perfeccionando",
    ) +
    metric(
      "Operaciones abiertas",
      s.trades.filter((t) => t.status === "open" && t.executionType === "real").length,
      "Reales · registradas manualmente",
    ) +
    metric(
      "Resultado real cerrado · " + s.currency,
      t.count ? money(t.total) : "—",
      t.count
        ? `${t.count} ${t.count === 1 ? "operación cerrada" : "operaciones cerradas"}`
        : "Tu historial empieza con un registro",
      t.total < 0 ? "negative" : "positive",
    ) +
    metric(
      "Media por operación real",
      t.avgR === null ? "—" : fmt(t.avgR) + " R",
      "Resultado neto / riesgo inicial",
    );
  $("#saved-list").innerHTML = s.setups.length
    ? s.setups
        .slice()
        .reverse()
        .map(
          (x) =>
            `<article class="saved-card"><div class="row-between"><span class="eyebrow">${esc(x.market)} · ${esc(x.style)}</span><button class="icon-btn" data-delete-setup="${x.id}" aria-label="Eliminar ${esc(x.name)}">×</button></div><h3>${esc(x.name)}</h3><span class="tag">Versión ${x.comparison?.version || 1}</span><p>${esc(labels[x.regime])} · ${esc(labels[x.goal])}</p><div class="tags">${x.indicators.map((id) => `<span class="tag">${esc(items.find((y) => y.id === id).name)}</span>`).join("")}</div><div class="row-between"><small class="form-note">Actualizado ${dateText(x.updated.slice(0, 10))}</small><div class="saved-actions"><button class="text-btn" data-load-setup="${x.id}">${x.comparison ? "Abrir y comparar" : "Abrir setup"}</button><button class="text-btn" data-revise-setup="${x.id}">Crear revisión</button></div></div></article>`,
        )
        .join("")
    : `<div class="empty">${icon("sliders")}<h3>Tu primer setup empieza con una idea.</h3><p>Guarda tus reglas de entrada y salida para revisarlas siempre con el mismo criterio.</p><button class="btn secondary" data-new-setup>Crear mi primer setup →</button></div>`;
  $$("[data-revise-setup]").forEach(b => b.onclick = () => startRevision(b.dataset.reviseSetup));
  $$("[data-load-setup]").forEach(
    (b) => (b.onclick = () => loadSetup(b.dataset.loadSetup)),
  );
  $$("[data-delete-setup]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.deleteSetup;
        confirmModal(
          "Eliminar setup",
          "Se eliminará este setup. Las operaciones del diario conservarán su referencia.",
          async () => {
            if (
              !await commit((s) => {
                s.setups = s.setups.filter((x) => x.id !== id);
                if (s.draftSetupId === id) s.draftSetupId = null;
              })
            )
              throw new Error("No se pudo guardar el cambio.");
            if (editingId === id) editingId = null;
            renderOverview();
            toast("Setup eliminado.");
          },
          "Eliminar",
        );
      }),
  );
}
function populateForm() {
  for (const key of Object.keys(options)) {
    $("#" + key).innerHTML = options[key]
      .map((v) => `<option value="${v}">${labels[v] || v}</option>`)
      .join("");
    $("#" + key).value = draft[key] ?? "unspecified";
  }
  for (const key of ["analysisTf", "executionTf"]) {
    $("#" + key).innerHTML = timeframeOptions.map((v) =>
      `<option value="${v}">${labels[v] || v || "Seleccionar..."}</option>`).join("");
    $("#" + key).value = draft[key] || "";
  }
  $("#asset").value = draft.asset || "";
  $("#setup-name").value = draft.name;
  $("#entry-rule").value = draft.entryRule;
  $("#exit-rule").value = draft.exitRule;
  $("#setup-notes").value = draft.notes;
  $("#mtf").checked = draft.mtf;
  renderPicker();
  renderRevisionBanner();
}
function readDraft() {
  for (const key of Object.keys(options)) draft[key] = $("#" + key).value;
  draft.asset = $("#asset").value;
  draft.analysisTf = $("#analysisTf").value;
  draft.executionTf = $("#executionTf").value;
  draft.indicatorSettings ||= {};
  for (const el of $$('[data-indicator-parameter]')) {
    const id = el.dataset.indicatorParameter;
    if (el.value === 'custom') continue;
    const previous = draft.indicatorSettings[id] || {};
    // Opening or editing another field must not rewrite recognized legacy text.
    if (el.value && resolvePreset(id, previous)?.id === el.value) continue;
    if (el.value) draft.indicatorSettings[id] = selectPreset(id, el.value, previous);
    else { const { preset, ...annotation } = previous; draft.indicatorSettings[id] = { ...annotation, params: '' }; }
  }
  draft.name = $("#setup-name").value;
  draft.entryRule = $("#entry-rule").value;
  draft.exitRule = $("#exit-rule").value;
  draft.notes = $("#setup-notes").value;
  draft.mtf = $("#mtf").checked;
}
function invalidateReview() {
  lastReview = null;
  $("#analysis-result").innerHTML = `<div class="review-stale"><span class="pill">DATOS MODIFICADOS</span><h3>Actualiza tu revisión</h3><p>Los avisos anteriores ya no corresponden al borrador.</p><button type="button" class="btn secondary" id="review-again">Revisar cambios</button></div>`;
  $("#review-again").onclick = () => $("#setup-form").requestSubmit();
  renderComparison();
}
function renderIndicatorSettings() {
  const settings = draft.indicatorSettings || {};
  $("#indicator-settings").innerHTML = draft.indicators.length
    ? `<h3 class="form-subheading">Configura lo que utilizas</h3>` + draft.indicators.map((id) => {
      const x = items.find((i) => i.id === id);
      const c = settings[id] || {params:""};
      const selected = resolvePreset(id, c);
      const custom = !selected && Boolean(c.params);
      return `<div class="indicator-setting"><div class="indicator-setting-head"><b>${esc(x.name)}</b><button type="button" data-indicator-guide="${id}" class="text-btn">Ver ficha ↗</button></div>
        <label>${esc(parameterLabels[id])}
          <select data-indicator-parameter="${id}"><option value="">Seleccionar…</option>${custom ? `<option value="custom" selected>Personalizada anterior · ${esc(c.params)}</option>` : ''}${indicatorPresets[id].map(p => `<option value="${p.id}"${selected?.id === p.id ? ' selected' : ''}>${esc(p.label)}</option>`).join('')}</select>
        </label>
        ${custom ? '<p class="form-note">El valor anterior se conserva. Elige un preset para incluirlo en la comparación.</p>' : ''}
        ${c.purpose ? `<details class="legacy-annotation"><summary>Anotación anterior</summary><p>${esc(c.purpose)}</p></details>` : ''}</div>`;
    }).join("")
    : `<p class="form-note">Selecciona indicadores para elegir su configuración.</p>`;
  $$('[data-indicator-guide]').forEach((b) => b.onclick = () => openLesson(b.dataset.indicatorGuide));
}
function openLesson(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  if (unsavedDraft || timer) saveDraft();
  libraryLimit = 60;
  filter = "Todos";
  $$('[data-filter]').forEach((b) => {
    const active = b.dataset.filter === "Todos";
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  $("#search").value = item.name;
  navigate("learn");
  const card = document.getElementById("learn-" + id);
  const detail = document.getElementById("detail-" + id);
  if (detail) { detail.open = true; detail.querySelector("summary").focus({ preventScroll: true }); }
  card?.scrollIntoView({block:"start", behavior:"smooth"});
}
function renderPicker() {
  $("#picker").innerHTML = Object.entries(roles)
    .map(
      ([id, r]) =>
        `<button type="button" data-pick="${id}" class="${draft.indicators.includes(id) ? "selected" : ""}" aria-pressed="${draft.indicators.includes(id)}">${items.find((x) => x.id === id).name}<small>${r}</small></button>`,
    )
    .join("");
  $("#picker-count").textContent = `${draft.indicators.length} / 8`;
  renderIndicatorSettings();
  $$("[data-pick]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.pick;
        if (!draft.indicators.includes(id) && draft.indicators.length >= 8) { toast("Máximo 8 indicadores por setup. Elimina uno antes de añadir."); return; }
        draft.indicators = draft.indicators.includes(id)
          ? draft.indicators.filter((x) => x !== id)
          : [...draft.indicators, id];
        renderPicker();
        invalidateReview();
        scheduleDraft();
      }),
  );
}
$("#setup-form").addEventListener("input", (e) => {
  if (e.target.id === "product" && e.target.value !== "unspecified")
    $("#market").value = productMarket(e.target.value);
  if (e.target.id === "market" && $("#product").value !== "unspecified" && productMarket($("#product").value) !== e.target.value)
    $("#product").value = "unspecified";
  readDraft();
  invalidateReview();
  scheduleDraft();
});
$("#setup-form").addEventListener("change", () => {
  readDraft();
  invalidateReview();
  scheduleDraft();
});
$("#setup-form").onsubmit = async (e) => {
  e.preventDefault();
  readDraft();
  await saveDraft();
  renderReview();
  $("#analysis-result").focus();
};
function coverageRing(r) {
  const pending = r.percent === null;
  const accessible = pending ? 'role="img" aria-label="Coherencia pendiente: faltan datos"' : `role="meter" aria-label="Coherencia del setup" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.percent}" aria-valuetext="${r.coherence.passed} de ${r.coherence.total} criterios sin conflicto, ${r.percent} por ciento"`;
  return `<div class="coverage-ring" ${accessible} data-review-percent="${pending ? 'pending' : r.percent}"><svg viewBox="0 0 128 128" aria-hidden="true"><circle class="ring-track" cx="64" cy="64" r="53"/><circle class="ring-value" cx="64" cy="64" r="53" pathLength="100" stroke-dasharray="${pending ? 0 : r.percent} 100" transform="rotate(-90 64 64)"/></svg><strong aria-hidden="true">${pending ? '—' : r.percent + '<span>%</span>'}</strong></div>`;
}
function removalButtons(note) {
  const shortName = id => ({ema:'EMA',sma:'SMA',macd:'MACD',rsi:'RSI',atr:'ATR',obv:'OBV',cmf:'CMF'})[id] || items.find(x => x.id === id)?.name || id;
  return (note.alternatives || []).map(a => `<button type="button" class="text-btn compare-without" data-compare-without="${a.removeId}" data-paired-with="${a.pairedWith}">Comparar sin ${esc(shortName(a.removeId))}</button>`).join('');
}
function renderReview() {
  const r = summarizeReview(draft);
  lastReview = structuredClone(draft);
  const title = r.percent === null ? "Completa lo esencial" : r.coherence.score < 100 ? "Hay puntos que contrastar" : "Sin conflictos en estas reglas";
  const shortNote = n => `<article class="review-insight ${n.level}"><div><span class="insight-dot" aria-hidden="true"></span><h4>${esc(n.title)}</h4></div><p>${esc(n.short)}</p><div class="insight-actions">${removalButtons(n)}${n.field || n.indicatorField ? `<button type="button" class="text-btn" data-review-focus="${n.index}">Completar</button>` : ""}<button type="button" class="text-btn" data-explain-note="${n.index}">Por qué</button></div></article>`;
  $("#analysis-result").innerHTML = `
    <div class="review-hero">${coverageRing(r)}<div><p class="eyebrow">COHERENCIA DEL SETUP</p><h3 class="status-title">${title}</h3><p class="review-count">${r.percent === null ? "REVISIÓN PENDIENTE" : `${r.coherence.passed} DE ${r.coherence.total} CRITERIOS SIN CONFLICTO`}</p></div></div>
    <p class="review-scope">${r.percent === null ? "Falta: " + esc(r.coherence.missing.join(", ")) + ". " : ""}Reglas orientativas de coherencia; no estima rentabilidad.</p>
    <div class="review-counters" aria-label="Resumen de avisos"><div><strong>${r.counts.missing}</strong><span>Pendientes</span></div><div><strong>${r.counts.attention}</strong><span>A contrastar</span></div><div><strong>${r.counts.context}</strong><span>De contexto</span></div></div>
    <div class="review-highlights">${r.notes.slice(0, 3).map(shortNote).join("") || '<p class="form-note">Sin avisos en estas reglas. Contrasta el método con datos antes de usarlo.</p>'}</div>
    ${r.notes.some(n=>n.alternatives?.length) ? '<p class="form-note">«Comparar sin…» conserva el setup actual como original y abre una alternativa.</p>' : ""}
    <div class="review-save-actions"><button id="save-setup" class="btn primary full">${editingId ? "Actualizar setup" : draftComparison ? "Guardar nueva versión" : "Guardar setup"}</button>${editingId ? '<button type="button" id="create-revision" class="btn secondary full">Crear revisión</button>' : ""}</div><p id="revision-save-hint" class="form-note" role="status"></p>
    <details id="review-criteria" class="review-detail"><summary>Cómo se calcula la coherencia</summary><p class="form-note">Criterios sin conflicto / criterios aplicables × 100, redondeado. Todos pesan igual; «No aplica» no cuenta. Con datos pendientes no se calcula el porcentaje.</p>${r.coherence.criteria.map(c => `<article class="criterion" data-criterion="${c.id}" data-status="${c.status}"><b>${esc(c.label)}</b><span>${({pass:'✓ Sin conflicto',warn:'! A contrastar',unknown:'· Pendiente',na:'No aplica'})[c.status]}</span><p>${esc(c.reason)}</p>${c.suggestion && c.status === 'warn' ? `<p>${esc(c.suggestion)}</p>` : ''}</article>`).join('')}</details>
    <details id="review-checks" class="review-detail"><summary>Ver los ${r.checks.length} campos</summary><ul class="checklist">${r.checks.map(([name, ok]) => `<li class="${ok ? "" : "pending"}"><b aria-hidden="true">${ok ? "✓" : "·"}</b>${name}<span class="sr-only">${ok ? ": documentado" : ": pendiente"}</span></li>`).join("")}</ul></details>
    <details id="review-notes" class="review-detail"><summary>Todos los avisos (${r.notes.length})</summary>${r.notes.map(n => `<article id="review-note-${n.index}" class="notice ${n.level}" tabindex="-1"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><div class="insight-actions">${removalButtons(n)}</div>${(n.linked || []).map(id => `<button type="button" data-lesson="${id}" class="text-btn">Consultar ${esc(items.find(x => x.id === id)?.name || id)}</button>`).join(" ")}</article>`).join("") || '<p class="form-note">No hay avisos aplicables a estas reglas.</p>'}</details>`;
  $$("[data-lesson]").forEach(b => b.onclick = () => openLesson(b.dataset.lesson));
  $$("[data-explain-note]").forEach(b => b.onclick = () => {
    $("#review-notes").open = true;
    $("#review-note-" + b.dataset.explainNote).focus();
  });
  $$("[data-review-focus]").forEach(b => b.onclick = () => {
    const note = r.notes.find(n => n.index === Number(b.dataset.reviewFocus));
    const el = note.field ? $("#" + note.field) : $(`[data-indicator-${note.indicatorField}="${note.indicatorId}"]`);
    el?.focus();
  });
  $$('[data-compare-without]').forEach(b => b.onclick = () => compareWithout(b.dataset.compareWithout, b.dataset.pairedWith));
  if ($("#create-revision")) $("#create-revision").onclick = () => startRevision(editingId);
  $("#save-setup").onclick = saveReviewedSetup;
  updateRevisionSaveState();
  renderComparison();
}
function updateRevisionSaveState() {
  const button = $("#save-setup"), hint = $("#revision-save-hint");
  if (!button || !hint) return;
  let issue = "";
  if (draftComparison) {
    try { validateRevisionSave(draft, draftComparison); } catch (error) { issue = error.message; }
  }
  button.disabled = Boolean(issue);
  hint.textContent = issue || (draftComparison ? "El original se conserva para comparar." : "También puedes guardar un borrador incompleto.");
}
async function saveReviewedSetup(e) {
  if (!lastReview) return;
  const comparison = structuredClone(draftComparison);
  try { if (comparison) validateRevisionSave(lastReview, comparison); } catch (error) { toast(error.message); return; }
  const now = new Date().toISOString(), existing = store.state.setups.find(x => x.id === editingId);
  const record = { ...lastReview, name: lastReview.name.trim(), id: existing?.id || uid(), created: existing?.created || now, updated: now };
  if (comparison) record.comparison = comparison;
  if (!record.name) { toast("Pon un nombre al setup antes de guardarlo."); $("#setup-name").focus(); return; }
  const button = e.currentTarget;
  button.disabled = true;
  if (await commitEditor(s => {
    if (existing) s.setups = s.setups.map(x => x.id === existing.id ? record : x);
    else s.setups.push(record);
    s.draft = structuredClone(draft);
    s.draftSetupId = record.id;
    s.draftComparison = comparison;
  })) {
    editingId = record.id;
    if (comparison) comparisonOpen = true;
    renderRevisionBanner();
    renderReview();
    if (page === "analyze") $("#save-setup").focus({ preventScroll: true });
    toast(existing ? "Setup actualizado." : comparison ? "Nueva versión guardada. Original conservado." : "Setup guardado.");
  } else if (button.isConnected) updateRevisionSaveState();
}
function renderRevisionBanner() {
  const banner = $("#revision-banner");
  banner.hidden = !draftComparison;
  if (!draftComparison) { comparisonOpen = false; $("#setup-comparison").hidden = true; return; }
  $("#revision-version").textContent = `VERSIÓN ${draftComparison.version}`;
  $("#revision-title").textContent = editingId ? "Revisión guardada" : "Prepara una alternativa";
  const source = store.state.setups.find(s => s.id === draftComparison.sourceId);
  $("#revision-origin").textContent = `Original: ${draftComparison.baseline.name}` + (!source ? " · Copia conservada para comparar" : source.updated !== draftComparison.sourceUpdated ? " · Comparas con la copia capturada al crear la revisión" : " · Se conserva sin cambios");
  $("#revision-reason").value = draftComparison.reason;
  renderComparison();
}
function comparisonValue(change, value) {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (!value) return "Sin definir";
  const text = ["market", "product", "style", "analysisTf", "executionTf", "regime", "goal"].includes(change.key) ? labels[value] || value : value;
  return text.length > 140 ? `<details class="comparison-long"><summary>${esc(text.slice(0, 85))}…</summary><p>${esc(text)}</p></details>` : esc(text);
}
function renderComparison() {
  $("#setup-comparison").hidden = !draftComparison || !comparisonOpen;
  if (!draftComparison || !comparisonOpen) return;
  const diff = compareDrafts(draftComparison.baseline, draft), original = summarizeReview(draftComparison.baseline), revised = summarizeReview(draft);
  $("#comparison-body").innerHTML = `<div class="comparison-summaries"><div><span class="eyebrow">ORIGINAL</span><h3>${esc(draftComparison.baseline.name)}</h3><strong>${original.percent === null ? "Pendiente" : original.percent + "%"} <small>coherencia</small></strong></div><div><span class="eyebrow">VERSIÓN ${draftComparison.version}${editingId ? "" : " · BORRADOR"}</span><h3>${esc(draft.name || "Sin nombre")}</h3><strong>${revised.percent === null ? "Pendiente" : revised.percent + "%"} <small>coherencia</small></strong></div></div>
    <p class="form-note">${lastReview ? "" : "Cambios pendientes de revisar. "}El porcentaje compara reglas de coherencia aplicables. No demuestra que una versión vaya a rendir mejor.</p>
    <p class="comparison-reason"><b>Qué quieres contrastar:</b> ${esc(draftComparison.reason.trim() || "Indica el motivo en la parte superior.")}</p>
    <h3>${diff.methodChanges.length} ${diff.methodChanges.length === 1 ? "cambio en el método" : "cambios en el método"}</h3>
    ${diff.changes.length ? `<div class="comparison-table-wrap"><table class="comparison-table"><caption class="sr-only">Diferencias entre el original conservado y la revisión actual</caption><thead><tr><th scope="col">Apartado</th><th scope="col">Original</th><th scope="col">Revisión</th></tr></thead><tbody>${diff.changes.map(c => `<tr><th scope="row">${esc(c.label)}</th><td>${comparisonValue(c, c.before)}</td><td>${comparisonValue(c, c.after)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="form-note">Todavía no has cambiado el método. Ajusta lo que quieras contrastar.</p>'}`;
}
function startRevision(id) {
  const source = store.state.setups.find(s => s.id === id);
  if (!source) return;
  const perform = async () => {
    clearTimeout(timer); timer = null;
    const comparison = createRevisionContext(source, store.state.setups);
    const nextDraft = normalizeDraft(source), suffix = ` · v${comparison.version}`;
    const root = store.state.setups.find(s => s.id === comparison.rootId);
    nextDraft.name = (root?.name || source.name).slice(0, 80 - suffix.length) + suffix;
    if (!await commitEditor(s => { s.draft = nextDraft; s.draftSetupId = null; s.draftComparison = comparison; })) throw new Error("No se pudo crear la revisión. Conservamos el borrador anterior.");
    draft = nextDraft; editingId = null; draftComparison = comparison; comparisonOpen = false; unsavedDraft = false;
    populateForm(); renderReview(); navigate("analyze"); $("#revision-reason").focus();
  };
  if (unsavedDraft || (draft.name && (editingId !== id || compareDrafts(source, draft).changes.length))) {
    confirmModal("Crear revisión", "Se usará el setup guardado. Se sustituirá el borrador actual y se conservará el original.", perform, "Crear revisión");
  } else perform().catch(error => storageError(error.message));
}
let preparingAlternative = false;
async function compareWithout(removeId, pairedWith) {
  if (!lastReview || preparingAlternative) return;
  preparingAlternative = true;
  clearTimeout(timer); timer = null;
  try {
    const snapshot = structuredClone(lastReview);
    const now = new Date().toISOString();
    let source = store.state.setups.find(s => s.id === editingId), preserved = null;
    if (!source || compareDrafts(source, snapshot).changes.length) {
      // An untouched pending revision can compare directly with its saved source.
      const capturedSource = draftComparison && store.state.setups.find(s => s.id === draftComparison.sourceId);
      if (!editingId && draftComparison && capturedSource &&
          !compareDrafts(draftComparison.baseline, snapshot).methodChanges.length &&
          !compareDrafts(capturedSource, snapshot).methodChanges.length) source = capturedSource;
      else {
        if (!snapshot.name.trim()) throw new Error('Pon un nombre al setup antes de comparar.');
        preserved = { ...snapshot, id: uid(), name: snapshot.name.trim(), created: now, updated: now };
        if (draftComparison && compareDrafts(draftComparison.baseline, snapshot).methodChanges.length) {
          const context = structuredClone(draftComparison);
          const family = store.state.setups.filter(s => s.id === context.rootId || s.comparison?.rootId === context.rootId);
          context.version = Math.max(context.version, ...family.map(s => (s.comparison?.version || 1) + 1));
          context.reason ||= 'Conservar la configuración actual antes de contrastar una herramienta del par.';
          validateRevisionSave(snapshot, context);
          preserved.comparison = context;
        }
        source = preserved;
      }
    }
    const family = preserved ? [...store.state.setups, preserved] : store.state.setups;
    const { draft: nextDraft, comparison } = createRemovalAlternative(source, family, removeId, pairedWith);
    if (!await commitEditor(s => {
      if (preserved) s.setups.push(preserved);
      s.draft = nextDraft; s.draftSetupId = null; s.draftComparison = comparison;
    })) return;
    draft = nextDraft; editingId = null; draftComparison = comparison;
    comparisonOpen = true; unsavedDraft = false;
    populateForm(); renderReview();
    $("#comparison-title").focus();
    toast('Alternativa preparada. Revisa las reglas si mencionan el indicador retirado.');
  } catch (error) { storageError(error.message); }
  finally { preparingAlternative = false; }
}
$("#revision-reason").oninput = e => {
  if (!draftComparison) return;
  draftComparison.reason = e.target.value;
  scheduleDraft(); updateRevisionSaveState(); renderComparison();
};
$("#show-comparison").onclick = () => { comparisonOpen = true; renderComparison(); $("#comparison-title").focus(); };
$("#hide-comparison").onclick = () => { comparisonOpen = false; renderComparison(); $("#show-comparison").focus(); };

function loadSetup(id) {
  const s = store.state.setups.find((x) => x.id === id);
  if (!s) return;
  const perform = async () => {
    clearTimeout(timer);
    timer = null;
    const nextDraft = normalizeDraft(s);
    if (!await commitEditor(state => {
      state.draft = nextDraft;
      state.draftSetupId = id;
      state.draftComparison = structuredClone(s.comparison || null);
    })) throw new Error("No se pudo abrir el setup. Conservamos tu borrador.");
    draft = nextDraft;
    unsavedDraft = false;
    editingId = id;
    draftComparison = structuredClone(s.comparison || null);
    comparisonOpen = Boolean(draftComparison);
    populateForm();
    renderReview();
    navigate("analyze");
  };
  if (draft.name || draft.entryRule || draft.indicators.length)
    confirmModal(
      "Abrir otro setup",
      "Se sustituirá el borrador de trabajo. Los setups ya guardados se conservarán.",
      perform,
      "Abrir",
    );
  else perform().catch(e => storageError(e.message));
}
function newSetup() {
  const perform = async () => {
    clearTimeout(timer);
    timer = null;
    const nextDraft = blankDraft();
    if (!await commitEditor(s => { s.draft = nextDraft; s.draftSetupId = null; s.draftComparison = null; }))
      throw new Error("No se pudo iniciar otro setup. Conservamos tu borrador.");
    draft = nextDraft;
    unsavedDraft = false;
    editingId = null;
    draftComparison = null;
    comparisonOpen = false;
    populateForm();
    invalidateReview();
    navigate("analyze");
  };
  if (editingId || JSON.stringify(draft) !== JSON.stringify(blankDraft())) confirmModal(
    "Empezar un nuevo setup",
    "Se vaciará el borrador actual. Los setups guardados se conservarán.",
    perform,
    "Empezar",
  );
  else perform().catch(e => storageError(e.message));
}
$("#new-setup").onclick = newSetup;
function schematicNew(id) {
  const path=(d,c="#4f46e5",w=2,dash="")=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
  const axis=path("M3 78H237", "#cbd5e1",1,"3 4");
  const c=(x,o,close,hi,lo)=>{
    const up=close<o,color=up?"#0e7490":"#b23957";
    return `<path d="M${x} ${hi}V${lo}" stroke="${color}" stroke-width="2"/><rect x="${x-10}" y="${Math.min(o,close)}" width="20" height="${Math.max(3,Math.abs(close-o))}" fill="${color}" rx="1"/>`;
  };
  const patterns={
    'inverse-hns':'M2 12 28 34 55 72 82 34 114 92 149 34 177 72 206 34 238 18',
    'double-top':'M2 88 30 61 63 15 92 69 125 17 154 72 192 86 238 94',
    'double-bottom':'M2 12 34 51 67 91 98 34 127 89 159 34 194 24 238 9',
    'triple-top':'M2 92 28 43 51 20 74 71 105 22 127 72 160 18 182 72 216 89 238 95',
    'triple-bottom':'M2 8 31 55 54 86 78 34 112 88 137 35 170 86 192 39 220 13 238 9',
    flag:'M4 91 67 12 88 35 116 28 144 43 172 37 198 51 235 17',
    pennant:'M4 90 66 10 91 25 124 42 151 39 177 45 204 39 238 18',
    rectangle:'M4 69 34 27 63 70 91 28 123 67 151 29 182 67 209 28 237 16',
    wedge:'M4 82 35 30 67 74 98 34 126 68 151 39 175 62 197 45 215 56 238 24',
    support:'M4 79 33 38 68 70 101 26 135 71 165 35 202 72 238 42',
  };
  if (patterns[id]) {
    let guide='';
    if(['double-top','triple-top'].includes(id))guide=path('M12 72H232','#0e7490',1.5,'5 4');
    if(['double-bottom','triple-bottom'].includes(id))guide=path('M12 35H232','#0e7490',1.5,'5 4');
    if(id==='inverse-hns')guide=path('M5 36H230','#0e7490',1.5,'5 4');
    if(id==='rectangle')guide=path('M1 25H239M1 72H239','#0e7490',1.5,'5 4');
    if(id==='support')guide=path('M1 74H239','#0e7490',2,'5 4');
    if(id==='flag')guide=path('M82 20 204 39 M82 43 204 62','#0e7490',1.5,'5 4');
    if(id==='pennant')guide=path('M85 23 215 43 M85 61 215 43','#0e7490',1.5,'5 4');
    if(id==='wedge')guide=path('M5 24 232 53 M5 87 232 53','#0e7490',1.5,'5 4');
    return axis+guide+path(patterns[id]);
  }
  if(['shooting','inverted-hammer','hanging-man','harami','morning-star','evening-star','marubozu'].includes(id)) {
    const bullish=[c(26,70,56,49,77),c(60,55,37,29,64)];
    const bearish=[c(26,31,47,25,56),c(60,46,65,41,72)];
    const candles={
      shooting:bullish.join('')+c(125,53,62,12,69),
      'inverted-hammer':bearish.join('')+c(125,67,74,21,83),
      'hanging-man':bullish.join('')+c(125,32,39,27,90),
      harami:c(79,23,77,18,82)+c(140,55,43,39,59),
      'morning-star':c(45,21,71,13,79)+c(115,79,76,69,87)+c(190,75,27,20,80),
      'evening-star':c(45,79,24,17,85)+c(115,20,24,16,33)+c(190,27,77,22,83),
      marubozu:c(120,85,12,12,85),
    };
    return axis+candles[id];
  }
  const oscillators=['cci','williams','roc','cmf'];
  if (oscillators.includes(id)) {
    return axis+path('M3 48H237','#94a3b8',1,'4 5')+
      path(id==='roc'?'M2 70 25 62 45 67 60 44 81 32 104 58 127 38 149 29 167 36 189 16 210 39 238 28':
        'M2 45 22 68 45 41 67 24 91 47 113 73 138 58 162 21 186 44 208 16 238 51');
  }
  if(['obv','vwap','sma','sar','keltner','ichimoku'].includes(id)){
    const price=path('M3 82 24 65 47 74 68 49 94 62 117 32 139 46 164 30 191 41 211 15 238 26');
    if(id==='obv')return axis+price+path('M3 90 25 78 50 84 74 68 98 72 121 49 149 40 172 44 201 21 238 14','#0e7490');
    if(id==='vwap')return axis+price+path('M2 79Q74 76 119 51T238 34','#0e7490',2.5);
    if(id==='sma')return axis+price+path('M2 86Q56 75 94 68T173 43 238 38','#0e7490',2.5);
    if(id==='sar')return axis+price+[15,38,63,86,112,138,164,190,215].map((x,i)=>`<circle cx="${x}" cy="${85-i*7}" r="3" fill="#0e7490"/>`).join('');
    if(id==='keltner')return axis+path('M2 51Q80 17 145 26T238 15','#6366f1')+path('M2 93Q80 66 145 67T238 55','#6366f1')+price;
    if(id==='ichimoku')return axis+`<path d="M2 55Q70 34 125 41T238 17L238 46Q170 70 125 62T2 83Z" fill="#c7d2fe" opacity=".8"/>`+price;
  }
  return null;
}

function diagram(id) {
  const base =
    '<path d="M0 25H240M0 50H240M0 75H240" stroke="#dbe3f0" stroke-width="1"/>';
  let shape = "";
  const line = (d, c = "#4f46e5", dash = "") =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="2" ${dash ? 'stroke-dasharray="' + dash + '"' : ""}/>`;
  if (["rsi", "stoch"].includes(id)) {
    shape =
      line("M0 24H240M0 76H240", "#64748b", "4 5") +
      line("M0 55Q15 5 30 40T60 65 90 25 120 52 150 68 180 35 210 45 240 54");
    if (id === "stoch")
      shape += line(
        "M0 60Q20 20 40 45T80 50 120 38 160 60 200 35 240 55",
        "#0e7490",
      );
  } else if (["doji", "hammer", "engulfing"].includes(id)) {
    shape =
      id === "doji"
        ? '<path d="M120 13v74M93 50h54" stroke="#4f46e5" stroke-width="4"/>'
        : id === "hammer"
          ? '<path d="M120 18v67" stroke="#4f46e5" stroke-width="3"/><rect x="109" y="23" width="22" height="21" rx="2" fill="#4f46e5"/>'
          : '<path d="M98 26v38M133 16v65" stroke="#64748b" stroke-width="2"/><rect x="90" y="32" width="16" height="24" fill="#b23957"/><rect x="125" y="23" width="16" height="37" fill="#4f46e5"/>';
  } else if (id === "triangle")
    shape =
      line("M12 20 208 55M12 87 208 55", "#64748b", "4 4") +
      line(
        "M12 80 35 29 63 75 93 37 122 67 151 46 180 60 202 53 222 27 238 34",
      );
  else if (id === "hns")
    shape =
      line("M0 78 25 65 50 36 78 66 115 9 153 68 180 37 210 68 240 87") +
      line("M17 66H235", "#0e7490", "4 4");
  else if (id === "volume")
    shape = Array.from({ length: 20 }, (_, i) => {
      const h = [
        13, 20, 16, 30, 25, 35, 23, 18, 34, 26, 22, 45, 62, 55, 33, 40, 29, 44,
        67, 78,
      ][i];
      return `<rect x="${i * 12}" y="${95 - h}" width="7" height="${h}" fill="${i % 4 ? "#4f46e5" : "#a5b4fc"}" rx="1"/>`;
    }).join("");
  else if (id === "bollinger")
    shape =
      line("M0 28Q50 0 110 29T240 12M0 80Q50 100 110 75T240 90", "#6366f1") +
      line(
        "M0 50 25 43 46 64 70 55 93 37 120 60 155 52 178 66 200 45 220 63 240 43",
      );
  else if (id === "macd")
    shape =
      Array.from({ length: 20 }, (_, i) => {
        const v = Math.sin(i / 3) * 27;
        return `<rect x="${i * 12}" y="${v > 0 ? 55 - v : 55}" width="7" height="${Math.abs(v)}" fill="${v > 0 ? "#a5b4fc" : "#e9a9ba"}"/>`;
      }).join("") +
      line("M0 47Q40 0 85 46T175 50 240 48") +
      line("M0 60Q50 15 95 47T185 60 240 40", "#0e7490");
  else if (id === "ema")
    shape =
      line(
        "M0 78 22 65 40 76 63 45 88 55 110 37 142 54 164 34 190 39 213 18 240 27",
      ) + line("M0 83Q65 68 118 52T240 29", "#0e7490");
  else
    shape = line(
      id === "atr"
        ? "M0 77 23 69 42 72 64 67 84 75 104 68 125 40 145 55 165 25 187 43 210 13 240 31"
        : "M0 75Q40 76 65 62T130 43 190 19 240 28",
    );
  const original = ["ema","macd","rsi","stoch","adx","atr","bollinger","volume","hns","triangle","doji","hammer","engulfing"].includes(id);
  if (!original) {
    const x = items.find((i) => i.id === id);
    const shape = schematicNew(id);
    if (shape) return `<svg viewBox="0 0 240 100" role="img" aria-label="Esquema conceptual de ${esc(x.name)}, no representa cotizaciones ni cálculos históricos">${base}${shape}</svg>`;
    return `<div class="concept-preview"><span>${esc(x.family)}</span><strong>ESQUEMA CONCEPTUAL</strong><small>Consulta el ejemplo de la ficha</small></div>`;
  }
  return `<svg viewBox="0 0 240 100" role="img" aria-label="Esquema ilustrativo de ${esc(items.find((x) => x.id === id).name)}, sin datos de mercado">${base}${shape}</svg>`;
}
function sourceLinks(x) {
  return x.sources.map((id) => {
    const r = references[id];
    if (!r) return "";
    return `<li><b>${esc(r.title)}</b><span class="source-note">${esc(r.note)}</span>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fuente externa: ${esc(r.title)}">Consultar fuente ↗</a>` : `<small>Referencia bibliográfica</small>`}</li>`;
  }).join("");
}
function learningCard(x, advanced) {
  const isFav = store.state.favorites.includes(x.id);
  return `<article class="learn-card" id="learn-${x.id}">
    <div class="learn-preview">${diagram(x.id)}<button class="star ${isFav ? "is-fav" : ""}" data-favorite="${x.id}" aria-label="Favorito: ${esc(x.name)}" aria-pressed="${isFav}">${isFav ? "★" : "☆"}</button></div>
    <div class="learn-body"><span class="eyebrow">${esc(x.kind)} · ${esc(x.family)}</span><h3>${esc(x.name)}</h3><p>${esc(x.simple)}</p>
    ${advanced ? `<p><b>En profundidad:</b> ${esc(x.mechanics)}</p>` : ""}
    <details id="detail-${x.id}" class="lesson-details"><summary>Ver ficha completa <span class="lesson-count">Ejemplo · 3 pasos · Fuentes</span></summary>
      <div class="lesson-section lesson-lead"><h4>Qué es y cómo funciona</h4><p>${esc(x.mechanics)}</p></div>
      <div class="lesson-section"><h4>Cuándo puede ayudarte</h4><p>${esc(x.best)}</p><p><b>Parámetros habituales:</b> ${esc(x.parameters)}</p></div>
      <div class="lesson-section"><h4>Ejemplo educativo</h4><p>${esc(x.example)}</p><ol class="lesson-steps">${x.steps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>
      <div class="lesson-section lesson-caution"><h4>Cuando la lectura puede fallar</h4><p>${esc(x.trap)}</p><p><b>Error frecuente:</b> ${esc(x.avoid)}</p></div>
      <div class="lesson-section"><h4>Matices por mercado y temporalidad</h4><p>${esc(x.market)}</p><p><b>Qué confirmar:</b> ${esc(x.confirmation)}</p></div>
      <div class="lesson-section"><h4>Herramientas relacionadas</h4><div class="lesson-relations">${x.related.map((id) => `<button type="button" class="lesson-related" data-related="${id}">${esc(items.find((y) => y.id === id).name)} ↗</button>`).join("")}</div><p class="lesson-related-note">Comparar no significa que debas añadirlas al setup. Evita duplicar funciones: ${esc(x.overlap)}.</p></div>
      <div class="lesson-section"><h4>Fuentes y trazabilidad</h4><ul class="lesson-sources">${sourceLinks(x)}</ul><p class="lesson-disclaimer">Referencia conceptual y educativa. Los ejemplos son hipotéticos; ninguna fuente demuestra que una configuración sea rentable en tu mercado.</p></div>
      ${x.kind === "Indicador" ? `<button type="button" class="btn secondary lesson-use" data-use="${x.id}">Añadir a mi borrador →</button>` : ""}
    </details></div></article>`;
}
function renderLibrary() {
  const normalize=(v)=>String(v).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q=normalize($("#search").value).trim();
  const advanced=$("#learn-mode").value === "advanced";
  const a=items.filter((x)=>
    (filter === "Todos" || filter === x.kind || (filter === "Favoritos" && store.state.favorites.includes(x.id))) &&
    (!q || normalize([x.name,x.family,x.simple,x.advanced,x.best,x.example,x.mechanics,x.trap,x.market,...x.steps].join(" ")).includes(q))
  );
  const shown = a.slice(0, libraryLimit);
  $("#library-count").textContent = `${a.length} ${a.length === 1 ? "ficha" : "fichas"}${a.length>libraryLimit ? ` · Mostrando ${shown.length}` : ""} · Ejemplos hipotéticos y fuentes trazables`;
  $("#library-pagination").hidden = shown.length >= a.length;
  $("#library").innerHTML = a.length ? shown.map((x) => learningCard(x, advanced)).join("")
    : `<div class="empty">${icon("search")}<h3>No hay fichas para esta búsqueda.</h3><p>Prueba otro término o guarda alguna ficha como favorita.</p></div>`;
  $$('[data-favorite]').forEach((b)=>b.onclick=async()=>{
    const id=b.dataset.favorite;
    if(await commit((s)=>s.favorites=s.favorites.includes(id)?s.favorites.filter((x)=>x!==id):[...s.favorites,id])){
      renderLibrary();$(`[data-favorite="${id}"]`)?.focus();
    }
  });
  $$('[data-use]').forEach((b)=>b.onclick=()=>{
    if (!draft.indicators.includes(b.dataset.use)){
      if(draft.indicators.length>=8){toast("Máximo 8 indicadores por setup. Elimina uno antes de añadir.");return;}
      draft.indicators.push(b.dataset.use);
    }
    renderPicker();invalidateReview();saveDraft();toast("Herramienta añadida al borrador.");
  });
  $$('[data-related]').forEach((b)=>b.onclick=()=>openLesson(b.dataset.related));
}
$("#library-more").onclick = () => { libraryLimit += 40; renderLibrary(); };
$("#search").oninput = () => { libraryLimit = 60; renderLibrary(); };
$("#learn-mode").onchange = renderLibrary;
$$("[data-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      libraryLimit = 60;
      $$("[data-filter]").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", x === b);
      });
      renderLibrary();
    }),
);
function riskValues() {
  const f = new FormData($("#risk-form")),
    p = Object.fromEntries(f);
  for (const k of [
    "capital",
    "riskPct",
    "entry",
    "stop",
    "target",
    "costs",
    "step",
  ])
    p[k] = Number(p[k]);
  return p;
}
$("#risk-form").onsubmit = (e) => {
  e.preventDefault();
  try {
    const p = riskValues(),
      r = position(p);
    lastRisk = { p, r };
    $("#risk-result").innerHTML =
      `<span class="eyebrow">ESCENARIO · ${esc(p.currency)}</span><h2>Tamaño calculado</h2><div class="risk-big">${fmt(r.qty, 8)} <span class="muted">unidades</span></div><p class="muted">${esc(p.symbol)} · ${p.side === "long" ? "Largo" : "Corto simulado"} · incremento ${fmt(p.step, 6)}</p><div class="risk-metrics"><div><small>Riesgo previsto al stop</small><b>${money(r.risk, p.currency)}</b></div><div><small>Resultado neto al objetivo</small><b>${money(r.reward, p.currency)}</b></div><div><small>Beneficio / riesgo</small><b>${fmt(r.rr)} : 1</b></div><div><small>Exposición nominal</small><b>${money(r.notional, p.currency)}</b></div></div><div class="notice"><b>${r.capitalLimited ? "El capital limita el tamaño" : "El presupuesto de riesgo limita el tamaño"}</b><p>Presupuesto elegido: ${money(r.budget, p.currency)}. Costes estimados: ${money(p.costs, p.currency)}.</p></div>${r.reward <= 0 ? '<div class="notice bad"><b>Los costes absorben el beneficio objetivo</b><p>Este escenario no deja un resultado neto positivo en el objetivo.</p></div>' : ""}<p class="form-note">La pérdida real puede superar el cálculo por gaps o deslizamiento. Revisa comisiones, unidades y precios de ejecución.</p><button id="risk-to-journal" class="btn primary full">Registrar ejecución manual →</button><small class="form-note">Confirma fecha, unidades y precio real. Esto no envía una orden.</small>`;
    $("#risk-to-journal").onclick = () => openTrade(lastRisk);
  } catch (e) {
    lastRisk = null;
    $("#risk-result").innerHTML =
      `<div class="notice bad"><b>Revisa el escenario</b><p>${esc(e.message)}</p></div>`;
  }
};
$("#risk-form").addEventListener("input", () => {
  if (lastRisk) {
    lastRisk = null;
    $("#risk-result").innerHTML =
      '<div class="empty"><h3>El escenario ha cambiado.</h3><p>Vuelve a calcular para actualizar las unidades y el riesgo.</p></div>';
  }
});
function openModal(title, body, action, submit = "Guardar") {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = body;
  $("#modal-error").textContent = "";
  $("#modal-submit").textContent = submit;
  modalAction = action;
  $("#modal").showModal();
}
function closeModal(force = false) {
  if ($("#modal-submit").disabled && force !== true) return;
  $("#modal").close();
  modalAction = null;
}
$("#modal-close").onclick = closeModal;
$("#modal-cancel").onclick = closeModal;
$("#modal").addEventListener("cancel", e => {
  if ($("#modal-submit").disabled) e.preventDefault();
  else modalAction = null;
});
$("#modal-form").onsubmit = async (e) => {
  e.preventDefault();
  if ($("#modal-submit").disabled) return;
  $("#modal-submit").disabled = true;
  try {
    await modalAction?.(Object.fromEntries(new FormData($("#modal-form"))));
    closeModal(true);
  } catch (e) {
    $("#modal-error").textContent = e.message;
  } finally {
    $("#modal-submit").disabled = false;
  }
};
function confirmModal(title, body, action, label = "Confirmar") {
  openModal(title, `<p class="muted">${esc(body)}</p>`, action, label);
}
function field(name, title, value = "", type = "text", extra = "") {
  return `<label>${title}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function openTrade(seed = null, existing = null) {
  const p = existing || seed?.p || {},
    q = existing?.qty || seed?.r.qty || "",
    d = existing?.date || day();
  openModal(
    existing ? "Editar operación" : "Registrar operación",
    `<p class="muted">Elige si la ejecución es real o simulada. Las estadísticas se consultan por separado. No se importa desde un broker.</p><div class="form-grid">${field("symbol", "Activo / símbolo", p.symbol || "", "text", 'maxlength="32" required')}${field("date", "Fecha de entrada", d, "date", "required")}<label>Tipo de operación<select name="executionType">${Object.entries(executionLabels).filter(([key]) => key !== "legacy" || existing).map(([key, text]) => `<option value="${key}" ${(existing ? existing.executionType || "legacy" : "simulated") === key ? "selected" : ""}>${text}</option>`).join("")}</select></label><label>Dirección<select name="side"><option value="long" ${p.side === "long" ? "selected" : ""}>Largo</option><option value="short" ${p.side === "short" ? "selected" : ""}>Corto · lineal</option></select></label><label>Divisa<select name="currency">${["EUR", "USD", "GBP"].map((c) => `<option ${(p.currency || store.state.currency) === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>${field("entry", "Precio ejecutado", p.entry || "", "number", 'min="0.00000001" step="any" required')}${field("qty", "Unidades ejecutadas", q, "number", 'min="0.00000001" step="any" required')}${field("stop", "Stop inicial", p.stop || "", "number", 'min="0.00000001" step="any" required')}${field("target", "Objetivo inicial", p.target || "", "number", 'min="0.00000001" step="any" required')}${field("costs", "Costes estimados totales", p.costs ?? 0, "number", 'min="0" step="any" required')}${field("setupName", "Nombre del setup", existing?.setupName || draft.name, "text", 'maxlength="80"')}<label class="wide">Notas<textarea name="notes" maxlength="3000" rows="3">${esc(existing?.notes || "")}</textarea></label></div>`,
    async (f) => {
      const record = {
        ...(existing || {}),
        id: existing?.id || uid(),
        status: existing?.status || "open",
        executionType: f.executionType,
        symbol: f.symbol.trim(),
        date: f.date,
        side: f.side,
        currency: f.currency,
        entry: Number(f.entry),
        qty: Number(f.qty),
        stop: Number(f.stop),
        target: Number(f.target),
        costs: Number(f.costs),
        setupName: f.setupName.trim(),
        notes: f.notes,
      };
      record.initialRisk =
        Math.abs(record.entry - record.stop) * record.qty + record.costs;
      const next = structuredClone(store.state);
      if (existing)
        next.trades = next.trades.map((x) =>
          x.id === existing.id ? record : x,
        );
      else next.trades.push(record);
      validateState(next);
      if (!await commit((s) => {
        if (existing) s.trades = s.trades.map(x => x.id === existing.id ? record : x);
        else s.trades.push(record);
      }))
        throw new Error("No se ha podido guardar. Revisa el aviso.");
      renderJournal();
      toast("Operación guardada.");
    },
    "Guardar registro",
  );
}
$("#add-trade").onclick = () => openTrade();
function closeTrade(t) {
  openModal(
    t.status === "closed" ? "Editar cierre" : "Cerrar operación",
    `<p class="muted">${esc(t.symbol)} · ${fmt(t.qty, 8)} unidades. El resultado se calcula con el precio real de salida y los costes totales.</p><div class="form-grid">${field("exit", "Precio de salida", t.exit || "", "number", 'min="0.00000001" step="any" required')}${field("closedDate", "Fecha de cierre", t.closedDate || day(), "date", `min="${t.date}" required`)}${field("actualCosts", "Costes reales totales", t.actualCosts ?? t.costs, "number", 'min="0" step="any" required')}<label class="wide">Qué aprendí<textarea name="notes" maxlength="3000" rows="3">${esc(t.notes)}</textarea></label></div>`,
    async (f) => {
      const updated = {
          ...t,
          status: "closed",
          closedAt: t.closedAt || new Date().toISOString(),
          exit: Number(f.exit),
          closedDate: f.closedDate,
          actualCosts: Number(f.actualCosts),
          notes: f.notes,
        },
        next = structuredClone(store.state);
      next.trades = next.trades.map((x) => (x.id === t.id ? updated : x));
      validateState(next);
      if (!await commit((s) => (s.trades = s.trades.map(x => x.id === t.id ? updated : x))))
        throw new Error("No se ha podido guardar.");
      renderJournal();
      toast("Cierre guardado.");
    },
  );
}
function renderJournal() {
  const c = $("#journal-currency").value,
    s = stats(store.state.trades, c, $("#journal-mode").value);
  $("#journal-metrics").innerHTML =
    metric(
      "Resultado neto · " + c,
      s.count ? money(s.total, c) : "—",
      `${s.count} ${s.count === 1 ? "operación cerrada" : "operaciones cerradas"}`,
      s.total < 0 ? "negative" : "positive",
    ) +
    metric(
      "Operaciones ganadoras",
      s.winRate === null ? "—" : fmt(s.winRate * 100, 1) + " %",
      "Sobre todas las cerradas; incluye empates",
    ) +
    metric(
      "Factor de beneficio",
      s.profitFactor === null
        ? s.noLosses
          ? "Sin pérdidas"
          : "—"
        : fmt(s.profitFactor),
      "Ganancias netas / pérdidas netas",
    ) +
    metric(
      "Caída máxima · " + c,
      s.count ? money(s.drawdown, c) : "—",
      "Desde el máximo del resultado cerrado",
    );
  $("#curve-title").textContent = s.count
    ? `${s.count} ${s.count === 1 ? "cierre" : "cierres"} · ${s.avgR === null ? "—" : fmt(s.avgR) + " R de media"}`
    : "Tu primera operación dibujará el inicio.";
  $("#equity-curve").innerHTML = s.count
    ? curve(s.curve, c)
    : '<div class="empty"><p>Aún no hay resultados cerrados en esta divisa. No se muestran datos de ejemplo como si fueran tuyos.</p></div>';
  const a = store.state.trades
    .filter(
      (t) =>
        t.currency === c &&
        (t.executionType || "legacy") === $("#journal-mode").value &&
        ($("#journal-filter").value === "all" ||
          t.status === $("#journal-filter").value),
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  $("#trade-list").innerHTML = a.length
    ? a
        .map(
          (t) =>
            `<article class="trade-row"><div><h3>${esc(t.symbol)} <span class="tag">${executionLabels[t.executionType || "legacy"]}</span> <span class="tag">${t.side === "long" ? "Largo" : "Corto"}</span></h3><small>${dateText(t.date)} · ${t.status === "open" ? "Abierta" : "Cerrada"}</small><small>${esc(t.setupName || "Sin setup vinculado")}</small></div><div><small>Entrada ${fmt(t.entry, 8)} · ${fmt(t.qty, 8)} uds.</small><small>Riesgo inicial ${money(t.initialRisk, c)}</small>${t.status === "closed" ? `<small>Salida ${fmt(t.exit, 8)} · ${dateText(t.closedDate)}</small>` : ""}</div><div><strong class="${t.status === "closed" && pnl(t) < 0 ? "negative" : ""}">${t.status === "closed" ? money(pnl(t), c) : "Sin cierre"}</strong><small>${t.status === "closed" ? fmt(pnl(t) / t.initialRisk) + " R neto" : "Sin valoración en tiempo real"}</small></div><div class="button-row"><button class="text-btn" data-close-trade="${t.id}">${t.status === "closed" ? "Ver / editar cierre" : "Cerrar"}</button><button class="text-btn" data-edit-trade="${t.id}">Editar</button><button class="icon-btn" data-delete-trade="${t.id}" aria-label="Eliminar operación ${esc(t.symbol)}">×</button></div>${t.notes ? `<details class="wide"><summary>Notas de la operación</summary><p>${esc(t.notes).replace(/\n/g, "<br>")}</p></details>` : ""}</article>`,
        )
        .join("")
    : '<div class="empty"><h3>No hay operaciones con estos filtros.</h3><p>Registra tu primera operación o cambia la divisa y el estado.</p></div>';
  $$("[data-close-trade]").forEach(
    (b) =>
      (b.onclick = () =>
        closeTrade(
          store.state.trades.find((x) => x.id === b.dataset.closeTrade),
        )),
  );
  $$("[data-edit-trade]").forEach(
    (b) =>
      (b.onclick = () =>
        openTrade(
          null,
          store.state.trades.find((x) => x.id === b.dataset.editTrade),
        )),
  );
  $$("[data-delete-trade]").forEach(
    (b) =>
      (b.onclick = () =>
        confirmModal(
          "Eliminar operación",
          "Se eliminará el registro y sus resultados de las estadísticas.",
          async () => {
            if (
              !await commit(
                (s) =>
                  (s.trades = s.trades.filter(
                    (x) => x.id !== b.dataset.deleteTrade,
                  )),
              )
            )
              throw new Error("No se pudo guardar.");
            renderJournal();
            toast("Operación eliminada.");
          },
          "Eliminar",
        )),
  );
}
function curve(values, c) {
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values),
    span = max - min || 1,
    x = (i) => 52 + (i / (values.length - 1)) * 670,
    y = (v) => 135 - ((v - min) / span) * 105,
    path = values
      .map((v, i) => (i ? "L" : "M") + x(i).toFixed(2) + " " + y(v).toFixed(2))
      .join(" ");
  return `<svg class="curve-svg" viewBox="0 0 750 180" role="img" aria-label="Resultado cerrado acumulado. Inicio cero; final ${esc(money(values.at(-1), c))}; mínimo ${esc(money(min, c))}; máximo ${esc(money(max, c))}."><path d="M52 ${y(0)}H722" stroke="#94a3b8" stroke-dasharray="4 4"/><path d="${path}" stroke="#4f46e5" stroke-width="2.5" fill="none"/><text x="52" y="164" fill="#617188" font-size="11">Inicio</text><text x="722" y="164" text-anchor="end" fill="#617188" font-size="11">Último cierre</text><text x="52" y="17" fill="#617188" font-size="11">Máx. ${esc(money(max, c))} · Mín. ${esc(money(min, c))}</text>${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#4f46e5"><title>Cierre ${i}: ${esc(money(v, c))}</title></circle>`).join("")}</svg>`;
}
$("#journal-currency").onchange = renderJournal;
$("#journal-filter").onchange = renderJournal;
$("#journal-mode").onchange = renderJournal;
function download(name, text, type = "application/json") {
  const blob = new Blob([text], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function exportCopy() {
  readDraft();
  const out = { ...store.state, draft: structuredClone(draft) };
  download(`Senda-Lince-copia-${day()}.json`, JSON.stringify(out, null, 2));
  toast("Copia preparada para descargar.");
}
$("#export-json").onclick = exportCopy;
$("#export-raw").onclick = () => {
  try {
    const raw = storage.getItem(store.key);
    if (raw === null) {
      toast("No hay datos almacenados todavía.");
      return;
    }
    download(`Senda-Lince-original-${day()}.txt`, raw, "text/plain");
  } catch (e) {
    toast(e.message);
  }
};
function renderSettings() {
  $("#default-currency").value = store.state.currency;
  $("#data-summary").textContent =
    `${store.state.setups.length} setups · ${store.state.trades.length} operaciones · ${store.state.favorites.length} favoritos. Se conserva el estado anterior a la última escritura correcta.`;
}
$("#default-currency").onchange = async (e) => {
  const value = e.target.value;
  if (await commit((s) => (s.currency = value))) {
    $("#journal-currency").value = store.state.currency;
    toast("Divisa del resumen actualizada.");
  } else e.target.value = store.state.currency;
};
$("#import-json").onclick = () => $("#import-file").click();
$("#import-file").onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("La copia supera el máximo de 5 MB.");
    return;
  }
  try {
    const candidate = validateState(JSON.parse(await file.text()));
    confirmModal(
      "Importar copia",
      `La copia contiene ${candidate.setups.length} setups y ${candidate.trades.length} operaciones. Sustituirá los datos de este navegador. Se conservará el estado actual como guardado anterior.`,
      async () => {
        clearTimeout(timer);
        timer = null;
        await lockWrite(() => store.importBackup(structuredClone(candidate)));
        $("#storage-error").hidden = true;
        draft = normalizeDraft(store.state.draft);
        unsavedDraft = false;
        editingId = store.state.draftSetupId || null;
        draftComparison = structuredClone(store.state.draftComparison || null);
        comparisonOpen = false;
        populateForm();
        invalidateReview();
        $("#journal-currency").value = store.state.currency;
        renderSettings();
        toast("Copia importada correctamente.");
      },
      "Sustituir datos",
    );
  } catch (err) {
    toast("Copia rechazada: " + err.message);
  }
};
$("#restore-backup").onclick = () =>
  confirmModal(
    "Restaurar el guardado anterior",
    "Se recuperará el estado anterior a la última escritura. Descarga primero una copia si quieres conservar el estado actual.",
    async () => {
      clearTimeout(timer);
      timer = null;
      try {
        await lockWrite(() => store.recover());
        draft = normalizeDraft(store.state.draft);
        unsavedDraft = false;
        editingId = store.state.draftSetupId || null;
        draftComparison = structuredClone(store.state.draftComparison || null);
        comparisonOpen = false;
        populateForm();
        invalidateReview();
        $("#storage-error").hidden = true;
        $("#journal-currency").value = store.state.currency;
        renderSettings();
        toast("Guardado anterior restaurado.");
      } catch (e) {
        throw new Error("No se ha restaurado: " + e.message);
      }
    },
    "Restaurar",
  );
$("#csv-export").onclick = () => {
  const c = $("#journal-currency").value,
    a = store.state.trades.filter(
      (t) =>
        t.currency === c &&
        (t.executionType || "legacy") === $("#journal-mode").value &&
        ($("#journal-filter").value === "all" ||
          t.status === $("#journal-filter").value),
    );
  if (!a.length) {
    toast("No hay operaciones para exportar con estos filtros.");
    return;
  }
  const cell = (v) => {
      let s = String(v ?? "");
      if (/^[\s]*[=+@-]/.test(s) && typeof v !== "number") s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    },
    rows = [
      [
        "Activo",
        "Fecha entrada",
        "Dirección",
        "Divisa",
        "Estado",
        "Tipo de operación",
        "Unidades",
        "Entrada",
        "Stop",
        "Objetivo",
        "Costes estimados",
        "Riesgo inicial",
        "Salida",
        "Fecha cierre",
        "Costes reales",
        "Resultado neto",
        "R neto",
        "Setup",
        "Notas",
      ],
      ...a.map((t) => [
        t.symbol,
        t.date,
        t.side,
        t.currency,
        t.status,
        executionLabels[t.executionType || "legacy"],
        t.qty,
        t.entry,
        t.stop,
        t.target,
        t.costs,
        t.initialRisk,
        t.exit ?? "",
        t.closedDate ?? "",
        t.actualCosts ?? "",
        t.status === "closed" ? pnl(t) : "",
        t.status === "closed" ? pnl(t) / t.initialRisk : "",
        t.setupName,
        t.notes,
      ]),
    ];
  download(
    `Senda-Lince-diario-${$("#journal-mode").value}-${c}-${day()}.csv`,
    "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
};
$("#glossary").innerHTML = glossary.map(([term, definition]) => `<details><summary>${esc(term)}</summary><p>${esc(definition)}</p></details>`).join("");
hydrate();
populateForm();
$("#journal-currency").value = store.state.currency;
$('#risk-form [name="currency"]').value = store.state.currency;
$("#today").textContent = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
if (store.locked) storageError(store.error);
navigate(location.hash.slice(1) || "overview");
