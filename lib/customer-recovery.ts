import repairKnowledge from "@/data/repair-knowledge.json";
import { sanitizeAnalysisOutput } from "./sanitize";
import type {
  AbandonmentRisk,
  RecoveryBucket,
  RecoveryDashboard,
  RecoveryLead,
  RecoveryProbability,
  RepairCase,
  RepairKnowledge,
} from "./repair-types";

const knowledge = repairKnowledge as RepairKnowledge;

export function getCustomerRecoveryDashboard(): RecoveryDashboard {
  const recoverable = knowledge.repairs
    .filter(isPotentiallyLost)
    .map(toRecoveryLead)
    .sort((a, b) => b.valorPotencialPerdido - a.valorPotencialPerdido);

  const clientesRecuperables = recoverable
    .filter((lead) => lead.probabilidadRecuperacion !== "Baja")
    .slice(0, 12);

  const ventasEnRiesgo = recoverable
    .filter((lead) => lead.riesgoAbandono === "Alto")
    .slice(0, 12);

  const seguimientosPendientes = recoverable
    .filter((lead) => lead.bucket === "24 horas" || lead.bucket === "3 días")
    .slice(0, 12);

  const dashboard: RecoveryDashboard = {
    dineroPotencialRecuperable: recoverable.reduce(
      (total, lead) => total + lead.valorPotencialPerdido,
      0,
    ),
    clientesSinSeguimiento: recoverable.length,
    conversacionesAbandonadas: recoverable.filter(
      (lead) => lead.bucket === "7 días" || lead.bucket === "15 días",
    ).length,
    clientesRecuperables,
    ventasEnRiesgo,
    seguimientosPendientes,
    buckets: {
      "24 horas": countByBucket(recoverable, "24 horas"),
      "3 días": countByBucket(recoverable, "3 días"),
      "7 días": countByBucket(recoverable, "7 días"),
      "15 días": countByBucket(recoverable, "15 días"),
    },
  };

  return sanitizeAnalysisOutput(dashboard);
}

function isPotentiallyLost(repair: RepairCase) {
  const status = normalize(repair.estado);
  const payment = normalize(repair.estadoPago || "");
  const days = repair.diasEnProceso || 0;

  if (days < 1) return false;
  if (status === "delivered" && payment === "paid" && (repair.saldoPendiente || 0) <= 0) {
    return false;
  }

  return (
    status !== "delivered" ||
    payment !== "paid" ||
    (repair.saldoPendiente || 0) > 0 ||
    (repair.valorVenta || 0) === 0
  );
}

function toRecoveryLead(repair: RepairCase): RecoveryLead {
  const diasSinRespuesta = repair.diasEnProceso || 0;
  const bucket = getBucket(diasSinRespuesta);
  const valorPotencialPerdido = estimatePotentialValue(repair);
  const riesgoAbandono = getAbandonmentRisk(diasSinRespuesta, repair);
  const probabilidadRecuperacion = getRecoveryProbability(
    diasSinRespuesta,
    repair,
    valorPotencialPerdido,
  );
  const motivo = buildReason(repair, diasSinRespuesta);

  return {
    id: repair.id,
    modelo: repair.modelo || "Modelo sin registrar",
    tipoDanio: repair.tipoDanio || "Revisión general",
    estado: repair.estado || "sin estado",
    bucket,
    diasSinRespuesta,
    valorPotencialPerdido,
    probabilidadRecuperacion,
    riesgoAbandono,
    motivo,
    mensajes: buildRecoveryMessages(repair),
  };
}

function getBucket(days: number): RecoveryBucket {
  if (days >= 15) return "15 días";
  if (days >= 7) return "7 días";
  if (days >= 3) return "3 días";
  return "24 horas";
}

function estimatePotentialValue(repair: RepairCase) {
  if ((repair.saldoPendiente || 0) > 0) return Math.round(repair.saldoPendiente || 0);
  if ((repair.valorVenta || 0) > 0) return Math.round(repair.valorVenta || 0);

  const damage = canonicalDamage(repair.tipoDanio || repair.descripcion || "");
  const average = averageSaleByDamage(damage);
  return Math.round(average || fallbackValueByDamage(damage));
}

function averageSaleByDamage(damage: string) {
  const matches = knowledge.repairs.filter((repair) => {
    return (
      canonicalDamage(repair.tipoDanio || repair.descripcion || "") === damage &&
      (repair.valorVenta || 0) > 0
    );
  });

  if (!matches.length) return 0;

  return (
    matches.reduce((total, repair) => total + (repair.valorVenta || 0), 0) /
    matches.length
  );
}

function fallbackValueByDamage(damage: string) {
  const values: Record<string, number> = {
    Humedad: 360000,
    Pantalla: 520000,
    Bateria: 240000,
    "No prende": 320000,
    Software: 90000,
    "Revisión general": 180000,
  };

  return values[damage] || 220000;
}

function getRecoveryProbability(
  days: number,
  repair: RepairCase,
  value: number,
): RecoveryProbability {
  const status = normalize(repair.estado);
  const source = normalize(repair.fuenteTrafico || "");
  const candidates: RecoveryProbability[] = [];

  if (days <= 3) candidates.push("Alta");
  if (days <= 7) candidates.push("Media");
  if (status === "return") candidates.push("Baja");
  if (source.includes("instagram") || source.includes("recomendado")) candidates.push("Media");
  if (value >= 400000 && days <= 15) candidates.push("Alta");

  return candidates.sort((a, b) => probabilityWeight(b) - probabilityWeight(a))[0] || "Media";
}

function getAbandonmentRisk(days: number, repair: RepairCase): AbandonmentRisk {
  const status = normalize(repair.estado);

  if (days >= 15 || status === "return") return "Alto";
  if (days >= 7) return "Medio";
  return "Bajo";
}

function buildReason(repair: RepairCase, days: number) {
  if ((repair.saldoPendiente || 0) > 0) {
    return "Tiene saldo pendiente y requiere cierre comercial.";
  }
  if (normalize(repair.estado) === "return") {
    return "Caso devuelto o perdido que puede recuperarse con seguimiento consultivo.";
  }
  if ((repair.valorVenta || 0) === 0) {
    return "Oportunidad sin venta registrada.";
  }
  return `Sin seguimiento efectivo durante ${days} días.`;
}

function buildRecoveryMessages(repair: RepairCase) {
  const model = repair.modelo || "tu equipo";
  const damage = canonicalDamage(repair.tipoDanio || repair.descripcion || "revisión");
  return {
    suave: `Hola, seguimos atentos al caso de ${model}. Si quieres, retomamos la revisión y te confirmamos el siguiente paso sin compromiso.`,
    comercial: `Podemos ayudarte a resolver el caso de ${model} por ${damage}. Tenemos historial de casos similares y podemos orientarte para tomar una buena decisión.`,
    urgente: `Antes de cerrar el seguimiento de ${model}, te recomendamos retomarlo hoy. Podemos validar el estado del caso y evitar que la falla avance.`,
  };
}

function canonicalDamage(value: string) {
  const normalizedValue = normalize(value);
  if (/(humedad|mojo|mojado|agua|liquido|se mojo)/.test(normalizedValue)) return "Humedad";
  if (/(pantalla|display|golpe|vidrio|tactil)/.test(normalizedValue)) return "Pantalla";
  if (/(bateria|carga|descarga|apaga)/.test(normalizedValue)) return "Bateria";
  if (/(no prende|no enciende|boot|corto)/.test(normalizedValue)) return "No prende";
  if (/(software|actualizacion|bloqueado|restaurar)/.test(normalizedValue)) return "Software";
  return "Revisión general";
}

function countByBucket(leads: RecoveryLead[], bucket: RecoveryBucket) {
  return leads.filter((lead) => lead.bucket === bucket).length;
}

function probabilityWeight(probability: RecoveryProbability) {
  return { Baja: 1, Media: 2, Alta: 3 }[probability];
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
