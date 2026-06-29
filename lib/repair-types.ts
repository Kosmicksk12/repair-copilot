export type RiesgoCliente = "Verde" | "Amarillo" | "Rojo";
export type OportunidadVenta = "Baja" | "Media" | "Alta";
export type ProbabilidadCierre = "Baja" | "Media" | "Alta";
export type NivelMolestia = "Bajo" | "Medio" | "Alto";

export type RepairCase = {
  id: string;
  marca: string;
  modelo: string;
  tipoDanio: string;
  descripcion: string;
  estado: string;
  garantia: string;
  tecnico: string;
  fechaCreacion?: string;
  fechaEntrega?: string;
  fuenteTrafico?: string;
  valorVenta?: number;
  saldoPendiente?: number;
  estadoPago?: string;
  diasEnProceso?: number;
};

export type RepairKnowledge = {
  generatedAt: string;
  source: string;
  totalRepairs: number;
  repairs: RepairCase[];
};

export type SimilarRepairCase = RepairCase & {
  score: number;
};

export type RecoveryBucket = "24 horas" | "3 días" | "7 días" | "15 días";
export type RecoveryProbability = "Baja" | "Media" | "Alta";
export type AbandonmentRisk = "Bajo" | "Medio" | "Alto";

export type RecoveryLead = {
  id: string;
  modelo: string;
  tipoDanio: string;
  estado: string;
  bucket: RecoveryBucket;
  diasSinRespuesta: number;
  valorPotencialPerdido: number;
  probabilidadRecuperacion: RecoveryProbability;
  riesgoAbandono: AbandonmentRisk;
  motivo: string;
  mensajes: {
    suave: string;
    comercial: string;
    urgente: string;
  };
};

export type RecoveryDashboard = {
  dineroPotencialRecuperable: number;
  clientesSinSeguimiento: number;
  conversacionesAbandonadas: number;
  clientesRecuperables: RecoveryLead[];
  ventasEnRiesgo: RecoveryLead[];
  seguimientosPendientes: RecoveryLead[];
  buckets: Record<RecoveryBucket, number>;
};

export type AnalyzeResult = {
  input: string;
  categoria: string;
  estadoEmocional: string;
  emocion: string;
  riesgoCliente: RiesgoCliente;
  nivelOportunidadVenta: OportunidadVenta;
  probabilidadCierre: ProbabilidadCierre;
  objecionesDetectadas: string[];
  nivelMolestia: NivelMolestia;
  tiempoEstimadoRespuesta: string;
  casosSimilares: number;
  modelosRelacionados: string[];
  tipoDanioMasFrecuente: string;
  respuestaSugerida: string;
  recomendacionAsesor: string;
  errorNoCometer: string;
  modulos: {
    detectorVentas: string;
    detectorObjeciones: string;
    detectorClientesMolestos: string;
    entrenadorAsesores: string;
    asistenteTecnico: string;
    seguimientoInteligente: string;
    centroConocimientoVivo: string;
    recomendacionesCierre: string;
    probabilidadCierre: string;
    erroresEvitar: string;
  };
  casos: SimilarRepairCase[];
  fuentes: {
    faq: string[];
    historial: number;
    reglasNegocio: string[];
    motor: "local-rules";
    openAIReady: boolean;
  };
};
