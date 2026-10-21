import { items } from "./catalog.js";
import { presetFor, resolvePreset } from "./indicator-presets.js";
import { evaluateCoherence } from "./coherence.js";
export const VERSION = 3;
export const roles = Object.fromEntries(items.filter(x => x.kind === "Indicador").map(x => [x.id, x.reviewRole]));
export const options = {
  market: ["Acciones", "Índices", "Forex", "Crypto", "ETF", "Fondos"],
  product: ["unspecified", "eu-stocks", "us-stocks", "other-stocks", "crypto-spot", "crypto-derivative", "etf", "fund", "index", "forex"],
  style: ["Swing trading", "Day trading", "Scalping", "Posicional"],
  regime: ["unknown", "trend", "range", "breakout", "volatile"],
  goal: ["validate", "trend", "reversal", "breakout", "entry"],
};
export const labels = {
  unspecified: "Sin especificar",
  "eu-stocks": "Acciones europeas",
  "us-stocks": "Acciones estadounidenses",
  "other-stocks": "Otras acciones",
  "crypto-spot": "Cripto al contado",
  "crypto-derivative": "Derivados de cripto",
  etf: "ETF",
  fund: "Fondo de inversión no cotizado",
  index: "Índice (referencia)",
  forex: "Forex",
  "1m": "1 minuto", "5m": "5 minutos", "15m": "15 minutos", "30m": "30 minutos",
  "1h": "1 hora", "4h": "4 horas", "1d": "Diaria", "1w": "Semanal", "1M": "Mensual",
  "3m": "3 minutos", "1D": "Diaria", "1W": "Semanal",
  unknown: "Sin definir",
  trend: "Tendencia",
  range: "Lateral / rango",
  breakout: "Ruptura",
  volatile: "Alta volatilidad",
  validate: "Seleccionar objetivo…",
  reversal: "Reversión",
  entry: "Confirmar entrada",
};
export const legacyTimeframes = ["unspecified", "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"];
export const timeframeOptions = ["", "1m", "3m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"];
export const timeframeOrder = Object.fromEntries(timeframeOptions.slice(1).map((tf, i) => [tf, i]));
export const blankDraft = () => ({
  name: "",
  asset: "",
  analysisTf: "",
  executionTf: "",
  indicatorSettings: {},
  market: "Acciones",
  product: "unspecified",
  timeframe: "unspecified",
  style: "Swing trading",
  regime: "unknown",
  goal: "validate",
  indicators: [],
  mtf: false,
  entryRule: "",
  exitRule: "",
  notes: "",
});
export const blankState = () => ({
  version: VERSION,
  revision: 0,
  currency: "EUR",
  favorites: [],
  setups: [],
  trades: [],
  draft: blankDraft(),
  draftSetupId: null,
  draftComparison: null,
});
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
const finite = (v, min = 0, max = 1e12) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const string = (s, n) => typeof s === "string" && s.length <= n;
const date = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const stamp = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) &&
  Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;
const id = (s) => typeof s === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(s);
export function validateDraft(d) {
  assert(d && typeof d === "object", "Falta el contexto del setup.");
  for (const k of Object.keys(options)) {
    // Backups produced by v3/v4 have neither product nor timeframe.
    if (["product", "timeframe"].includes(k) && d[k] === undefined) continue;
    assert(options[k].includes(d[k]), "Contexto no válido: " + k);
  }
  assert(d.timeframe === undefined || legacyTimeframes.includes(d.timeframe), "Temporalidad heredada no válida.");
  if (d.product && d.product !== "unspecified")
    assert(productMarket(d.product) === d.market, "El producto y el mercado no coinciden.");
  assert(
    Array.isArray(d.indicators) &&
      d.indicators.length <= 8 &&
      new Set(d.indicators).size === d.indicators.length &&
      d.indicators.every((x) => Object.hasOwn(roles, x)),
    "Indicadores no válidos.",
  );
  // Campos añadidos opcionales para poder cargar/exportar copias antiguas sin destruirlas.
  for (const field of ["asset", "analysisTf", "executionTf"])
    assert(d[field] === undefined || typeof d[field] === "string", "Campo de contexto inválido: " + field);
  assert(d.asset === undefined || string(d.asset, 80), "Activo demasiado largo.");
  for (const key of ["analysisTf", "executionTf"])
    assert(d[key] === undefined || timeframeOptions.includes(d[key]), "Temporalidad no válida: " + key);
  if (d.indicatorSettings !== undefined) {
    assert(d.indicatorSettings && typeof d.indicatorSettings === "object" && !Array.isArray(d.indicatorSettings), "Configuración de indicadores inválida.");
    assert(Object.keys(d.indicatorSettings).length <= Object.keys(roles).length, "Demasiadas configuraciones de indicadores.");
    for (const [code, cfg] of Object.entries(d.indicatorSettings)) {
      assert(Object.hasOwn(roles, code), "Indicador desconocido en parámetros.");
      assert(cfg && typeof cfg === "object" && !Array.isArray(cfg)
        && string(cfg.params, 160) && (cfg.purpose === undefined || string(cfg.purpose, 240)), "Parámetros o anotación del indicador inválidos.");
      if (cfg.preset !== undefined) {
        const preset = presetFor(code, cfg.preset);
        assert(preset && cfg.params === preset.params, "Preset o parámetros del indicador no válidos.");
      }
    }
  }
  assert(
    string(d.name, 80) &&
      string(d.entryRule, 1000) &&
      string(d.exitRule, 1000) &&
      string(d.notes, 3000) &&
      typeof d.mtf === "boolean",
    "Texto o regla no válidos.",
  );
  return d;
}
export function validateState(s) {
  assert(
    s && typeof s === "object" && !Array.isArray(s) && s.version === VERSION,
    "Formato incompatible. Importa una copia compatible de Senda Lince / ChartPilot v3.",
  );
  assert(
    Number.isSafeInteger(s.revision) &&
      s.revision >= 0 &&
      ["EUR", "USD", "GBP"].includes(s.currency),
    "Configuración inválida.",
  );
  const all = items.map(x => x.id);
  assert(
    Array.isArray(s.favorites) &&
      s.favorites.length <= all.length &&
      new Set(s.favorites).size === s.favorites.length &&
      s.favorites.every((x) => all.includes(x)),
    "Favoritos inválidos.",
  );
  validateDraft(s.draft);
  for (const name of ["setups", "trades"])
    assert(
      Array.isArray(s[name]) &&
        s[name].length <= 2000 &&
        new Set(s[name].map((x) => x?.id)).size === s[name].length,
      "Registros inválidos o duplicados.",
    );
  for (const x of s.setups) {
    validateDraft(x);
    if (x.comparison != null) validateComparison(x.comparison);
    assert(
      id(x.id) &&
        stamp(x.created) &&
        stamp(x.updated) &&
        x.created <= x.updated && x.name.trim().length > 0,
      "Setup inválido.",
    );
  }
  assert(s.draftSetupId == null || (id(s.draftSetupId) && s.setups.some(x => x.id === s.draftSetupId)), "Referencia del borrador inválida.");
  if (s.draftComparison != null) validateComparison(s.draftComparison);
  for (const t of s.trades) {
    assert(t && (t.executionType === undefined || ["real", "simulated", "legacy"].includes(t.executionType)), "Tipo de operación inválido.");
    assert(
      id(t.id) &&
        string(t.symbol, 32) &&
        t.symbol.trim().length > 0 &&
        string(t.setupName, 80) &&
        string(t.notes, 3000) &&
        ["long", "short"].includes(t.side) &&
        ["open", "closed"].includes(t.status) &&
        ["EUR", "USD", "GBP"].includes(t.currency) &&
        date(t.date),
      "Operación inválida.",
    );
    assert(
      finite(t.entry, 1e-8) &&
        finite(t.stop, 1e-8) &&
        finite(t.target, 1e-8) &&
        finite(t.qty, 1e-8) &&
        finite(t.costs) &&
        finite(t.initialRisk, 1e-8),
      "Importes de operación inválidos.",
    );
    assert(
      t.side === "long"
        ? t.stop < t.entry && t.target > t.entry
        : t.stop > t.entry && t.target < t.entry,
      "Stop u objetivo incoherentes.",
    );
    const expected = Math.abs(t.entry - t.stop) * t.qty + t.costs;
    assert(
      finite(expected, 1e-8) &&
        finite(t.entry * t.qty, 1e-8) &&
        Math.abs(expected - t.initialRisk) <= Math.max(1e-7, expected * 1e-10),
      "Riesgo inicial incoherente.",
    );
    if (t.closedAt !== undefined)
      assert(stamp(t.closedAt), "Marca de cierre inválida.");
    if (t.status === "closed") {
      assert(
        finite(t.exit, 1e-8) &&
          finite(t.actualCosts) &&
          date(t.closedDate) &&
          t.closedDate >= t.date,
        "Cierre inválido.",
      );
      assert(finite(Math.abs(pnl(t)), 0), "Resultado fuera de rango.");
    }
  }
  return s;
}
export function validateComparison(c) {
  assert(c && typeof c === "object" && !Array.isArray(c), "Comparación inválida.");
  assert(id(c.rootId) && id(c.sourceId) && stamp(c.sourceUpdated), "Referencia de revisión inválida.");
  assert(Number.isSafeInteger(c.version) && c.version >= 2 && c.version <= 1000000, "Versión de revisión inválida.");
  assert(string(c.reason, 600), "Motivo de revisión inválido.");
  validateDraft(c.baseline);
  assert(c.baseline.name.trim().length > 0, "Falta el nombre del original.");
  return c;
}
export function review(d) {
  validateDraft(d);
  const ids = d.indicators,
    notes = [];
  const add = (level, title, body, linked = []) => notes.push({ level, title, body, linked });
  const contextTf = d.executionTf || d.timeframe;
  if (!d.product || d.product === "unspecified")
    add("info", "Especifica el producto", "El mercado por sí solo no distingue una acción, un ETF o un derivado. Elige el producto para contextualizar la revisión.");
  if (["1m", "3m", "5m"].includes(contextTf))
    add("warn", "Costes y ruido en marcos cortos", "Prueba el efecto del spread, las comisiones y el deslizamiento. Aumentar indicadores no elimina el ruido ni garantiza mejores entradas.");
  if (d.product === "fund")
    add("warn", "Un fondo no cotizado no se ejecuta como una acción", "El valor liquidativo, la hora de corte y los plazos de suscripción o reembolso condicionan la ejecución. Las señales intradía y los stops de esta calculadora no modelan ese funcionamiento.");
  if (d.product === "etf")
    add("info", "Comprueba la estructura del ETF", "Revisa su subyacente, liquidez, spread, divisa y horario. Si es inverso o apalancado, estudia el reajuste diario y cómo afecta al periodo de tenencia.");
  if (["eu-stocks", "us-stocks", "other-stocks"].includes(d.product))
    add("info", "Sesión y eventos del mercado", "Documenta la bolsa y la divisa del activo, el horario, resultados empresariales y posibles gaps. Un stop no garantiza ejecución al precio previsto.");
  if (d.product === "crypto-spot")
    add("info", "Mercado continuo y plataforma", "En cripto al contado identifica el par y la plataforma: liquidez, precios y volumen pueden variar. Define cuándo revisarás el riesgo en un mercado abierto las 24 horas.");
  if (d.product === "crypto-derivative")
    add("warn", "Derivados fuera del cálculo lineal", "Documenta multiplicador, margen, liquidación y financiación. El planificador no calcula esos elementos y no dimensiona este producto.");
  if (d.product === "index")
    add("info", "El índice es una referencia", "Identifica el vehículo que ejecutarás (ETF, futuro u otro). Sus costes, unidades y volumen difieren del índice; futuros y CFD quedan fuera del planificador.");
  if (d.regime === "trend" && ids.some(x => ["rsi", "stoch"].includes(x)))
    add("warn", "Los osciladores pueden permanecer en extremos", "En una tendencia, RSI o Estocástico pueden mantenerse en sobrecompra o sobreventa. No sustituyas una regla de salida por un umbral aislado; contrasta la estructura del precio.");
  const cfg = d.indicatorSettings || {};
  const asset = (d.asset || "").trim();
  const atf = d.analysisTf || "";
  const etf = d.executionTf || "";
  if (!asset) add("bad", "Identifica el activo concreto", "Especifica instrumento o símbolo, por ejemplo: AAPL (NASDAQ), EUR/USD spot o BTC/USDT (exchange). No basta con indicar el mercado.");
  if (!atf || !etf) add("bad", "Temporalidades pendientes", "Indica un marco de análisis y otro de ejecución; son parte del contexto y permiten interpretar las señales.");
  const missingParam = ids.filter(id => !resolvePreset(id, cfg[id]));
  if (missingParam.length) add("bad", "Faltan parámetros comparables", "Elige una configuración en " + missingParam.map(x => x.toUpperCase()).join(", ") + ". Los valores antiguos personalizados se conservan, pero no se interpretan como un preset.", missingParam);
  if (d.goal === "validate") add("bad", "Define el objetivo del setup", "Selecciona tendencia, reversión, ruptura o confirmar entrada. Este objetivo se aplica a todas las herramientas.");
  if (!ids.length)
    add(
      "warn",
      "Sin herramientas seleccionadas",
      "Elige las herramientas que utilizas para revisar sus funciones. El análisis de precio también puede ser tu método, pero esta revisión compara indicadores.",
    );
  if (d.regime === "unknown")
    add(
      "bad",
      "Define el régimen",
      "No se puede contrastar una herramienta con un contexto que todavía no has definido.",
      ["adx", "support"],
    );
  if (!d.entryRule.trim())
    add(
      "bad",
      "Falta la condición de entrada",
      "Escribe una condición observable; por ejemplo, un cierre confirmado sobre una resistencia.",
      ["support"],
    );
  if (!d.exitRule.trim())
    add(
      "bad",
      "Falta la invalidación",
      "Describe cuándo descartarás la hipótesis y cómo saldrás.",
      ["support", "atr"],
    );
  if (d.regime === "range" && ids.some((x) => ["ema", "sma", "macd", "sar", "ichimoku"].includes(x)))
    add(
      "warn",
      "Seguidores de tendencia en un rango",
      "Revisa cómo evitar cruces repetidos cuando el precio no mantiene una dirección.",
      ids.filter((id) => ["ema", "sma", "macd", "sar", "ichimoku"].includes(id)),
    );
  if (["Índices", "Crypto"].includes(d.market) && ids.some((id) => ["volume", "obv", "cmf", "vwap"].includes(id)))
    add(
      "info",
      "Identifica qué volumen observas",
      "Distingue el índice, futuro, ETF o plataforma concreta. Sus volúmenes no son intercambiables.",
      ids.filter((id) => ["volume", "obv", "cmf", "vwap"].includes(id)),
    );
  if (d.style === "Scalping" && ids.includes("macd"))
    add(
      "info",
      "Revisa el retraso del MACD",
      "Prueba sus parámetros en tu marco temporal e incluye costes y deslizamiento.",
      ["macd"],
    );
  if (!d.mtf)
    add(
      "info",
      "Marco temporal superior sin revisar",
      "Si tu método utiliza contexto superior, incorpora esa revisión. No es un requisito universal.",
    );
  const coherence = evaluateCoherence(d);
  notes.unshift(...coherence.notes);
  const checks = [
    ["Activo identificado", !!asset],
    ["Temporalidades definidas", !!atf && !!etf],
    ["Parámetros especificados", ids.length > 0 && !missingParam.length],
    ["Objetivo definido", d.goal !== "validate"],
    ["Régimen definido", d.regime !== "unknown"],
    ["Herramientas elegidas", ids.length > 0],
    ["Entrada descrita", !!d.entryRule.trim()],
    ["Invalidación descrita", !!d.exitRule.trim()],
  ];
  // La revisión coteja reglas documentadas, no valida estadísticamente los parámetros.
  return {
    notes,
    coherence,
    checks,
    complete: checks.filter((x) => x[1]).length,
    roles: [...new Set(ids.map((x) => roles[x]))],
    blocking: notes.some((x) => x.level === "bad"),
  };
}
export function normalizeDraft(d) {
  const normalized = Object.fromEntries(Object.entries(blankDraft()).map(([key, fallback]) => [key, structuredClone(d[key] ?? fallback)]));
  // v4.1 stored a single timeframe. Preserve it and carry it to execution only;
  // never invent the analysis timeframe, parameters or indicator purposes.
  if (d.executionTf === undefined && d.timeframe && d.timeframe !== "unspecified") {
    const tf = ({ "1d": "1D", "1w": "1W" })[d.timeframe] || d.timeframe;
    if (timeframeOptions.includes(tf)) normalized.executionTf = tf;
  }
  return normalized;
}
export function productMarket(product) {
  if (["crypto-spot", "crypto-derivative"].includes(product)) return "Crypto";
  if (product === "forex") return "Forex";
  if (product === "index") return "Índices";
  if (product === "etf") return "ETF";
  if (product === "fund") return "Fondos";
  return "Acciones";
}
export function position(p) {
  for (const k of ["capital", "riskPct", "entry", "stop", "target", "step"])
    assert(finite(p[k], 1e-8), "Introduce un valor positivo en " + k + ".");
  assert(finite(p.costs), "Los costes deben ser cero o positivos.");
  assert(p.riskPct <= 100, "El riesgo no puede superar el 100 %.");
  assert(["long", "short"].includes(p.side), "Dirección inválida.");
  assert(
    p.side === "long"
      ? p.stop < p.entry && p.target > p.entry
      : p.stop > p.entry && p.target < p.entry,
    "En largo: stop < entrada < objetivo. En corto: objetivo < entrada < stop.",
  );
  const budget = (p.capital * p.riskPct) / 100,
    distance = Math.abs(p.entry - p.stop);
  assert(
    p.costs < budget && p.costs < p.capital,
    "Los costes consumen el presupuesto disponible.",
  );
  const capQty = (p.capital - p.costs) / p.entry,
    riskQty = (budget - p.costs) / distance;
  let qty = Math.floor(Math.min(capQty, riskQty) / p.step) * p.step;
  qty = Number(qty.toFixed(8));
  if (
    qty * distance + p.costs > budget + 1e-8 ||
    qty * p.entry + p.costs > p.capital + 1e-8
  )
    qty = Number((qty - p.step).toFixed(8));
  assert(
    qty > 0,
    "El capital o riesgo disponible no permite una unidad con ese incremento.",
  );
  const risk = qty * distance + p.costs,
    reward = qty * Math.abs(p.target - p.entry) - p.costs,
    notional = qty * p.entry;
  assert(
    [qty, risk, reward, notional].every(Number.isFinite) &&
      Math.max(qty, risk, Math.abs(reward), notional) <= 1e12,
    "Importes demasiado grandes.",
  );
  return {
    qty,
    risk,
    reward,
    notional,
    rr: reward / risk,
    budget,
    capitalLimited: capQty < riskQty,
  };
}
// Use the decimal representation of inputs; do not round genuine small P&L to cents.
// Integer arithmetic avoids binary cancellation such as (0.4 - 0.3) * 10 - 1.
function decimal(value) {
  const [mantissa, exp = "0"] = String(value).toLowerCase().split("e");
  const places = (mantissa.split(".")[1] || "").length - Number(exp);
  return { n: BigInt(mantissa.replace(".", "")) * 10n ** BigInt(Math.max(0, -places)), scale: Math.max(0, places) };
}
function addDecimal(a, b) {
  const scale = Math.max(a.scale, b.scale);
  return { n: a.n * 10n ** BigInt(scale - a.scale) + b.n * 10n ** BigInt(scale - b.scale), scale };
}
const numberDecimal = a => Number(`${a.n}e-${a.scale}`);
const addMoney = (a, b) => numberDecimal(addDecimal(decimal(a), decimal(b)));
export function pnl(t) {
  const entry = decimal(t.entry), exit = decimal(t.exit), qty = decimal(t.qty);
  const distance = addDecimal(exit, { ...entry, n: -entry.n });
  const gross = { n: distance.n * qty.n * (t.side === "long" ? 1n : -1n), scale: distance.scale + qty.scale };
  const costs = decimal(t.actualCosts);
  return numberDecimal(addDecimal(gross, { ...costs, n: -costs.n }));
}
export function stats(trades, currency, executionType = "all") {
  const a = trades
    .filter((t) => t.status === "closed" && t.currency === currency && (executionType === "all" || (t.executionType || "legacy") === executionType))
    .sort(
      (a, b) =>
        a.closedDate.localeCompare(b.closedDate) ||
        ((a.closedAt || a.closedDate + "T00:00:00.000Z").localeCompare(b.closedAt || b.closedDate + "T00:00:00.000Z")) || a.id.localeCompare(b.id),
    );
  let total = 0,
    peak = 0,
    drawdown = 0,
    gains = 0,
    losses = 0,
    r = 0;
  const curve = [0];
  for (const t of a) {
    const x = pnl(t);
    total = addMoney(total, x);
    peak = Math.max(peak, total);
    drawdown = Math.max(drawdown, addMoney(peak, -total));
    if (x > 0) gains = addMoney(gains, x);
    else losses = addMoney(losses, -x);
    r += x / t.initialRisk;
    curve.push(total);
  }
  return {
    count: a.length,
    total,
    winRate: a.length ? a.filter((t) => pnl(t) > 0).length / a.length : null,
    profitFactor: losses ? gains / losses : null,
    noLosses: !losses && gains > 0,
    avgR: a.length ? r / a.length : null,
    drawdown,
    curve,
  };
}
// All browser writes, including import/recovery, must hold the same origin lock.
// A stale tab is rejected inside the lock rather than silently overwriting data.
export function withStoreLock(store, action, locks) {
  assert(locks && typeof locks.request === "function", "Este navegador no permite guardar con protección entre pestañas. Usa una versión actual de Chrome, Firefox o Safari en HTTPS. Puedes exportar tus datos.");
  return locks.request(store.key + ".write", { mode: "exclusive" }, action);
}
export class Store {
  constructor(storage, key = "chartpilot.v3") {
    this.storage = storage;
    this.key = key;
    this.raw = null;
    this.state = blankState();
    this.locked = false;
    this.error = "";
    try {
      this.raw = storage.getItem(key);
      if (this.raw !== null) this.state = validateState(JSON.parse(this.raw));
    } catch (e) {
      this.locked = true;
      this.error =
        "No se han podido leer los datos. No se sobrescribirán. " + e.message;
    }
  }
  commit(next) {
    assert(
      !this.locked,
      "Guardado bloqueado. Descarga tus datos y recarga o restaura una copia.",
    );
    validateState(next);
    assert(
      this.storage.getItem(this.key) === this.raw,
      "Hay cambios en otra pestaña. Exporta tu borrador y recarga antes de continuar.",
    );
    if (
      this.raw !== null &&
      JSON.stringify(next) === JSON.stringify(this.state)
    )
      return this.state;
    // Editor drafts and comparison snapshots must never share mutable objects
    // with the committed state; otherwise a later edit can look like a no-op.
    const value = structuredClone({ ...next, revision: this.state.revision + 1 }),
      raw = JSON.stringify(value);
    if (this.raw !== null)
      this.storage.setItem(this.key + ".previous", this.raw);
    this.storage.setItem(this.key, raw);
    this.raw = raw;
    this.state = value;
    return value;
  }
  importBackup(next) {
    validateState(next);
    assert(
      this.storage.getItem(this.key) === this.raw,
      "Los datos cambiaron en otra pestaña. Recarga antes de importar.",
    );
    if (!this.locked) return this.commit(next);
    const value = structuredClone({ ...next, revision: this.state.revision + 1 }),
      raw = JSON.stringify(value);
    if (this.raw !== null)
      this.storage.setItem(this.key + ".recovery", this.raw);
    this.storage.setItem(this.key, raw);
    this.raw = raw;
    this.state = value;
    this.locked = false;
    this.error = "";
    return value;
  }
  recover() {
    assert(
      this.storage.getItem(this.key) === this.raw,
      "Los datos cambiaron en otra pestaña. Recarga antes de restaurar.",
    );
    const raw = this.storage.getItem(this.key + ".previous");
    assert(raw !== null, "No hay copia anterior.");
    const s = validateState(JSON.parse(raw));
    if (this.raw !== null)
      this.storage.setItem(this.key + ".recovery", this.raw);
    this.storage.setItem(this.key, raw);
    this.raw = raw;
    this.state = s;
    this.locked = false;
    return s;
  }
}
