import type { OportunidadVenta, RiesgoCliente } from "./repair-types";

type BusinessRule = {
  id: string;
  keywords: string[];
  categoria: string;
  riesgo: RiesgoCliente;
  oportunidad: OportunidadVenta;
  tiempoRespuesta: string;
  respuesta: string;
  consejo: string;
};

export const businessRules: BusinessRule[] = [
  {
    id: "humidity-diagnosis-first",
    keywords: ["humedad", "mojo", "mojó", "agua", "liquido", "líquido"],
    categoria: "Humedad",
    riesgo: "Rojo" satisfies RiesgoCliente,
    oportunidad: "Alta" satisfies OportunidadVenta,
    tiempoRespuesta: "10-15 min",
    respuesta:
      "Gracias por contarnos. Cuando un equipo tiene contacto con líquido, lo más seguro es revisarlo en laboratorio antes de prometer recuperación o encendido.",
    consejo: "No prometer recuperación antes del diagnóstico. Indicar revisión prioritaria y evitar encender o cargar el equipo.",
  },
  {
    id: "screen-impact",
    keywords: ["pantalla", "display", "golpe", "vidrio", "tactil", "táctil"],
    categoria: "Pantalla",
    riesgo: "Amarillo" satisfies RiesgoCliente,
    oportunidad: "Alta" satisfies OportunidadVenta,
    tiempoRespuesta: "5-10 min",
    respuesta:
      "Podemos ayudarte con la revisión de pantalla. Para orientarte con precisión necesitamos confirmar el modelo exacto y si el táctil o la imagen presentan fallas.",
    consejo: "Validar modelo y tipo de pantalla antes de orientar el caso. Si hubo golpe, recomendar diagnóstico completo.",
  },
  {
    id: "battery-performance",
    keywords: ["bateria", "batería", "carga", "descarga", "se apaga"],
    categoria: "Batería",
    riesgo: "Verde" satisfies RiesgoCliente,
    oportunidad: "Media" satisfies OportunidadVenta,
    tiempoRespuesta: "5 min",
    respuesta:
      "Podemos revisar el estado de batería y confirmar disponibilidad según el modelo del equipo.",
    consejo: "Confirmar modelo, porcentaje de salud y disponibilidad antes de prometer repuesto original.",
  },
  {
    id: "warranty-care",
    keywords: ["garantia", "garantía", "fallo otra vez", "volvio", "volvió"],
    categoria: "Garantía",
    riesgo: "Rojo" satisfies RiesgoCliente,
    oportunidad: "Baja" satisfies OportunidadVenta,
    tiempoRespuesta: "10 min",
    respuesta:
      "Permítenos revisar el caso y validar si la falla está relacionada con la reparación realizada.",
    consejo: "No confirmar cobertura hasta revisar orden, fecha de garantía y causa real de la falla.",
  },
  {
    id: "repair-status",
    keywords: ["estado", "como va", "cómo va", "cuando esta", "cuándo está", "pa cuando"],
    categoria: "Seguimiento",
    riesgo: "Amarillo" satisfies RiesgoCliente,
    oportunidad: "Baja" satisfies OportunidadVenta,
    tiempoRespuesta: "5 min",
    respuesta:
      "Vamos a validar el estado actual del equipo con el área técnica y te compartimos una actualización clara.",
    consejo: "Nunca inventar estados. Confirmar internamente antes de responder al cliente.",
  },
];
