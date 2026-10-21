import { lessonDetails, references, reviewerRoles } from "./lessons.js";
export const items = [
  {
    id: "ema",
    name: "EMA",
    kind: "Indicador",
    family: "Tendencia",
    essential: true,
    simple: "Sigue la dirección del precio dando más peso a datos recientes.",
    best: "Mercados tendenciales",
    avoid: "Tomar cada cruce como señal aislada.",
    advanced: "Tiene retraso y puede generar falsos giros en rangos.",
    combine: "ADX, volumen, RSI",
    overlap: "SMA y MACD parcialmente",
  },
  {
    id: "macd",
    name: "MACD",
    kind: "Indicador",
    family: "Tendencia + momentum",
    essential: true,
    simple: "Ayuda a ver dirección y cambios de momentum.",
    best: "Tendencias",
    avoid: "Sumarlo a varias medias como si fuera independiente.",
    advanced: "Deriva de medias móviles y puede duplicar información.",
    combine: "Volumen, ATR",
    overlap: "EMA y SMA",
  },
  {
    id: "rsi",
    name: "RSI",
    kind: "Indicador",
    family: "Momentum",
    essential: true,
    simple:
      "Compara la magnitud de las subidas y bajadas recientes del precio.",
    best: "Rangos, timing y divergencias",
    avoid: "RSI > 70 no significa vender automáticamente.",
    advanced:
      "En tendencias fuertes puede permanecer mucho tiempo en extremos.",
    combine: "ADX, EMA, volumen",
    overlap: "Estocástico, CCI, Williams %R",
  },
  {
    id: "stoch",
    name: "Estocástico",
    kind: "Indicador",
    family: "Momentum",
    essential: false,
    simple: "Compara el cierre con el rango reciente.",
    best: "Mercados laterales",
    avoid: "Usarlo contra una tendencia fuerte sin filtro.",
    advanced: "Puede dar señales prematuras en tendencias persistentes.",
    combine: "ADX o tendencia superior",
    overlap: "RSI y Williams %R",
  },
  {
    id: "adx",
    name: "ADX / DMI",
    kind: "Indicador",
    family: "Fuerza de tendencia",
    essential: true,
    simple: "Ayuda a saber si hay tendencia suficiente.",
    best: "Filtrar régimen",
    avoid: "Interpretarlo como dirección por sí solo.",
    advanced: "ADX mide intensidad, no dirección.",
    combine: "RSI, EMA, MACD",
    overlap: "Bajo",
  },
  {
    id: "atr",
    name: "ATR",
    kind: "Indicador",
    family: "Volatilidad",
    essential: true,
    simple: "Mide cuánto se mueve el precio, no hacia dónde.",
    best: "Stops, volatilidad y expansión",
    avoid: "ATR sube = mercado alcista.",
    advanced: "Es no direccional.",
    combine: "Tendencia, volumen",
    overlap: "Keltner parcialmente",
  },
  {
    id: "bollinger",
    name: "Bandas de Bollinger",
    kind: "Indicador",
    family: "Volatilidad",
    essential: true,
    simple: "Muestran expansión y contracción alrededor de una media.",
    best: "Volatilidad, rango y expansión",
    avoid: "Tocar una banda no implica reversión.",
    advanced: "Útiles para squeezes y extremos relativos.",
    combine: "Volumen, RSI",
    overlap: "Keltner parcialmente",
  },
  {
    id: "volume",
    name: "Volumen",
    kind: "Indicador",
    family: "Volumen",
    essential: true,
    simple: "Mide participación y ayuda a confirmar movimientos.",
    best: "Estudiar la participación",
    avoid: "Tratarlo igual en todos los mercados.",
    advanced:
      "Aporta otra dimensión, pero su representatividad depende del mercado y la fuente.",
    combine: "Figuras, rupturas",
    overlap: "Bajo",
  },
  {
    id: "hns",
    name: "Hombro-Cabeza-Hombro",
    kind: "Figura",
    family: "Reversión",
    essential: true,
    simple: "Posible agotamiento alcista que necesita confirmación.",
    best: "Tras tendencia alcista",
    avoid: "Dar por válida la figura antes de romper la neckline.",
    advanced: "La confirmación pesa más que la similitud visual.",
    combine: "Volumen, momentum",
    overlap: "—",
  },
  {
    id: "triangle",
    name: "Triángulos",
    kind: "Figura",
    family: "Ruptura",
    essential: true,
    simple: "Compresión del precio que puede preceder una ruptura.",
    best: "Consolidaciones",
    avoid: "Adivinar el lado de ruptura.",
    advanced: "La ruptura importa más que la forma aislada.",
    combine: "Volumen, ATR",
    overlap: "—",
  },
  {
    id: "doji",
    name: "Doji",
    kind: "Vela",
    family: "Indecisión",
    essential: true,
    simple: "Apertura y cierre muy próximos: equilibrio o pausa.",
    best: "Tras movimientos extendidos",
    avoid: "Doji = giro seguro.",
    advanced: "Su valor depende del contexto previo y posterior.",
    combine: "Estructura, volumen",
    overlap: "—",
  },
  {
    id: "hammer",
    name: "Hammer",
    kind: "Vela",
    family: "Reversión alcista",
    essential: true,
    simple: "Rechazo de precios bajos tras una caída.",
    best: "Tras tendencia bajista",
    avoid: "Llamar hammer a cualquier mecha larga.",
    advanced: "La ubicación es esencial.",
    combine: "Soporte, volumen",
    overlap: "—",
  },
  {
    id: "engulfing",
    name: "Engulfing",
    kind: "Vela",
    family: "Reversión",
    essential: true,
    simple: "Una vela envuelve el cuerpo de la anterior.",
    best: "Tras movimiento previo definido",
    avoid: "Ignorar dónde aparece.",
    advanced: "El contexto pesa más que la forma aislada.",
    combine: "Estructura, volumen",
    overlap: "—",
  },
];


// Fichas ampliadas: ejemplos didácticos, no recomendaciones ni evidencia de rentabilidad.
items.find(x => x.id === "ema").parameters = "20 o 50 periodos como ejemplos; elegir según horizonte.";
items.find(x => x.id === "ema").example = "EMA20 asciende tras varios cierres superiores: contexto de tendencia, no orden de entrada.";
items.find(x => x.id === "ema").confirmation = "Buscar estructura de máximos/mínimos coherente y evitar cruces aislados.";
items.find(x => x.id === "ema").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "macd").parameters = "EMA rápida 12, lenta 26 y señal 9: ajuste clásico.";
items.find(x => x.id === "macd").example = "MACD cruza su señal mientras EMA20 ya subía: ambas dependen del precio; cuidado con contar doble.";
items.find(x => x.id === "macd").confirmation = "Contrastar con estructura y separar dirección de timing.";
items.find(x => x.id === "macd").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "rsi").parameters = "14 periodos; niveles 30/70 son referencias orientativas.";
items.find(x => x.id === "rsi").example = "RSI en 76 durante tendencia fuerte puede mantenerse alto sin que exista giro bajista.";
items.find(x => x.id === "rsi").confirmation = "Interpretar con régimen y comportamiento del precio.";
items.find(x => x.id === "rsi").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "stoch").parameters = "%K 14, %D 3, suavizado 3: ejemplo habitual.";
items.find(x => x.id === "stoch").example = "Estocástico abandona zona extrema en un rango; vigilar confirmación de soporte.";
items.find(x => x.id === "stoch").confirmation = "No tratar extremos como señal aislada.";
items.find(x => x.id === "stoch").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "adx").parameters = "14 periodos; distinguir ADX de +DI/−DI.";
items.find(x => x.id === "adx").example = "ADX aumenta mientras +DI supera −DI: hay fuerza y una referencia de dirección separadas.";
items.find(x => x.id === "adx").confirmation = "Comprobar régimen y dirección por separado.";
items.find(x => x.id === "adx").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "atr").parameters = "14 periodos clásicos; lectura en unidades de precio.";
items.find(x => x.id === "atr").example = "ATR de 3€ en acción de 100€ describe amplitud, no dirección.";
items.find(x => x.id === "atr").confirmation = "Usar para calibrar amplitud y riesgo, no para pronóstico direccional.";
items.find(x => x.id === "atr").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "bollinger").parameters = "Media 20, desviaciones 2: ajustes de referencia.";
items.find(x => x.id === "bollinger").example = "Bandas se estrechan antes de una expansión sin anticipar el sentido.";
items.find(x => x.id === "bollinger").confirmation = "Esperar acción del precio y, si procede, volumen.";
items.find(x => x.id === "bollinger").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "volume").parameters = "Fuente y unidad (acciones, contratos, ticks o volumen de plataforma).";
items.find(x => x.id === "volume").example = "Ruptura con mayor volumen relativo en acciones puede sugerir participación; en Forex spot el dato es parcial.";
items.find(x => x.id === "volume").confirmation = "Identificar proveedor, instrumento y comparación histórica.";
items.find(x => x.id === "volume").source = "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites).";
items.find(x => x.id === "hns").parameters = "Sin periodo fijo; identificar tres máximos y línea clavicular.";
items.find(x => x.id === "hns").example = "Tres picos con el central más alto no confirman giro hasta pérdida de neckline.";
items.find(x => x.id === "hns").confirmation = "Establecer ruptura válida e invalidación.";
items.find(x => x.id === "hns").source = "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables).";
items.find(x => x.id === "triangle").parameters = "Sin periodo fijo; definir líneas de convergencia y ruptura.";
items.find(x => x.id === "triangle").example = "Un triángulo simétrico estrecha máximos/mínimos; todavía no determina dirección.";
items.find(x => x.id === "triangle").confirmation = "Observar la salida y evitar anticiparla.";
items.find(x => x.id === "triangle").source = "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables).";
items.find(x => x.id === "doji").parameters = "Una vela; tolerancia cuerpo/rango dependiente del mercado.";
items.find(x => x.id === "doji").example = "Doji aparece tras subida fuerte; la siguiente vela confirma continuación, no reversión.";
items.find(x => x.id === "doji").confirmation = "Esperar información adicional del precio.";
items.find(x => x.id === "doji").source = "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses).";
items.find(x => x.id === "hammer").parameters = "Una vela; mecha inferior preferiblemente mayor que cuerpo.";
items.find(x => x.id === "hammer").example = "Martillo tras caída en soporte: alerta de rechazo, no orden automática.";
items.find(x => x.id === "hammer").confirmation = "Contexto bajista previo y confirmación.";
items.find(x => x.id === "hammer").source = "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses).";
items.find(x => x.id === "engulfing").parameters = "Dos velas; segunda envuelve al menos cuerpo de la primera.";
items.find(x => x.id === "engulfing").example = "Envolvente alcista tras caída y en soporte; comparar cierre posterior.";
items.find(x => x.id === "engulfing").confirmation = "Usar contexto y reacción posterior.";
items.find(x => x.id === "engulfing").source = "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses).";
items.push({"id": "sma", "name": "Media móvil simple (SMA)", "kind": "Indicador", "family": "Tendencia", "simple": "Promedia los cierres de un número fijo de velas para visualizar la dirección general.", "best": "Contexto de tendencia y soportes dinámicos", "avoid": "Tratar el precio sobre la media como señal de compra automática.", "advanced": "Todos los cierres pesan igual; reacciona más despacio que una EMA equivalente. Los cruces repetidos en rangos suelen aportar poco.", "combine": "ADX, ATR y estructura del precio", "overlap": "EMA, MACD", "parameters": "20, 50 o 200 periodos (ejemplos, no recomendaciones).", "example": "Un índice supera su SMA 50, pero el ADX es bajo: aún puede estar en rango.", "confirmation": "Comprueba pendiente, estructura y marco superior.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "vwap", "name": "VWAP de sesión", "kind": "Indicador", "family": "Precio y volumen", "simple": "Calcula el precio medio ponderado por volumen dentro de una sesión.", "best": "Operativa intradía sobre mercados con volumen representativo", "avoid": "Usarlo en gráfico semanal como si fuera un VWAP diario de sesión.", "advanced": "El VWAP clásico se reinicia cada sesión; su significado depende del horario y de que el volumen represente el instrumento utilizado. No es una previsión.", "combine": "Volumen, estructura, ATR", "overlap": "Otras referencias de precio medio", "parameters": "Sesión/mercado y horario de reinicio; no hay periodo clásico fijo.", "example": "Una acción negocia por encima del VWAP intradía, pero la pérdida de un soporte puede invalidar la lectura.", "confirmation": "Indica mercado y sesión; contrasta con el precio y el contexto.", "essential": false, "source": "StockCharts ChartSchool, Volume-Weighted Average Price (VWAP)."} );
items.push({"id": "obv", "name": "On-Balance Volume (OBV)", "kind": "Indicador", "family": "Volumen", "simple": "Acumula o resta volumen según el signo del cierre para seguir la participación.", "best": "Divergencias entre precio y volumen", "avoid": "Interpretar su valor absoluto como un objetivo de precio.", "advanced": "La línea es acumulativa; interesa su dirección y divergencias, no su nivel. Depende de la calidad del volumen.", "combine": "Tendencia del precio y soportes", "overlap": "CMF y volumen directo", "parameters": "Sin periodo estándar; opcional media de suavizado.", "example": "El precio marca un nuevo máximo, pero el OBV no: observa, no des por hecho el giro.", "confirmation": "Comprueba fiabilidad del volumen y confirmación de precio.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "cmf", "name": "Chaikin Money Flow (CMF)", "kind": "Indicador", "family": "Volumen", "simple": "Relaciona ubicación del cierre en la vela con el volumen del periodo.", "best": "Estudiar acumulación/distribución", "avoid": "Aplicar umbrales de 50 como si su escala fuera 0–100.", "advanced": "Oscila aproximadamente entre −1 y +1. Un valor positivo sugiere cierres relativamente altos acompañados de volumen; no prueba entradas institucionales.", "combine": "Tendencia y estructura", "overlap": "OBV y acumulación/distribución", "parameters": "20 o 21 periodos habituales.", "example": "Una ruptura con CMF por encima de cero puede estudiarse como confirmación, nunca como garantía.", "confirmation": "Comprueba fuente de volumen y estructura previa.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "cci", "name": "Commodity Channel Index (CCI)", "kind": "Indicador", "family": "Momentum", "simple": "Mide la distancia del precio típico respecto de su media, normalizada por desviación media.", "best": "Oscilaciones y aceleraciones de precio", "avoid": "Interpretar +100/−100 como órdenes de venta o compra.", "advanced": "Oscilador sin límites rígidos. Puede permanecer en extremos durante tendencias y solaparse con otros medidores de momentum.", "combine": "ADX y estructura", "overlap": "RSI, Estocástico", "parameters": "20 periodos habituales.", "example": "CCI supera +100 en una tendencia fuerte: puede indicar expansión, no agotamiento inmediato.", "confirmation": "Relaciona extremos con régimen y acción del precio.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "williams", "name": "Williams %R", "kind": "Indicador", "family": "Momentum", "simple": "Mide dónde cierra el precio respecto al máximo y mínimo recientes.", "best": "Timing dentro de rangos", "avoid": "Sumarlo al Estocástico para contar dos confirmaciones.", "advanced": "Su escala habitual va de −100 a 0 y es muy parecido al Estocástico rápido; ambos miden la posición del cierre en el rango.", "combine": "Tendencia principal", "overlap": "Estocástico, RSI", "parameters": "14 periodos habituales; escala −100 a 0.", "example": "%R cae a −85 junto a soporte: vigila la reacción, no entres por el umbral solo.", "confirmation": "Espera una condición observable de giro.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "keltner", "name": "Canales de Keltner", "kind": "Indicador", "family": "Volatilidad", "simple": "Envuelven una media con bandas definidas mediante ATR.", "best": "Tendencia y expansión", "avoid": "Confundir Keltner y Bollinger como cálculos idénticos.", "advanced": "Keltner utiliza ATR; Bollinger, desviación estándar. Su función puede solaparse como canal, pero sus respuestas a la distribución del precio difieren.", "combine": "ADX, volumen y estructura", "overlap": "Bollinger, ATR parcialmente", "parameters": "EMA 20, ATR 10 y multiplicador 2: configuración de ejemplo.", "example": "Precio sale del canal en una expansión; verifica si existe ruptura estructural.", "confirmation": "Observa volatilidad y confirmación fuera del canal.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "sar", "name": "Parabolic SAR", "kind": "Indicador", "family": "Tendencia", "simple": "Marca puntos de seguimiento para una tendencia y posibles salidas dinámicas.", "best": "Tendencias definidas", "avoid": "Usarlo en lateralidad sin aceptar señales falsas repetidas.", "advanced": "Es un seguidor con factor de aceleración; puede alternar señales rápidamente si el movimiento no es tendencial.", "combine": "ADX y ATR", "overlap": "Medias móviles en seguimiento de tendencia", "parameters": "Aceleración inicial 0,02; incremento 0,02; máximo 0,20.", "example": "El precio cruza puntos SAR tras una subida: revisa la salida según tus reglas.", "confirmation": "Filtra régimen y define invalidación.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "roc", "name": "Rate of Change (ROC)", "kind": "Indicador", "family": "Momentum", "simple": "Expresa el cambio porcentual del precio frente a un periodo anterior.", "best": "Ver velocidad del movimiento", "avoid": "Suponer que aceleración implica continuidad asegurada.", "advanced": "Puede oscilar alrededor de cero sin límite fijo. Su sensibilidad cambia mucho con el periodo elegido y la volatilidad.", "combine": "Tendencia, volumen", "overlap": "Otros osciladores de momentum", "parameters": "12 periodos como ejemplo.", "example": "ROC pasa de negativo a positivo, pero el precio sigue bajo resistencia: aún no confirma ruptura.", "confirmation": "Comprueba estructura y horizonte temporal.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (indicadores); Alexander Elder, El nuevo vivir del trading (interpretación y límites)."} );
items.push({"id": "ichimoku", "name": "Nube Ichimoku", "kind": "Indicador", "family": "Tendencia y estructura", "simple": "Conjunto de líneas que sitúa tendencia, equilibrio y zonas dinámicas de soporte y resistencia.", "best": "Lectura integral de contexto tendencial", "avoid": "Añadir todas sus señales a otros indicadores sin distinguir funciones.", "advanced": "Tenkan, Kijun, Senkou y Chikou presentan referencias de precio con desplazamientos gráficos; exige distinguir valores calculados de su posición visual.", "combine": "Volumen, estructura y marco superior", "overlap": "Medias y canales de tendencia parcialmente", "parameters": "9 / 26 / 52 y desplazamiento 26: configuración clásica.", "example": "Precio pasa a zona de nube: el estado puede ser de transición, no tendencia confirmada.", "confirmation": "Revisa pendiente, nube, timeframe y posición del precio.", "essential": false, "source": "StockCharts ChartSchool, Ichimoku Cloud."} );
items.push({"id": "inverse-hns", "name": "Hombro-Cabeza-Hombro invertido", "kind": "Figura", "family": "Reversión", "simple": "Tres valles, el central más profundo, pueden formar una base de giro.", "best": "Después de una caída", "avoid": "Anticipar ruptura de neckline sin confirmación.", "advanced": "La estructura sólo tiene sentido con tendencia previa. Un esquema reconocible no garantiza continuación tras la ruptura.", "combine": "Volumen y momentum", "overlap": "Otras bases chartistas", "parameters": "No tiene periodo fijo; definir neckline y tolerancias.", "example": "Se rompe neckline después del tercer valle: esperar retesteo es una regla opcional, no requisito universal.", "confirmation": "Ruptura observada y criterios de invalidación.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "double-top", "name": "Doble techo", "kind": "Figura", "family": "Reversión", "simple": "Dos máximos cercanos pueden mostrar dificultad para superar una resistencia.", "best": "Tras subida previa", "avoid": "Llamarlo doble techo antes de perder el valle intermedio.", "advanced": "La simetría no tiene por qué ser perfecta. Confirmar requiere definir la zona de ruptura y las tolerancias.", "combine": "Volumen, RSI y estructura", "overlap": "HCH y otros techos", "parameters": "Definir tolerancia entre máximos y ruptura del valle.", "example": "Dos máximos similares seguidos de pérdida del soporte intermedio: giro posible, nunca seguro.", "confirmation": "Precio por debajo del soporte con regla de invalidación.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "double-bottom", "name": "Doble suelo", "kind": "Figura", "family": "Reversión", "simple": "Dos mínimos cercanos pueden indicar que la presión bajista pierde eficacia.", "best": "Tras caída previa", "avoid": "Confundir dos rebotes con un doble suelo confirmado.", "advanced": "Se suele estudiar la superación del máximo intermedio; la mera semejanza de mínimos no basta.", "combine": "Volumen y momentum", "overlap": "HCH invertido", "parameters": "Definir tolerancia entre mínimos y ruptura de resistencia.", "example": "Dos mínimos similares y recuperación del máximo central: posible cambio de estructura.", "confirmation": "Superación observable de resistencia y posterior invalidación.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "triple-top", "name": "Triple techo", "kind": "Figura", "family": "Reversión", "simple": "Tres rechazos cerca de una resistencia pueden preceder una pérdida de soporte.", "best": "Después de tendencia alcista", "avoid": "Considerar cada tercer toque una orden de venta.", "advanced": "El patrón puede derivar en consolidación. No hay giro confirmado mientras el precio mantenga su estructura.", "combine": "Volumen y estructura", "overlap": "Doble techo", "parameters": "Definir zona de máximos y nivel de soporte.", "example": "Tres ataques a resistencia y una pérdida posterior del rango.", "confirmation": "Ruptura del soporte del patrón.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "triple-bottom", "name": "Triple suelo", "kind": "Figura", "family": "Reversión", "simple": "Tres apoyos cercanos en una zona de soporte pueden anticipar recuperación.", "best": "Después de tendencia bajista", "avoid": "Interpretar repetición de mínimos como certeza de suelo.", "advanced": "La confirmación requiere superar una referencia de resistencia; de lo contrario puede ser un rango.", "combine": "Volumen, tendencia", "overlap": "Doble suelo", "parameters": "Definir soporte y resistencia del rango.", "example": "Tres rechazos de mínimos y ruptura de resistencia.", "confirmation": "Confirmación de salida del rango.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "flag", "name": "Bandera", "kind": "Figura", "family": "Continuación", "simple": "Consolidación corta y generalmente inclinada tras un impulso claro.", "best": "Pausa tras movimiento tendencial fuerte", "avoid": "Buscar una bandera sin impulso previo.", "advanced": "Puede romper por cualquier lado; la forma por sí sola no resuelve dirección ni probabilidad.", "combine": "Volumen y ATR", "overlap": "Banderín", "parameters": "Definir impulso previo, canal y punto de ruptura.", "example": "Tras un impulso alcista aparece un canal leve descendente.", "confirmation": "Salida del canal en dirección compatible y gestión de invalidación.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "pennant", "name": "Banderín", "kind": "Figura", "family": "Continuación", "simple": "Pequeña compresión triangular tras un avance o caída rápida.", "best": "Consolidación breve después del impulso", "avoid": "Confundirlo con un triángulo de semanas sin movimiento previo.", "advanced": "La duración y el contexto del impulso importan más que la forma perfecta.", "combine": "Volumen y ATR", "overlap": "Bandera, triángulo", "parameters": "Definir mástil, compresión y horizonte.", "example": "Tras caída rápida el precio comprime en un pequeño triángulo.", "confirmation": "Ruptura observada, no anticipada.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "rectangle", "name": "Rectángulo / rango", "kind": "Figura", "family": "Consolidación", "simple": "Movimiento entre soporte y resistencia relativamente horizontales.", "best": "Mercado lateral", "avoid": "Suponer que toda salida del rango inicia tendencia.", "advanced": "Puede operar como pausa o reversión; conviene separar rebotes dentro del rango de rupturas fuera de él.", "combine": "Volumen, ATR, ADX", "overlap": "Canales horizontales", "parameters": "Identificar límite alto, bajo y criterio de salida.", "example": "Precio rebota varias veces entre dos zonas claras.", "confirmation": "Confirmación de toque o ruptura según objetivo.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "wedge", "name": "Cuñas", "kind": "Figura", "family": "Contracción", "simple": "Dos límites convergentes inclinados pueden reflejar pérdida progresiva de amplitud.", "best": "Compresión tras movimiento definido", "avoid": "Adivinar dirección mirando sólo la inclinación de la figura.", "advanced": "La cuña ascendente/descendente se interpreta según tendencia previa, volumen y ruptura concreta.", "combine": "Momentum, volumen", "overlap": "Triángulos", "parameters": "Definir líneas convergentes y ruptura.", "example": "Rango de máximos y mínimos se estrecha antes de salir del canal.", "confirmation": "Ruptura más invalidación explícita.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "support", "name": "Soportes y resistencias", "kind": "Figura", "family": "Estructura del precio", "simple": "Zonas donde el precio ha reaccionado previamente y que ayudan a definir escenarios.", "best": "Cualquier operativa con niveles", "avoid": "Dibujar líneas con precisión absoluta ignorando que suelen ser zonas.", "advanced": "No son garantías. Los niveles cambian de relevancia con volatilidad, temporalidad y volumen de negociación.", "combine": "Tendencia, ATR y volumen", "overlap": "Rectángulos, máximos/mínimos", "parameters": "Zona o tolerancia; marco temporal y criterio de ruptura.", "example": "Precio retorna a una zona donde antes cambió de dirección.", "confirmation": "Esperar comportamiento observable, no asumir rebote.", "essential": false, "source": "John J. Murphy, Technical Analysis of the Financial Markets (figuras y estructura); Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed. (muestras históricas no extrapolables)."} );
items.push({"id": "shooting", "name": "Estrella fugaz (Shooting Star)", "kind": "Vela", "family": "Reversión bajista", "simple": "Mecha superior larga tras subida: rechazo de precios altos.", "best": "Cerca de techo o resistencia después de avance", "avoid": "Confundirla con un martillo invertido sin mirar tendencia previa.", "advanced": "La ubicación es la pieza decisiva; por sí sola no convierte una subida en bajada.", "combine": "Resistencia y volumen", "overlap": "Martillo invertido (misma forma, distinto contexto)", "parameters": "Una vela; comparar mecha superior con cuerpo.", "example": "Tras subir, una vela con mecha superior prolongada cierra cerca de mínimos.", "confirmation": "Confirmar con la vela posterior o pérdida de referencia.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "inverted-hammer", "name": "Martillo invertido", "kind": "Vela", "family": "Posible reversión alcista", "simple": "Pequeño cuerpo y mecha alta tras una caída: posible intento comprador.", "best": "Tras tendencia bajista", "avoid": "Dar por confirmado el giro sólo por la forma.", "advanced": "Físicamente recuerda a la estrella fugaz, pero la tendencia previa y confirmación determinan su interpretación.", "combine": "Soporte y momentum", "overlap": "Estrella fugaz", "parameters": "Una vela; contexto bajista y mecha superior relevante.", "example": "Una vela rechaza precios altos tras una caída, pero la siguiente confirma recuperación.", "confirmation": "Nueva vela favorable antes de plantear giro.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "hanging-man", "name": "Hombre colgado", "kind": "Vela", "family": "Posible reversión bajista", "simple": "Cuerpo pequeño y mecha inferior extensa tras una subida.", "best": "En zona alta tras avance", "avoid": "Confundir con martillo alcista por la forma idéntica.", "advanced": "Su significado depende de la ubicación y de la respuesta posterior. Un solo patrón no valida cambio de tendencia.", "combine": "Resistencia y estructura", "overlap": "Martillo", "parameters": "Una vela con mecha inferior larga.", "example": "Tras subida pronunciada aparece hombre colgado; sin confirmación no hay giro.", "confirmation": "Cierre posterior que debilite la estructura.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "harami", "name": "Harami", "kind": "Vela", "family": "Pausa o reversión", "simple": "Vela de cuerpo pequeño contenida en el cuerpo de la vela anterior.", "best": "Tras movimiento prolongado", "avoid": "Considerar cualquier inside bar un giro automático.", "advanced": "Puede sugerir pérdida de impulso sin establecer la dirección siguiente. No es garantía estadística.", "combine": "Soporte/resistencia, momentum", "overlap": "Inside bar", "parameters": "Dos velas; segunda dentro del cuerpo de la primera.", "example": "Una gran vela bajista seguida de pequeña vela interior revela pausa.", "confirmation": "Confirmación de ruptura del rango del patrón.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "morning-star", "name": "Estrella de la mañana", "kind": "Vela", "family": "Reversión alcista", "simple": "Tres velas: presión bajista, pausa y recuperación.", "best": "Tras caída definida", "avoid": "Identificar la figura sin una caída previa.", "advanced": "La tercera vela muestra recuperación respecto a la primera; el contexto de soporte importa.", "combine": "Soporte y volumen", "overlap": "Envolvente alcista", "parameters": "Tres velas; variantes con o sin gaps según mercado.", "example": "Tras caída, vela pequeña y vela alcista amplia recuperan parte del descenso.", "confirmation": "Confirmación de recuperación y nivel de invalidación.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "evening-star", "name": "Estrella de la tarde", "kind": "Vela", "family": "Reversión bajista", "simple": "Tres velas: avance, pausa y recuperación vendedora.", "best": "Tras subida definida", "avoid": "Buscar la figura dentro de un rango indiferenciado.", "advanced": "La tercera vela debe poner en duda la subida previa; confirma con estructura y ubicación.", "combine": "Resistencia y volumen", "overlap": "Envolvente bajista", "parameters": "Tres velas; considerar continuidad de cotización.", "example": "Tras subida, vela pequeña y caída que penetra en cuerpo anterior.", "confirmation": "Confirmación posterior o pérdida de soporte.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );
items.push({"id": "marubozu", "name": "Marubozu", "kind": "Vela", "family": "Impulso", "simple": "Cuerpo grande con mechas muy pequeñas o ausentes: dirección dominante durante la vela.", "best": "Lectura de impulsos", "avoid": "Comprar/vender después de una vela extensa sin evaluar extensión y riesgo.", "advanced": "No garantiza continuidad; el contexto es esencial para distinguir impulso inicial de movimiento agotado.", "combine": "Volumen, ATR, estructura", "overlap": "Velas de cuerpo amplio", "parameters": "Una vela; relación entre cuerpo y rango total.", "example": "Una vela larga sale de una consolidación, pero hay resistencia próxima.", "confirmation": "Revisa cierre, volatilidad y nivel de invalidación.", "essential": false, "source": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed. (patrones japoneses)."} );

export const bibliography = {
"murphy": "John J. Murphy, Technical Analysis of the Financial Markets.",
"elder": "Alexander Elder, El nuevo vivir del trading.",
"nison": "Steve Nison, Japanese Candlestick Charting Techniques, 2.ª ed.",
"bulkowski": "Thomas Bulkowski, Encyclopedia of Chart Patterns, 2.ª ed.",
"aronson": "David R. Aronson, Evidence-Based Technical Analysis."
};

// Enriquecimiento editorial: IDs estables y fuente única para las 40 fichas.
for (const item of items) {
  const lesson = lessonDetails[item.id];
  if (!lesson) throw new Error(`Falta desarrollo educativo: ${item.id}`);
  Object.assign(item, lesson);
  if (item.kind === "Indicador") {
    if (!reviewerRoles[item.id]) throw new Error(`Sin rol de revisor: ${item.id}`);
    item.reviewRole = reviewerRoles[item.id];
  }
}
export { references };
