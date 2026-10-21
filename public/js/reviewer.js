import { items } from './catalog.js';
import { parameterIdentity } from './indicator-presets.js';
import { normalizeDraft, review, validateComparison, validateDraft } from './core.js';

const nameOf = id => items.find(item => item.id === id)?.name || id;
const fieldNames = {
  name: 'Nombre', asset: 'Activo', market: 'Mercado', product: 'Producto', style: 'Operativa',
  analysisTf: 'Marco de análisis', executionTf: 'Marco de ejecución', regime: 'Régimen',
  goal: 'Objetivo', mtf: 'Contexto superior revisado', entryRule: 'Entrada', exitRule: 'Invalidación y salida', notes: 'Notas del método',
};

// Percentage is the share of applicable heuristic rules without a conflict. Missing context has no score.
export function summarizeReview(draft) {
  const result = review(draft);
  const priority = { bad: 0, warn: 1, info: 2 };
  const notes = result.notes.map((note, index) => ({ ...note, index, ...explainNote(note), ...(note.short ? { short: note.short } : {}) }))
    .sort((a, b) => priority[a.level] - priority[b.level] || a.index - b.index);
  return {
    ...result,
    percent: result.coherence.score,
    notes,
    counts: {
      missing: notes.filter(n => n.level === 'bad').length,
      attention: notes.filter(n => n.level === 'warn').length,
      context: notes.filter(n => n.level === 'info').length,
    },
  };
}

function explainNote(note) {
  const missing = {
    'Identifica el activo concreto': ['Indica el símbolo y su bolsa o plataforma.', 'asset'],
    'Temporalidades pendientes': ['Elige el marco de análisis y el de ejecución.', 'analysisTf'],
    'Faltan parámetros comparables': ['Elige una configuración del desplegable para poder compararla.', null, 'parameter'],
    'Define el objetivo del setup': ['Elige el objetivo una sola vez para todo el setup.', 'goal'],
    'Define el régimen': ['Indica si observas tendencia, rango, ruptura u otro contexto.', 'regime'],
    'Falta la condición de entrada': ['Escribe qué debe ocurrir para entrar.', 'entry-rule'],
    'Falta la invalidación': ['Concreta cuándo deja de ser válida tu hipótesis.', 'exit-rule'],
    'Especifica el producto': ['Distingue una acción, un ETF, un fondo o un derivado.', 'product'],
  };
  if (missing[note.title]) {
    const [short, field, indicatorField] = missing[note.title];
    return { short, field, indicatorField, indicatorId: note.linked?.[0] };
  }
  if (note.title.startsWith('Revisa ') && note.title.includes(' + '))
    return { short: 'Comprueba si cumplen funciones distintas. Compara alternativas de una en una.' };
  const summaries = {
    'Los osciladores pueden permanecer en extremos': 'Un extremo de RSI o Estocástico no basta para anticipar un giro.',
    'Orden de temporalidades': 'Comprueba que el contexto y la ejecución están en el orden que pretendes.',
    'Seguidores de tendencia en un rango': 'Define cómo evitarás cruces repetidos dentro del lateral.',
    'Objetivo tendencial en un rango': 'Concreta qué cambio de estructura necesitas para buscar tendencia.',
    'Un fondo no cotizado no se ejecuta como una acción': 'Valor liquidativo y plazos de ejecución requieren un tratamiento diferente.',
    'Derivados fuera del cálculo lineal': 'El planificador no modela margen, liquidación ni financiación.',
    'Osciladores de rango muy próximos': 'Estocástico y Williams %R comparten gran parte de la información.',
    'Canales de volatilidad simultáneos': 'Aclara si buscas una compresión comparativa o repites el mismo filtro.',
    'Dos medias del mismo precio': 'Distingue el horizonte y la función de cada media.',
    'Muchas herramientas, más decisiones': 'Asigna una decisión a cada herramienta y revisa las funciones repetidas.',
    'Costes y ruido en marcos cortos': 'Contrasta spread, comisiones y deslizamiento en tu temporalidad.',
  };
  return { short: summaries[note.title] || note.body.split(/(?<=\.)\s/)[0] };
}

export function compareDrafts(original, revised) {
  validateDraft(original);
  validateDraft(revised);
  const a = normalizeDraft(original), b = normalizeDraft(revised);
  const changes = [];
  for (const [key, label] of Object.entries(fieldNames)) {
    const before = typeof a[key] === 'string' ? a[key].trim() : a[key];
    const after = typeof b[key] === 'string' ? b[key].trim() : b[key];
    if (before !== after) changes.push({ key, label, before: a[key], after: b[key] });
  }
  const added = b.indicators.filter(id => !a.indicators.includes(id));
  const removed = a.indicators.filter(id => !b.indicators.includes(id));
  if (added.length || removed.length) changes.push({
    key: 'indicators', label: 'Herramientas',
    before: a.indicators.map(nameOf).join(', '), after: b.indicators.map(nameOf).join(', '),
  });
  // Cached settings for deselected indicators do not count as method changes.
  for (const id of new Set([...a.indicators, ...b.indicators])) {
    for (const [key, label] of [['params', 'Parámetros'], ['purpose', 'Función']]) {
      const before = a.indicators.includes(id) ? (a.indicatorSettings[id]?.[key] || '').trim() : '';
      const after = b.indicators.includes(id) ? (b.indicatorSettings[id]?.[key] || '').trim() : '';
      const samePreset = key === 'params' && a.indicators.includes(id) && b.indicators.includes(id) && parameterIdentity(id, a.indicatorSettings[id]) === parameterIdentity(id, b.indicatorSettings[id]);
      if (before !== after && !samePreset) changes.push({ key: `${id}.${key}`, label: `${nameOf(id)} · ${label}`, before, after });
    }
  }
  return { changes, added, removed, methodChanges: changes.filter(c => c.key !== 'name') };
}

export function createRevisionContext(source, setups) {
  validateDraft(source);
  const rootId = source.comparison?.rootId || source.id;
  const family = setups.filter(s => s.id === rootId || s.comparison?.rootId === rootId);
  const version = Math.max(source.comparison?.version || 1, ...family.map(s => s.comparison?.version || 1)) + 1;
  return validateComparison({ rootId, sourceId: source.id, sourceUpdated: source.updated, version, baseline: normalizeDraft(source), reason: '' });
}

// Build an explicit experiment from a detected pair; never mutate the source.
export function createRemovalAlternative(source, setups, removeId, pairedWith) {
  const shared = review(source).coherence.shared;
  const pair = shared.find(p => (p.a === removeId && p.b === pairedWith) || (p.b === removeId && p.a === pairedWith));
  if (!pair) throw new Error('Ese par ya no tiene un aviso de redundancia. Revisa el setup de nuevo.');
  const comparison = createRevisionContext(source, setups);
  comparison.reason = `Comparar sin ${nameOf(removeId)} para estudiar su aportación frente a ${nameOf(pairedWith)}. Mantener objetivo, temporalidades, reglas y costes para contrastar el cambio.`;
  const draft = normalizeDraft(source);
  draft.indicators = draft.indicators.filter(id => id !== removeId);
  const root = setups.find(s => s.id === comparison.rootId);
  const suffix = ` · sin ${nameOf(removeId)}`;
  draft.name = (root?.name || source.name).slice(0,80 - suffix.length) + suffix;
  // Cached settings are retained so the user can re-add the same configuration.
  validateRevisionSave(draft, comparison);
  return { draft, comparison };
}

export function validateRevisionSave(draft, context) {
  validateComparison(context);
  const diff = compareDrafts(context.baseline, draft);
  if (!diff.methodChanges.length) throw new Error('Cambia al menos un apartado del método; renombrarlo no crea una alternativa.');
  if (!context.reason.trim()) throw new Error('Explica brevemente qué quieres contrastar con esta revisión.');
  return diff;
}
