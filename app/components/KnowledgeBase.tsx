"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format-currency";

const kbCategories = ["FAQ", "Garantías", "Tiempos", "Reglas comerciales", "Procedimientos"] as const;

type KbCategory = (typeof kbCategories)[number];

type Article = {
  id: string;
  title: string;
  category: KbCategory;
  content: string;
  tags: string;
};

const categoryIcons: Record<KbCategory, string> = {
  FAQ: "❓",
  Garantías: "🛡️",
  Tiempos: "⏱️",
  "Reglas comerciales": "📊",
  Procedimientos: "📋",
};

const emptyArticle: Omit<Article, "id"> = {
  title: "",
  category: "FAQ",
  content: "",
  tags: "",
};

const initialArticles: Article[] = [
  {
    id: "1",
    title: "¿Cuánto tarda un cambio de pantalla?",
    category: "Tiempos",
    content:
      "Un cambio de pantalla estándar tarda entre 30 minutos y 1 hora dependiendo del modelo. iPhones suelen tardar 45 min. Samsung entre 30-60 min. Modelos complejos pueden tardar hasta 2 horas.",
    tags: "pantalla,tiempo,reparación,cambio",
  },
  {
    id: "2",
    title: "¿Cuánto tarda un cambio de batería?",
    category: "Tiempos",
    content:
      "Un cambio de batería tarda entre 20 y 40 minutos. Es una reparación rápida y el cliente puede esperar.",
    tags: "batería,tiempo,reparación",
  },
  {
    id: "3",
    title: "Política de garantía en pantallas",
    category: "Garantías",
    content:
      "Las pantallas tienen 90 días de garantía contra defectos de fabricación. NO cubre daños por caídas, golpes o líquidos. La garantía se invalida si el equipo presenta daño físico posterior a la reparación.",
    tags: "garantía,pantalla,política",
  },
  {
    id: "4",
    title: "Política de garantía en baterías",
    category: "Garantías",
    content:
      "Las baterías tienen 60 días de garantía. Cubre defectos de fabricación y rendimiento inferior al 80% de capacidad. NO cubre daño por uso de cargadores no certificados.",
    tags: "garantía,batería,política",
  },
  {
    id: "5",
    title: "¿Cómo manejar un cliente molesto?",
    category: "FAQ",
    content:
      "1. Escuchar sin interrumpir. 2. Validar su frustración: 'Entiendo su molestia'. 3. Ofrecer solución concreta. 4. Si aplica garantía, procesarla inmediatamente. 5. Si no aplica, explicar con respeto y ofrecer descuento en la nueva reparación. 6. Nunca discutir ni elevar el tono.",
    tags: "cliente,molesto,queja,atención",
  },
  {
    id: "6",
    title: "Reglas de descuento",
    category: "Reglas comerciales",
    content:
      "Descuento máximo autorizado sin aprobación del gerente: 10%. En combo pantalla + vidrio templado: 15% de descuento. En reparaciones recurrentes del mismo cliente: ofrecer 10% en la segunda visita. NUNCA dar descuento en accesorios sueltos sin combo.",
    tags: "descuento,precio,reglas,comercial",
  },
  {
    id: "7",
    title: "Ventas adicionales recomendadas",
    category: "Reglas comerciales",
    content:
      "Siempre ofrecer: 1. Vidrio templado después de cambio de pantalla. 2. Forro protector si el cliente no tiene. 3. Cambio de batería si el equipo tiene más de 2 años. 4. Cable o cargador si el cliente menciona problemas de carga. El combo pantalla + vidrio + forro tiene 15% de descuento.",
    tags: "venta,adicional,upsell,combo",
  },
  {
    id: "8",
    title: "Procedimiento de recepción de equipo",
    category: "Procedimientos",
    content:
      "1. Registrar nombre y teléfono del cliente. 2. Anotar modelo y IMEI del equipo. 3. Fotografiar el estado del equipo. 4. Describir el problema reportado. 5. Informar tiempo estimado y costo. 6. Solicitar firma del cliente en la orden.",
    tags: "recepción,equipo,procedimiento,orden",
  },
  {
    id: "9",
    title: "¿Se puede reparar un celular mojado?",
    category: "FAQ",
    content:
      `Sí, pero no garantizamos el resultado. Se realiza limpieza ultrasónica y secado. Costo de diagnóstico: ${formatCurrency(30000)}. Si requiere cambio de placa o componentes, se cotiza por separado. Tiempo: 24-48 horas mínimo.`,
    tags: "mojado,agua,líquido,daño",
  },
  {
    id: "10",
    title: "Horario de atención",
    category: "FAQ",
    content:
      "Lunes a viernes: 9:00 AM - 7:00 PM. Sábados: 9:00 AM - 5:00 PM. Domingos y festivos: Cerrado. Se reciben equipos hasta 1 hora antes del cierre.",
    tags: "horario,atención,hora",
  },
];

export default function KnowledgeBase() {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"Todos" | KbCategory>("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [form, setForm] = useState(emptyArticle);

  const filtered = articles.filter((a) => {
    const matchCategory = activeCategory === "Todos" || a.category === activeCategory;
    const matchSearch =
      !search ||
      `${a.title} ${a.content} ${a.tags}`.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openNew = () => {
    setEditArticle(null);
    setForm(emptyArticle);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditArticle(article);
    setForm({
      title: article.title,
      category: article.category,
      content: article.content,
      tags: article.tags,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;

    if (editArticle) {
      setArticles((prev) =>
        prev.map((a) => (a.id === editArticle.id ? { ...a, ...form } : a)),
      );
    } else {
      setArticles((prev) => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Base de conocimiento</h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          + Nuevo artículo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Buscar artículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm flex-1 rounded-xl border border-zinc-200 bg-[#fbfbfa] px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
          />
          <div className="flex flex-wrap gap-1.5">
            {(["Todos", ...kbCategories] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                  (activeCategory === c
                    ? "bg-zinc-950 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900")
                }
              >
                {c !== "Todos" && <span className="mr-1">{categoryIcons[c as KbCategory]}</span>}
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">📖</p>
            <p className="mt-3 text-sm text-zinc-500">No se encontraron artículos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((a) => (
              <article
                key={a.id}
                className="group rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)] transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[a.category]}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {a.category}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">{a.title}</h3>
                <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500">{a.content}</p>
                {a.tags && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.tags.split(",").map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-semibold text-zinc-950">
              {editArticle ? "Editar artículo" : "Nuevo artículo"}
            </h3>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Título o pregunta"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as KbCategory })}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              >
                {kbCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Contenido o respuesta..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
              <input
                placeholder="Tags (separados por coma)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  {editArticle ? "Guardar" : "Crear artículo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
