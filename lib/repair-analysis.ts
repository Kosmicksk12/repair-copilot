import repairKnowledge from "@/data/repair-knowledge.json";
import { faq } from "@/data/faq";
import { businessRules } from "./business-rules";
import { sanitizeAnalysisOutput } from "./sanitize";
import type {
  AnalyzeResult,
  OportunidadVenta,
  ProbabilidadCierre,
  RepairKnowledge,
  NivelMolestia,
  RiesgoCliente,
  SimilarRepairCase,
} from "./repair-types";

const knowledge = repairKnowledge as RepairKnowledge;

const stopwords = new Set([
  "para",
  "pero",
  "este",
  "esta",
  "esto",
  "tengo",
  "equipo",
  "celular",
  "telefono",
  "teléfono",
  "favor",
  "hola",
]);

const riskWeight: Record<RiesgoCliente, number> = {
  Verde: 1,
  Amarillo: 2,
  Rojo: 3,
};

const opportunityWeight: Record<OportunidadVenta, number> = {
  Baja: 1,
  Media: 2,
  Alta: 3,
};

const closeProbabilityWeight: Record<ProbabilidadCierre, number> = {
  Baja: 1,
  Media: 2,
  Alta: 3,
};

export function buscarCasosSimilares(textoCliente: string): SimilarRepairCase[] {
  const normalizedText = normalize(textoCliente);
  const tokens = tokenize(textoCliente);
  const modelHits = findModelHits(normalizedText);

  return knowledge.repairs
    .map((repair) => {
      const repairText = normalize(
        [
          repair.marca,
          repair.modelo,
          repair.tipoDanio,
          repair.descripcion,
          repair.estado,
        ].join(" "),
      );

      let score = 0;
      for (const token of tokens) {
        if (repairText.includes(token)) score += token.length > 4 ? 1.2 : 0.7;
      }

      if (modelHits.some((model) => normalize(repair.modelo) === model)) score += 7;
      if (modelHits.some((model) => normalize(repair.modelo).includes(model))) score += 4;

      const inferredDamage = inferDamage(textoCliente);
      if (inferredDamage && normalize(repair.tipoDanio).includes(normalize(inferredDamage))) score += 6;
      if (inferredDamage && repairText.includes(normalize(inferredDamage))) score += 4;

      return { ...repair, score: Number(score.toFixed(2)) };
    })
    .filter((repair) => repair.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

export async function analyzeCustomerMessage(textoCliente: string): Promise<AnalyzeResult> {
  const text = textoCliente.trim();
  const casos = buscarCasosSimilares(text);
  const matchedRules = getMatchedRules(text);
  const matchedFaq = getMatchedFaq(text);
  const rawFrequentDamage = mostFrequent(casos.map((repair) => repair.tipoDanio)) || inferDamage(text) || "Sin clasificar";
  const tipoDanioMasFrecuente = canonicalDamage(rawFrequentDamage);
  const categoria = matchedRules[0]?.categoria || matchedFaq[0]?.categoria || tipoDanioMasFrecuente;
  const emocion = detectEmotion(text);
  const riesgoCliente = highestRisk(matchedRules.map((rule) => rule.riesgo), text, categoria);
  const nivelOportunidadVenta = highestOpportunity(matchedRules.map((rule) => rule.oportunidad), categoria, casos.length);
  const objecionesDetectadas = detectObjections(text);
  const nivelMolestia = detectAnnoyanceLevel(text);
  const probabilidadCierre = estimateCloseProbability(
    text,
    nivelOportunidadVenta,
    nivelMolestia,
    objecionesDetectadas,
    casos.length,
  );
  const modelosRelacionados = uniqueByNormalized(
    casos
      .map((repair) => repair.modelo)
      .filter(Boolean)
      .slice(0, 12),
  ).slice(0, 6);

  return sanitizeAnalysisOutput({
    input: text,
    categoria,
    estadoEmocional: emocion,
    emocion,
    riesgoCliente,
    nivelOportunidadVenta,
    probabilidadCierre,
    objecionesDetectadas,
    nivelMolestia,
    tiempoEstimadoRespuesta: matchedRules[0]?.tiempoRespuesta || estimateResponseTime(riesgoCliente, casos.length),
    casosSimilares: casos.length,
    modelosRelacionados,
    tipoDanioMasFrecuente,
    respuestaSugerida:
      matchedRules[0]?.respuesta ||
      matchedFaq[0]?.respuesta ||
      "Gracias por escribirnos. Para darte una respuesta precisa, necesitamos validar el modelo exacto y el síntoma principal del equipo.",
    recomendacionAsesor:
      matchedRules[0]?.consejo ||
      matchedFaq[0]?.consejo ||
      buildRecommendation(categoria, casos.length),
    errorNoCometer: buildMistakeToAvoid(categoria, riesgoCliente, nivelMolestia, objecionesDetectadas),
    modulos: buildAdvisorModules({
      categoria,
      riesgoCliente,
      nivelOportunidadVenta,
      probabilidadCierre,
      objecionesDetectadas,
      nivelMolestia,
      casosSimilares: casos.length,
      tipoDanioMasFrecuente,
    }),
    casos: casos.slice(0, 6).map(toVisibleRepairCase),
    fuentes: {
      faq: matchedFaq.map((item) => item.categoria),
      historial: knowledge.totalRepairs,
      reglasNegocio: matchedRules.map((rule) => rule.id),
      motor: "local-rules",
      openAIReady: true,
    },
  });
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function findModelHits(normalizedText: string) {
  const models = unique(knowledge.repairs.map((repair) => normalize(repair.modelo)).filter(Boolean));
  return models.filter((model) => model.length > 2 && normalizedText.includes(model));
}

function inferDamage(text: string) {
  const normalizedText = normalize(text);
  const damageAliases: Record<string, string[]> = {
    Humedad: ["humedad", "mojo", "mojado", "agua", "liquido"],
    Pantalla: ["pantalla", "display", "golpe", "vidrio", "tactil"],
    Batería: ["bateria", "carga", "descarga", "apaga"],
    Software: ["software", "actualizacion", "bloqueado", "restaurar"],
    "Face ID": ["face id", "faceid"],
    Cámara: ["camara", "camera"],
  };

  return Object.entries(damageAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizedText.includes(alias)),
  )?.[0];
}

function canonicalDamage(value: string) {
  const normalizedValue = normalize(value);
  if (/(humedad|mojo|mojado|agua|liquido|se mojo)/.test(normalizedValue)) return "Humedad";
  if (/(pantalla|display|golpe|vidrio|tactil)/.test(normalizedValue)) return "Pantalla";
  if (/(bateria|carga|descarga|apaga)/.test(normalizedValue)) return "Batería";
  if (/(software|actualizacion|bloqueado|restaurar)/.test(normalizedValue)) return "Software";
  return value;
}

function getMatchedRules(text: string) {
  const normalizedText = normalize(text);
  return businessRules.filter((rule) =>
    rule.keywords.some((keyword) => normalizedText.includes(normalize(keyword))),
  );
}

function getMatchedFaq(text: string) {
  const normalizedText = normalize(text);
  return faq.filter((item) =>
    item.keywords.some((keyword) => normalizedText.includes(normalize(keyword))),
  );
}

function detectEmotion(text: string) {
  const normalizedText = normalize(text);
  if (/(urgente|molesto|enojado|demorado|mal servicio|otra vez|reclamo)/.test(normalizedText)) {
    return "Molesto o urgente";
  }
  if (/(gracias|por favor|buenos dias|buenas)/.test(normalizedText)) {
    return "Cooperativo";
  }
  return "Neutral";
}

function detectObjections(text: string) {
  const normalizedText = normalize(text);
  const objections: string[] = [];

  if (/(caro|costoso|muy alto|precio|rebaja|descuento|mas barato|más barato)/.test(normalizedText)) {
    objections.push("Condición comercial");
  }
  if (/(demora|tarda|tiempo|cuando|urgente|hoy|ya)/.test(normalizedText)) {
    objections.push("Tiempo");
  }
  if (/(garantia|garantía|responde|cubre|volvio|volvió|otra vez)/.test(normalizedText)) {
    objections.push("Garantía");
  }
  if (/(original|calidad|generico|genérico|repuesto)/.test(normalizedText)) {
    objections.push("Calidad del repuesto");
  }
  if (/(confianza|seguro|estafa|miedo|datos|informacion|información)/.test(normalizedText)) {
    objections.push("Confianza");
  }

  return objections.length ? objections : ["Sin objeción explícita"];
}

function detectAnnoyanceLevel(text: string): NivelMolestia {
  const normalizedText = normalize(text);
  let score = 0;

  if (/(molesto|enojado|furioso|reclamo|queja|mal servicio)/.test(normalizedText)) score += 3;
  if (/(otra vez|volvio|volvió|nadie responde|no contestan|demora|demorado)/.test(normalizedText)) score += 2;
  if (/(urgente|ya|hoy|necesito respuesta)/.test(normalizedText)) score += 1;

  if (score >= 3) return "Alto";
  if (score >= 1) return "Medio";
  return "Bajo";
}

function estimateCloseProbability(
  text: string,
  opportunity: OportunidadVenta,
  annoyance: NivelMolestia,
  objections: string[],
  similarCases: number,
): ProbabilidadCierre {
  const normalizedText = normalize(text);
  const candidates: ProbabilidadCierre[] = [];

  if (/(cuanto|cuánto|precio|valor|cotizar|agenda|agendar|llevar|reparar)/.test(normalizedText)) {
    candidates.push("Alta");
  }
  if (opportunity === "Alta" && similarCases > 5) candidates.push("Alta");
  if (opportunity === "Media") candidates.push("Media");
  if (objections.includes("Condición comercial") || objections.includes("Confianza")) candidates.push("Media");
  if (annoyance === "Alto" || opportunity === "Baja") candidates.push("Baja");

  return candidates.sort((a, b) => closeProbabilityWeight[b] - closeProbabilityWeight[a])[0] || "Media";
}

function highestRisk(risks: RiesgoCliente[], text: string, category: string): RiesgoCliente {
  const normalizedText = normalize(text);
  const inferred: RiesgoCliente[] = [...risks];
  if (/(garantia|reclamo|mojo|humedad|no prende|no enciende)/.test(normalizedText)) inferred.push("Rojo");
  if (/(pantalla|demora|estado|golpe)/.test(normalizedText)) inferred.push("Amarillo");
  if (/(humedad|mojo|se mojo)/.test(normalize(category))) inferred.push("Rojo");
  return inferred.sort((a, b) => riskWeight[b] - riskWeight[a])[0] || "Verde";
}

function highestOpportunity(
  opportunities: OportunidadVenta[],
  category: string,
  similarCases: number,
): OportunidadVenta {
  const inferred: OportunidadVenta[] = [...opportunities];
  const normalizedCategory = normalize(category);
  if (/(pantalla|humedad|bateria|carga)/.test(normalizedCategory)) inferred.push("Alta");
  if (similarCases > 10) inferred.push("Media");
  return inferred.sort((a, b) => opportunityWeight[b] - opportunityWeight[a])[0] || "Baja";
}

function estimateResponseTime(risk: RiesgoCliente, similarCases: number) {
  if (risk === "Rojo") return "10-15 min";
  if (similarCases > 0) return "5-10 min";
  return "15-20 min";
}

function buildRecommendation(category: string, similarCases: number) {
  if (similarCases > 0) {
    return `Revisar los ${similarCases} casos similares antes de responder y confirmar diagnóstico con soporte técnico.`;
  }
  return `Solicitar modelo exacto, síntoma principal y contexto del daño antes de comprometer tiempos o diagnóstico.`;
}

function buildMistakeToAvoid(
  category: string,
  risk: RiesgoCliente,
  annoyance: NivelMolestia,
  objections: string[],
) {
  const normalizedCategory = normalize(category);

  if (normalizedCategory.includes("humedad")) {
    return "No prometer recuperación, encendido ni conservación de datos antes del diagnóstico técnico.";
  }
  if (objections.includes("Condición comercial")) {
    return "No responder de inmediato con concesiones; primero explicar diagnóstico, garantía y calidad del proceso.";
  }
  if (annoyance === "Alto" || risk === "Rojo") {
    return "No responder de forma defensiva ni culpar al cliente; reconocer la molestia y escalar con prioridad.";
  }
  if (normalizedCategory.includes("garantia")) {
    return "No confirmar cobertura sin revisar la orden, fecha, alcance y causa actual de la falla.";
  }
  return "No inventar diagnóstico ni tiempo de entrega; pedir el dato faltante y validar con soporte técnico.";
}

function buildAdvisorModules({
  categoria,
  riesgoCliente,
  nivelOportunidadVenta,
  probabilidadCierre,
  objecionesDetectadas,
  nivelMolestia,
  casosSimilares,
  tipoDanioMasFrecuente,
}: {
  categoria: string;
  riesgoCliente: RiesgoCliente;
  nivelOportunidadVenta: OportunidadVenta;
  probabilidadCierre: ProbabilidadCierre;
  objecionesDetectadas: string[];
  nivelMolestia: NivelMolestia;
  casosSimilares: number;
  tipoDanioMasFrecuente: string;
}) {
  const objections = objecionesDetectadas.join(", ");

  return {
    detectorVentas:
      nivelOportunidadVenta === "Alta"
        ? "Hay intención comercial. Llevar al cliente a diagnóstico, cotización o agendamiento."
        : "Intención comercial moderada. Aclarar necesidad antes de vender.",
    detectorObjeciones: `Objeciones detectadas: ${objections}. Responder con seguridad y siguiente paso.`,
    detectorClientesMolestos:
      nivelMolestia === "Alto"
        ? "Cliente sensible. Bajar tensión antes de vender y usar lenguaje de control y prioridad."
        : "Molestia manejable. Mantener tono claro, rápido y consultivo.",
    entrenadorAsesores:
      "Guiar la conversación con tres pasos: reconocer el caso, pedir dato faltante y proponer siguiente acción.",
    asistenteTecnico: `Cruzar el mensaje con casos de ${tipoDanioMasFrecuente}. Evitar diagnóstico definitivo sin revisión.`,
    seguimientoInteligente:
      riesgoCliente === "Rojo"
        ? "Programar seguimiento corto y dejar responsable interno definido."
        : "Hacer seguimiento si el cliente no responde después de la recomendación inicial.",
    centroConocimientoVivo: `${casosSimilares} casos similares disponibles para orientar el manejo del asesor.`,
    recomendacionesCierre:
      probabilidadCierre === "Alta"
        ? "Cerrar con una acción concreta: traer el equipo, aprobar diagnóstico o confirmar disponibilidad."
        : "Construir confianza antes de cerrar; explicar proceso y reducir incertidumbre.",
    probabilidadCierre: `Probabilidad ${probabilidadCierre}. Ajustar presión comercial según emoción y objeciones.`,
    erroresEvitar: buildMistakeToAvoid(categoria, riesgoCliente, nivelMolestia, objecionesDetectadas),
  };
}

function toVisibleRepairCase(repair: SimilarRepairCase): SimilarRepairCase {
  return {
    id: repair.id,
    marca: repair.marca,
    modelo: repair.modelo,
    tipoDanio: repair.tipoDanio,
    descripcion: repair.descripcion,
    estado: repair.estado,
    garantia: repair.garantia,
    tecnico: "",
    fechaCreacion: repair.fechaCreacion,
    fechaEntrega: repair.fechaEntrega,
    fuenteTrafico: repair.fuenteTrafico,
    diasEnProceso: repair.diasEnProceso,
    score: repair.score,
  };
}

function mostFrequent(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function uniqueByNormalized(values: string[]) {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(value);
  }

  return items;
}
