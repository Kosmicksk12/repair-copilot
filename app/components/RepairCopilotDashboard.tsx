"use client";

import { useMemo, useState } from "react";
import type {
  AnalyzeResult,
  RiesgoCliente,
} from "@/lib/repair-types";

const navigation = [
  "Dashboard",
  "Copiloto de asesores",
  "Centro de conocimiento",
];

const starterMessage = "Cliente dice que tiene dudas y que su iPhone 12 se mojó. Quiere saber si se puede salvar hoy.";

export default function RepairCopilotDashboard({
  initialMessage,
  initialResult,
}: {
  initialMessage?: string;
  initialResult: AnalyzeResult | null;
}) {
  const [message, setMessage] = useState(initialMessage || starterMessage);
  const [result, setResult] = useState<AnalyzeResult | null>(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const characterCount = useMemo(() => message.length, [message]);

  async function handleAnalyze(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!message.trim()) {
      setError("Pega un mensaje del cliente para analizarlo.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoCliente: message }),
      });

      if (!response.ok) {
        throw new Error("No se pudo analizar el mensaje.");
      }

      setResult((await response.json()) as AnalyzeResult);
    } catch {
      setError("Hubo un problema al consultar la API interna.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <Topbar />
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
              <section className="space-y-6">
                <div className="rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,0.04)] sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Copiloto comercial para asesores de reparación
                      </div>
                      <h1 className="text-4xl font-semibold tracking-[-0.045em] text-zinc-950 sm:text-5xl">
                        RepairCopilot AI
                      </h1>
                      <p className="mt-3 max-w-xl text-base leading-7 text-zinc-500">
                        No responde por el asesor: detecta riesgos, objeciones, oportunidades y el mejor siguiente paso.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-center">
                      <MiniStat label="Historial" value={result?.fuentes.historial ?? 801} />
                      <MiniStat label="Motor" value="Local" />
                      <MiniStat label="OpenAI" value="Ready" />
                    </div>
                  </div>

                  <form className="mt-8" action="/" method="get" onSubmit={handleAnalyze}>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <label htmlFor="customer-message" className="text-sm font-medium text-zinc-800">
                        Mensaje del cliente
                      </label>
                      <span className="text-xs text-zinc-400">{characterCount} / 2.000</span>
                    </div>
                    <textarea
                      id="customer-message"
                      name="textoCliente"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={8}
                      placeholder="Pega aquí el mensaje del cliente..."
                      className="w-full resize-none rounded-2xl border border-zinc-200 bg-[#fbfbfa] px-4 py-4 text-sm leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
                    />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-zinc-500">
                        Ejemplo: <button type="button" onClick={() => setMessage(starterMessage)} className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4">cliente con humedad y objeción comercial</button>
                      </p>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {isLoading ? "Analizando..." : "Analizar"}
                      </button>
                    </div>
                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                  </form>
                </div>
                <ResultsGrid result={result} />
              </section>
              <aside className="space-y-6">
                <KnowledgePanel result={result} />
                <SimilarCases result={result} />
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200/80 bg-[#fbfbfa] px-4 py-5 lg:block">
      <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
        <LogoMark />
        <div>
          <p className="text-sm font-semibold tracking-tight">RepairCopilot AI</p>
          <p className="text-xs text-zinc-500">Repair intelligence</p>
        </div>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Navegación principal">
        {navigation.map((item) => {
          const active = item === "Copiloto de asesores";
          return (
            <a
              href="#"
              key={item}
              className={
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition " +
                (active
                  ? "bg-white font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                  : "text-zinc-500 hover:bg-white hover:text-zinc-900")
              }
            >
              <span>{item}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />}
            </a>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Dataset</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">801</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Reparaciones normalizadas desde el historial de Oliphone.</p>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[#f7f7f5]/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <LogoMark />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">RepairCopilot AI</p>
            <p className="text-xs text-zinc-500">Copiloto de asesores</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Estado del sistema: operativo
        </div>
      </div>
    </header>
  );
}

function ResultsGrid({ result }: { result: AnalyzeResult | null }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <TextCard className="md:col-span-2 2xl:col-span-3" label="Recomendación del copiloto" value={result?.recomendacionAsesor ?? "Analiza un mensaje para recibir una recomendación de manejo comercial y técnico."} />
      <TextCard label="Próxima acción" value={result?.modulos.seguimientoInteligente ?? "Analiza un mensaje para definir el siguiente paso."} />
      <TextCard className="md:col-span-2" label="Respuesta sugerida" value={result?.respuestaSugerida ?? "La respuesta será una guía; el objetivo es ayudar al asesor a decidir y evitar errores."} />
      <MetricCard label="Categoría" value={result?.categoria ?? "Pendiente"} helper="Contexto del caso" />
      <MetricCard label="Emoción" value={result?.emocion ?? "Pendiente"} helper="Lectura emocional" />
      <RiskCard risk={result?.riesgoCliente ?? "Verde"} />
      <MetricCard label="Objeciones detectadas" value={result?.objecionesDetectadas.join(", ") ?? "Pendiente"} helper="Barreras para cerrar" />
      <MetricCard label="Probabilidad de cierre" value={result?.probabilidadCierre ?? "Pendiente"} helper="Presión comercial recomendada" />
    </section>
  );
}

function KnowledgePanel({ result }: { result: AnalyzeResult | null }) {
  const confidence = result?.casosSimilares
    ? result.casosSimilares >= 10
      ? "Alta"
      : result.casosSimilares >= 3
        ? "Media"
        : "Baja"
    : "Pendiente";

  return (
    <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Módulo de conocimiento</h2>
          <p className="mt-1 text-xs text-zinc-500">Historial de reparaciones</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
          {result?.casosSimilares ?? 0}
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        <KnowledgeItem label="Casos similares" value={String(result?.casosSimilares ?? 0)} />
        <KnowledgeItem label="Nivel de confianza" value={confidence} />
        <KnowledgeItem label="Complejidad" value={result?.riesgoCliente ?? "Pendiente"} />
        <KnowledgeItem
          label="Recomendación técnica"
          value={result?.modulos.asistenteTecnico ?? "Analiza un mensaje para ver la recomendación técnica."}
        />
      </div>
    </section>
  );
}

function KnowledgeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-[#fbfbfa] p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-800">{value}</p>
    </div>
  );
}

function SimilarCases({ result }: { result: AnalyzeResult | null }) {
  return (
    <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
      <h2 className="text-sm font-semibold text-zinc-950">Casos reales para decidir</h2>
      <div className="mt-4 space-y-3">
        {(result?.casos ?? []).length > 0 ? (
          result?.casos.map((repair) => (
            <article key={repair.id} className="rounded-2xl border border-zinc-200 bg-[#fbfbfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900">{repair.modelo || "Modelo no registrado"}</p>
                <span className="text-xs text-zinc-400">{repair.id}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{repair.tipoDanio || "Sin daño registrado"} · {repair.estado}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-600">{repair.descripcion || "Sin descripción"}</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-[#fbfbfa] p-6 text-sm leading-6 text-zinc-500">
            Analiza un mensaje para ver reparaciones similares del historial.
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-2 text-xs text-zinc-400">{helper}</p>
    </article>
  );
}

function RiskCard({ risk }: { risk: RiesgoCliente }) {
  const color = {
    Verde: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Amarillo: "bg-amber-50 text-amber-700 ring-amber-200",
    Rojo: "bg-red-50 text-red-700 ring-red-200",
  }[risk];
  return (
    <article className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
      <p className="text-xs font-medium text-zinc-500">Riesgo del cliente</p>
      <div className="mt-3 flex items-center gap-2">
        {(["Verde", "Amarillo", "Rojo"] as RiesgoCliente[]).map((item) => (
          <span
            key={item}
            className={
              "rounded-full px-2.5 py-1 text-xs font-medium ring-1 " +
              (item === risk ? color : "bg-zinc-50 text-zinc-400 ring-zinc-200")
            }
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-400">Prioridad de atención y cuidado comercial.</p>
    </article>
  );
}

function TextCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <article className={"rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)] " + className}>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-3 text-sm leading-7 text-zinc-700">{value}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-20 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-200/70">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.7 2.7-4-4 2.7-2.7Z" />
        <path d="m4 16 4 4" />
      </svg>
    </div>
  );
}
