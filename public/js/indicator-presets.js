// Values describe configurations, not their profitability. No preset is auto-selected.
const period = (id, periods, prefix, extra = {}) => periods.map(n => ({ id: `${id}-${n}`, label: `${n} velas`, params: `${prefix} ${n}`, values: { period: n, ...extra } }));
const tuple = (id, label, values) => ({ id, label, params: label, values });
export const indicatorPresets = {
  ema: period('ema', [5, 9, 12, 20, 21, 26, 50, 100, 200], 'EMA'),
  sma: period('sma', [10, 20, 50, 100, 200], 'SMA'),
  rsi: period('rsi', [7, 14, 21], 'RSI'),
  stoch: [[5,3,3],[14,3,3],[21,3,3]].map(([period,k,d]) => tuple(`stoch-${period}-${k}-${d}`, `${period} / ${k} / ${d}`, { period, k, d })),
  macd: [[8,17,9],[12,26,9],[5,35,5]].map(([fast,slow,signal]) => tuple(`macd-${fast}-${slow}-${signal}`, `${fast} / ${slow} / ${signal}`, { fast, slow, signal, period: slow })),
  adx: period('adx', [7,14,21], 'ADX'), atr: period('atr', [7,14,21], 'ATR'),
  bollinger: [[10,2],[20,2],[20,2.5],[50,2]].map(([period,deviations]) => tuple(`bollinger-${period}-${deviations}`, `${period} velas · ${deviations} desviaciones`, { period, deviations })),
  volume: [tuple('volume-traded', 'Volumen negociado', { volume: 'traded' }), tuple('volume-ticks', 'Volumen de ticks', { volume: 'ticks' })],
  cci: period('cci', [14,20,50], 'CCI'), williams: period('williams', [7,14,21], 'Williams %R'),
  obv: [tuple('obv-traded', 'Cierre y volumen negociado', { volume: 'traded' }), tuple('obv-ticks', 'Cierre y volumen de ticks', { volume: 'ticks' })],
  cmf: period('cmf', [10,20,21], 'CMF'),
  vwap: [tuple('vwap-session-hlc3', 'Sesión · precio típico (HLC3)', { anchor: 'session', price: 'hlc3' }), tuple('vwap-session-close', 'Sesión · cierre', { anchor: 'session', price: 'close' })],
  keltner: [[20,10,2],[20,20,2],[20,10,1.5]].map(([period,atr,multiplier]) => tuple(`keltner-${period}-${atr}-${multiplier}`, `EMA ${period} · ATR ${atr} × ${multiplier}`, { period, atr, multiplier })),
  sar: [[.01,.1],[.02,.2],[.03,.3]].map(([acceleration,max]) => tuple(`sar-${acceleration}-${max}`, `${acceleration} · máximo ${max}`, { acceleration, max })),
  roc: period('roc', [5,12,20], 'ROC'),
  ichimoku: [[9,26,52],[10,30,60]].map(([tenkan,kijun,span]) => tuple(`ichimoku-${tenkan}-${kijun}-${span}`, `${tenkan} / ${kijun} / ${span}`, { tenkan, kijun, span, period: kijun })),
};
export const presetFor = (id, key) => indicatorPresets[id]?.find(p => p.id === key);
export const parameterLabels = {
  ema: 'Periodo', sma: 'Periodo', rsi: 'Periodo', adx: 'Periodo', atr: 'Periodo',
  cci: 'Periodo', williams: 'Periodo', cmf: 'Periodo', roc: 'Periodo',
  stoch: 'Periodo / suavizado K / D', macd: 'Media rápida / lenta / señal',
  bollinger: 'Periodo y desviaciones', volume: 'Tipo de volumen', obv: 'Datos utilizados',
  vwap: 'Anclaje y precio', keltner: 'Media / ATR / multiplicador',
  sar: 'Aceleración y máximo', ichimoku: 'Tenkan / Kijun / Span B',
};

// Deliberately conservative migration: recognize entire, unambiguous expressions.
// Unknown prose is retained as custom text, never reduced to the first number found.
export function resolvePreset(id, cfg = {}) {
  if (cfg.preset !== undefined) return presetFor(id, cfg.preset) || null;
  const text = (cfg.params || '').trim().toLowerCase();
  if (!text) return null;
  const exact = indicatorPresets[id]?.find(p => p.params.toLowerCase() === text);
  if (exact) return exact;
  const periodIds = ['ema','sma','rsi','adx','atr','cci','williams','cmf','roc'];
  if (periodIds.includes(id)) {
    const alias = id === 'williams' ? '(?:williams(?: %r)?|%r)' : id;
    const match = text.match(new RegExp(`^(?:${alias}\\s+)?(\\d+)(?:\\s+(?:velas|cierres|periodos|períodos))?(?:,?\\s+cierre)?$`));
    if (match) return presetFor(id, `${id}-${Number(match[1])}`) || null;
  }
  if (['macd','stoch','ichimoku'].includes(id)) {
    const match = text.match(new RegExp(`^(?:${id}\\s+)?(\\d+)\\s*[,/]\\s*(\\d+)\\s*[,/]\\s*(\\d+)$`));
    if (match) return presetFor(id, `${id}-${Number(match[1])}-${Number(match[2])}-${Number(match[3])}`) || null;
  }
  return null;
}
export function selectPreset(id, key, previous = {}) {
  const preset = presetFor(id, key);
  if (!preset) throw new Error('Opción de indicador no válida.');
  // Retain old annotations for backups; they are not used to infer the global goal.
  return { ...previous, preset: preset.id, params: preset.params };
}
export function parameterIdentity(id, cfg = {}) {
  const p = resolvePreset(id, cfg);
  return p ? p.id : `custom:${(cfg.params || '').trim()}`;
}
