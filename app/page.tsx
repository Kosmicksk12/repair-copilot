const Icon = ({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const navItems = [
  {
    label: "Analizar mensaje",
    icon: (
      <Icon>
        <path d="M12 3 9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3Z" />
      </Icon>
    ),
  },
  {
    label: "Historial",
    icon: (
      <Icon>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </Icon>
    ),
  },
  {
    label: "Respuestas guardadas",
    icon: (
      <Icon>
        <path d="M5 4.8A1.8 1.8 0 0 1 6.8 3H19v16H6.8A1.8 1.8 0 0 0 5 20.8V4.8Z" />
        <path d="M5 19V5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14" />
      </Icon>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Icon className="h-6 w-6">
                <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.7 2.7-4-4 2.7-2.7Z" />
                <path d="m4 16 4 4" />
              </Icon>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">RepairCopilot</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">AI Assistant</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2" aria-label="Navegación principal">
            {navItems.map((item, index) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  index === 0
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-950 p-5 text-white">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-5 w-5">
                <path d="M12 3 9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3Z" />
              </Icon>
            </div>
            <p className="text-sm font-semibold">Trabaja con más claridad</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Respuestas precisas y empáticas para cada cliente.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur md:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Icon className="h-5 w-5">
                  <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.7 2.7-4-4 2.7-2.7Z" />
                </Icon>
              </div>
              <span className="font-bold tracking-tight">RepairCopilot AI</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sistema operativo
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notificaciones"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                <Icon className="h-5 w-5">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </Icon>
              </button>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white text-sm font-bold text-indigo-700">
                  AM
                </div>
              </div>
            </div>
          </header>

          <div className="px-5 py-10 md:px-10 md:py-12 xl:px-14">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Inteligencia de servicio
                </div>
                <h1 className="text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  RepairCopilot AI
                </h1>
                <p className="mt-3 text-lg text-slate-500">
                  Asistente para asesores de reparación
                </p>
              </div>

              <section className="mt-9 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)] sm:p-7">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <label htmlFor="customer-message" className="text-sm font-bold text-slate-800">
                    Mensaje del cliente
                  </label>
                  <span className="text-xs font-medium text-slate-400">0 / 2.000 caracteres</span>
                </div>
                <textarea
                  id="customer-message"
                  rows={7}
                  placeholder="Pega aquí el mensaje del cliente..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-[15px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
                <div className="mt-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <Icon className="h-4 w-4">
                      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                      <path d="M12 16v-4M12 8h.01" />
                    </Icon>
                    La IA identificará intención, tono y prioridad.
                  </p>
                  <button
                    type="button"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl sm:w-auto"
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:rotate-12">
                      <path d="M12 3 9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3Z" />
                    </Icon>
                    Analizar
                  </button>
                </div>
              </section>

              <div className="mt-10 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Análisis del mensaje</h2>
                  <p className="mt-1 text-sm text-slate-500">Los resultados aparecerán aquí.</p>
                </div>
                <span className="hidden rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-500 sm:block">
                  Pendiente de análisis
                </span>
              </div>

              <section className="mt-5 grid gap-4 md:grid-cols-2">
                <ResultCard
                  title="Categoría"
                  description="Tipo de solicitud o problema detectado."
                  color="indigo"
                  icon={
                    <Icon>
                      <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M8 12h8M12 8v8" />
                    </Icon>
                  }
                />
                <ResultCard
                  title="Estado emocional"
                  description="Tono y nivel de satisfacción del cliente."
                  color="amber"
                  icon={
                    <Icon>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8.5 14.5c1.8 1.7 5.2 1.7 7 0M9 9h.01M15 9h.01" />
                    </Icon>
                  }
                />
                <ResultCard
                  title="Respuesta sugerida"
                  description="Una respuesta clara, profesional y empática."
                  color="emerald"
                  large
                  icon={
                    <Icon>
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                      <path d="M8 9h8M8 13h5" />
                    </Icon>
                  }
                />
                <ResultCard
                  title="Consejo para asesor"
                  description="Recomendaciones prácticas para manejar el caso."
                  color="violet"
                  large
                  icon={
                    <Icon>
                      <path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.7-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.8-1.5-2.5Z" />
                    </Icon>
                  }
                />
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultCard({
  title,
  description,
  icon,
  color,
  large = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "indigo" | "amber" | "emerald" | "violet";
  large?: boolean;
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <article
      className={`group rounded-2xl border border-slate-200/90 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 ${
        large ? "min-h-44" : "min-h-36"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 h-2.5 w-3/4 rounded-full bg-slate-100" />
      {large && <div className="mt-2.5 h-2.5 w-1/2 rounded-full bg-slate-100" />}
    </article>
  );
}
