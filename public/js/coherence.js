import { resolvePreset } from './indicator-presets.js';
const tfOrder = ['', '1m','3m','5m','15m','30m','1h','4h','1D','1W','1M'];
const intraday = ['1m','3m','5m','15m','30m','1h','4h'];
const volumeTools = ['volume','obv','cmf','vwap'];
const goalTools = {
  trend: ['ema','sma','macd','sar','ichimoku','vwap'],
  reversal: ['rsi','stoch','cci','williams','bollinger'],
  breakout: ['volume','obv','cmf','vwap','atr','bollinger','keltner'],
  entry: ['ema','sma','macd','rsi','stoch','cci','williams','roc','vwap','sar','ichimoku','bollinger','keltner'],
};
const names = {ema:'EMA',sma:'SMA',macd:'MACD',rsi:'RSI',stoch:'Estocástico',williams:'Williams %R',cci:'CCI',roc:'ROC',atr:'ATR',bollinger:'Bollinger',keltner:'Keltner',obv:'OBV',cmf:'CMF',volume:'Volumen',vwap:'VWAP'};
const configuredName = (id, profile) => {
  if (['ema','sma','rsi','atr','cci','williams'].includes(id)) return `${names[id]} ${profile.values.period}`;
  return `${names[id]} (${profile.label})`;
};
export function evaluateCoherence(d) {
  const ids = d.indicators || [], cfg = d.indicatorSettings || {};
  const profiles = Object.fromEntries(ids.map(id => [id, resolvePreset(id, cfg[id])]));
  const missing = [];
  if (!(d.asset || '').trim()) missing.push('Activo');
  if (!goalTools[d.goal]) missing.push('Objetivo');
  if (!d.analysisTf || !d.executionTf) missing.push('Temporalidades');
  if (d.regime === 'unknown') missing.push('Régimen');
  if (!ids.length) missing.push('Indicadores');
  if (ids.some(id => !profiles[id])) missing.push('Configuraciones comparables');
  if (!(d.entryRule || '').trim() || !(d.exitRule || '').trim()) missing.push('Entrada y salida');
  const criteria = [];
  const add = (id, label, status, reason, linked = [], suggestion = '') => criteria.push({id,label,status,reason,linked,suggestion});
  const goalKnown = Boolean(goalTools[d.goal]), regimeKnown = d.regime && d.regime !== 'unknown';
  const goalConflict = (d.goal === 'trend' && d.regime === 'range') || (d.goal === 'reversal' && d.regime === 'trend');
  add('goal-regime','Objetivo y régimen',!goalKnown || !regimeKnown ? 'unknown' : goalConflict ? 'warn' : 'pass', !goalKnown || !regimeKnown ? 'Elige objetivo y régimen para contrastarlos.' : goalConflict ? 'El objetivo plantea operar frente al régimen descrito. Necesitas una condición de cambio o confirmación explícita.' : 'No se detecta este conflicto entre el objetivo y el régimen indicados.', ['adx','support']);
  const tfKnown = Boolean(d.analysisTf && d.executionTf);
  const orderConflict = tfKnown && tfOrder.indexOf(d.analysisTf) < tfOrder.indexOf(d.executionTf);
  add('timeframe-order','Orden de temporalidades',!tfKnown ? 'unknown' : orderConflict ? 'warn' : 'pass', !tfKnown ? 'Elige ambos marcos temporales para comparar su orden.' : orderConflict ? 'El marco de análisis es menor que el de ejecución. Comprueba si están intercambiados.' : 'El marco de análisis es igual o superior al de ejecución.');
  const styleConflict = (d.style === 'Scalping' && ['1h','4h','1D','1W','1M'].includes(d.executionTf)) || (d.style === 'Day trading' && ['1D','1W','1M'].includes(d.executionTf)) || (d.style === 'Swing trading' && ['1m','3m','5m'].includes(d.executionTf)) || (d.style === 'Posicional' && ['1m','3m','5m','15m','30m','1h'].includes(d.executionTf));
  add('execution-style','Ejecución y operativa',!d.executionTf ? 'unknown' : styleConflict ? 'warn' : 'pass', !d.executionTf ? 'Elige el marco de ejecución para contrastarlo con la operativa.' : styleConflict ? `${d.style} y velas de ${d.executionTf} describen horizontes poco habituales entre sí. Es una regla orientativa, no una prohibición.` : 'No se activa el aviso de desajuste de ejecución para la operativa indicada.', [], styleConflict ? 'Conserva el marco alto como contexto si corresponde y contrasta un marco de ejecución acorde con la duración de tus operaciones.' : '');
  const coversGoal = goalKnown && ids.some(id => goalTools[d.goal].includes(id));
  const alternatives = d.goal === 'trend' ? ['ema','adx'] : d.goal === 'reversal' ? ['rsi','support'] : d.goal === 'breakout' ? ['volume','atr'] : ['ema','rsi'];
  add('goal-coverage','Herramientas y objetivo',!goalKnown || !ids.length ? 'unknown' : coversGoal ? 'pass' : 'warn', !goalKnown || !ids.length ? 'Elige objetivo e indicadores para revisar sus capacidades.' : coversGoal ? 'Hay al menos una herramienta con una capacidad conceptual relacionada con el objetivo. Esto no valida sus señales.' : 'Las herramientas elegidas cubren otras funciones. La entrada también puede basarse en precio; concreta cómo cubres el objetivo.', alternatives, coversGoal ? '' : `Estudia ${alternatives.map(id => names[id] || 'estructura de precio').join(' y ')} como alternativas para la función que falta, antes de añadir más herramientas.`);
  const shared = [];
  for (const [a,b] of [['ema','sma'],['ema','macd'],['sma','macd'],['rsi','stoch'],['rsi','williams'],['stoch','williams'],['rsi','cci'],['cci','williams'],['atr','keltner'],['atr','bollinger'],['bollinger','keltner'],['obv','cmf']]) {
    if (!ids.includes(a) || !ids.includes(b) || !profiles[a] || !profiles[b]) continue;
    const x=profiles[a].values, y=profiles[b].values;
    let overlap;
    if (b === 'macd') overlap = Math.min(...[y.fast,y.slow].map(n => Math.max(x.period,n)/Math.min(x.period,n))) <= 1.5;
    else if (a === 'obv') overlap = true;
    else { const left = x.period, right = b === 'keltner' && a === 'atr' ? y.atr : y.period; overlap = Boolean(left && right && Math.max(left,right)/Math.min(left,right) <= 1.5); }
    if (overlap) shared.push({a,b,
      title: `${configuredName(a,profiles[a])} + ${configuredName(b,profiles[b])}`,
      text: `${configuredName(a,profiles[a])} y ${configuredName(b,profiles[b])} aportan información parecida.`,
      reason: a === 'obv' ? 'Ambos dependen del volumen del proveedor, aunque OBV y CMF lo calculan de forma diferente.'
        : ['atr','bollinger'].includes(a) ? 'Sus cálculos son distintos, pero sus lecturas de volatilidad utilizan horizontes próximos.'
        : ['ema','sma'].includes(a) ? 'Ambos derivan del mismo precio y tienen al menos un horizonte próximo; no son confirmaciones independientes.'
        : 'Ambos describen momentum o posición en el rango con horizontes próximos; sus cálculos son distintos.',
    });
  }
  add('overlap','Redundancia de información', ids.length < 2 ? 'na' : ids.some(id => !profiles[id]) ? 'unknown' : shared.length ? 'warn' : 'pass', ids.some(id => !profiles[id]) ? 'Elige configuraciones comparables para revisar los pares.' : shared.length ? shared.map(p=>p.text).join(' ') : 'No se activa la regla de redundancia alta para los pares y periodos comparados. Diferentes periodos no garantizan independencia.', [...new Set(shared.flatMap(p=>[p.a,p.b]))], shared.length ? 'Compara una alternativa retirando una de las herramientas del par. Conserva las mismas reglas y costes para estudiar su aportación.' : '');
  add('volatility','Volatilidad del contexto',d.regime !== 'volatile' ? 'na' : !ids.length ? 'unknown' : ids.some(id=>['atr','bollinger','keltner'].includes(id)) ? 'pass' : 'warn', 'En alta volatilidad revisa cómo adaptas tamaño y salida. No es obligatorio usar un indicador si tu regla de precio ya lo resuelve.', ['atr','bollinger'], 'Si esa función falta, estudia ATR como alternativa a una confirmación repetida de momentum o tendencia.');
  const usesVolume = ids.some(id=>volumeTools.includes(id));
  add('volume-source','Representatividad del volumen', !usesVolume ? 'na' : ids.some(id=>volumeTools.includes(id) && !profiles[id]) ? 'unknown' : d.market === 'Forex' || ids.some(id=>profiles[id]?.values.volume === 'ticks') ? 'warn' : 'pass', 'En Forex spot y con volumen de ticks, los datos dependen del proveedor. En los demás casos aún debes verificar bolsa, plataforma y cobertura.', ids.filter(id=>volumeTools.includes(id)));
  add('vwap-session','VWAP y sesión', !ids.includes('vwap') ? 'na' : !d.executionTf || !profiles.vwap ? 'unknown' : !intraday.includes(d.executionTf) ? 'warn' : 'pass', 'Estos presets son VWAP de sesión. En ejecución diaria o superior revisa si necesitas otra referencia o un VWAP anclado que aquí no se parametriza.', ['vwap']);
  add('tool-load','Carga de indicadores', ids.length <= 5 ? 'na' : ids.some(id=>!profiles[id]) ? 'unknown' : shared.length ? 'warn' : 'pass', shared.length ? `Usas ${ids.length} indicadores y se detectan ${shared.length} pares con información próxima. Simplifica primero esos pares.` : 'Una cantidad alta no se penaliza por sí sola si las reglas de solapamiento no detectan pares próximos.', [...new Set(shared.flatMap(p=>[p.a,p.b]))]);
  const applicable = criteria.filter(c=>c.status !== 'na');
  const passed = applicable.filter(c=>c.status === 'pass').length;
  const ready = missing.length === 0 && !applicable.some(c=>c.status === 'unknown');
  return { ready, score: ready ? Math.round(passed/applicable.length*100) : null, passed, total: applicable.length, missing, criteria, shared,
    notes: criteria.filter(c=>c.status==='warn').flatMap(c=>c.id === 'overlap'
      ? shared.map(pair=>({level:'warn',title:pair.title,short:pair.text,
        body: `${pair.text} ${pair.reason} ${c.suggestion}`,linked:[pair.a,pair.b],criterion:c.id,
        alternatives:[{removeId:pair.a,pairedWith:pair.b},{removeId:pair.b,pairedWith:pair.a}],
      }))
      : [{level:'warn',title:c.label,body:c.reason+(c.suggestion?' '+c.suggestion:''),linked:c.linked,short:c.reason.split(/(?<=\.)\s/)[0],criterion:c.id}]) };
}
