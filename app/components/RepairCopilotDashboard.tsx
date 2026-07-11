"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import KnowledgeBase from "./KnowledgeBase";
import ServiceOrdersModule from "./service-orders/ServiceOrdersModule";
import { ChatLayout } from "./copilot";
import { formatCurrency } from "@/lib/format-currency";
import type { InventoryProduct } from "@/lib/inventory-types";
import type { ServiceOrder } from "@/lib/service-order-types";
import type { MonthlySalesSummary } from "@/lib/sales-types";

const navigation = [
  "Dashboard",
  "Copiloto de asesores",
  "Órdenes de servicio",
  "Centro de conocimiento",
] as const;

type View = (typeof navigation)[number];

type RepairCopilotDashboardProps = {
  initialDashboardData: DashboardData;
};

export default function RepairCopilotDashboard({ initialDashboardData }: RepairCopilotDashboardProps) {
  const [activeView, setActiveView] = useState<View>("Copiloto de asesores");

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <section className="min-w-0 flex-1">
          <Topbar activeView={activeView} />
          {activeView === "Centro de conocimiento" ? (
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)] m-4 sm:m-6 lg:m-8 min-h-[calc(100vh-8rem)]">
              <KnowledgeBase />
            </div>
          ) : activeView === "Órdenes de servicio" ? (
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)] m-4 sm:m-6 lg:m-8 min-h-[calc(100vh-8rem)]">
              <ServiceOrdersModule />
            </div>
          ) : activeView === "Dashboard" ? (
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <PerformanceDashboard initialData={initialDashboardData} />
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-65px)] min-h-[560px]">
              <ChatLayout />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
}) {
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
          const active = item === activeView;
          return (
            <button
              type="button"
              key={item}
              onClick={() => onNavigate(item)}
              className={
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition " +
                (active
                  ? "bg-white font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                  : "text-zinc-500 hover:bg-white hover:text-zinc-900")
              }
            >
              <span>{item}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />}
            </button>
          );
        })}
        <Link
          href="/inventario"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-white hover:text-zinc-900"
        >
          <span>Inventario</span>
        </Link>
        <Link
          href="/clientes"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-white hover:text-zinc-900"
        >
          <span>Clientes</span>
        </Link>
      </nav>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Dataset</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">801</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Reparaciones normalizadas desde el historial de Oliphone.</p>
      </div>
    </aside>
  );
}

const viewSubtitles: Record<View, string> = {
  Dashboard: "Resumen general",
  "Copiloto de asesores": "Copiloto de asesores",
  "Órdenes de servicio": "Fixit Phone · Órdenes y garantías",
  "Centro de conocimiento": "Base de conocimiento",
};

function Topbar({ activeView }: { activeView: View }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[#f7f7f5]/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <LogoMark />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">RepairCopilot AI</p>
            <p className="text-xs text-zinc-500">{viewSubtitles[activeView]}</p>
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

type DashboardData = {
  orders: ServiceOrder[];
  products: InventoryProduct[];
  monthlySales: MonthlySalesSummary;
  monthlyHistory: MonthlySalesSummary[];
};

type DashboardActivity = {
  id: string;
  title: string;
  detail: string;
  date: string;
  kind: "order" | "inventory";
};

function PerformanceDashboard({ initialData }: { initialData: DashboardData }) {
  const data = initialData;
  const isLoading = false;

  const performance = useMemo(() => {
    const activeRepairs = data.orders.filter((order) => {
      const status = normalizeDashboardText(order.status);
      return status !== "recibido" && status !== "listo" && status !== "entregado" && status !== "pagada";
    }).length;
    const pendingOrders = data.orders.filter(
      (order) => !["entregado", "pagada"].includes(normalizeDashboardText(order.status)),
    ).length;
    const monthlySales = data.monthlySales;
    const monthlyHistory = data.monthlyHistory;
    const lowStock = data.products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .sort((left, right) => left.stock - right.stock || left.name.localeCompare(right.name));

    const productSales = new Map<string, { name: string; count: number }>();
    data.orders
      .filter((order) => ["entregado", "pagada"].includes(normalizeDashboardText(order.status)))
      .forEach((order) => {
        const name = [order.brand, order.model].filter(Boolean).join(" ");
        const key = normalizeDashboardText(name);
        const current = productSales.get(key);
        productSales.set(key, { name, count: (current?.count ?? 0) + 1 });
      });

    const topProducts = [...productSales.values()]
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 5);
    const activities: DashboardActivity[] = [
      ...data.orders.map((order) => ({
        id: `order-${order.id}`,
        title: order.orderNumber,
        detail: `${order.status} · ${order.brand} ${order.model}`,
        date: order.updatedAt,
        kind: "order" as const,
      })),
      ...data.products.map((product) => ({
        id: `inventory-${product.id}`,
        title: product.name,
        detail: `Stock ${product.stock} · ${product.category}`,
        date: product.updatedAt,
        kind: "inventory" as const,
      })),
    ]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 7);

    return { activeRepairs, pendingOrders, monthlySales, monthlyHistory, lowStock, topProducts, activities };
  }, [data]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-400">Operación diaria</p>
          <h1 className="mt-1 text-3xl font-semibold text-zinc-950">Panel de rendimiento</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date())}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Reparaciones activas" value={isLoading ? "—" : performance.activeRepairs} helper="En diagnóstico o reparación" accent="emerald" />
        <DashboardMetric label="Órdenes pendientes" value={isLoading ? "—" : performance.pendingOrders} helper="Por completar o entregar" accent="amber" />
        <DashboardMetric
          label="Ventas del mes"
          value={isLoading ? "—" : formatCurrency(performance.monthlySales.totalSold)}
          helper={`Reparaciones ${formatCurrency(performance.monthlySales.totalRepairs)} · Accesorios ${formatCurrency(performance.monthlySales.totalAccessories)}`}
          accent="blue"
        />
        <DashboardMetric label="Stock bajo" value={isLoading ? "—" : performance.lowStock.length} helper="Productos en o bajo el mínimo" accent="red" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
        <DashboardSectionHeader title="Historial mensual" subtitle="Reparaciones pagadas y ventas rápidas" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 font-semibold">Mes</th>
                <th className="px-5 py-3 font-semibold">Año</th>
                <th className="px-5 py-3 font-semibold">Total vendido</th>
                <th className="px-5 py-3 font-semibold">Reparaciones</th>
                <th className="px-5 py-3 font-semibold">Accesorios</th>
                <th className="px-5 py-3 font-semibold">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {performance.monthlyHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                    Aún no hay ventas mensuales registradas.
                  </td>
                </tr>
              ) : (
                performance.monthlyHistory.map((summary) => (
                  <tr key={summary.monthKey} className="border-b border-zinc-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-zinc-950">{formatDashboardMonth(summary.month)}</td>
                    <td className="px-5 py-3 text-zinc-600">{summary.year}</td>
                    <td className="px-5 py-3 font-semibold text-zinc-950">{formatCurrency(summary.totalSold)}</td>
                    <td className="px-5 py-3 text-zinc-700">{formatCurrency(summary.totalRepairs)}</td>
                    <td className="px-5 py-3 text-zinc-700">{formatCurrency(summary.totalAccessories)}</td>
                    <td className="px-5 py-3 text-zinc-700">
                      {summary.repairsCount} {summary.repairsCount === 1 ? "reparación" : "reparaciones"}
                      {summary.accessoriesCount > 0 ? ` · ${summary.accessoriesCount} accesorios` : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
          <DashboardSectionHeader title="Productos más vendidos" subtitle="Equipos en órdenes entregadas" />
          <div className="divide-y divide-zinc-100 px-5">
            {isLoading ? (
              <DashboardEmptyState text="Cargando ventas..." />
            ) : performance.topProducts.length > 0 ? (
              performance.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-600">{index + 1}</span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">{product.name}</p>
                  <span className="text-sm font-semibold text-zinc-950">{product.count}</span>
                </div>
              ))
            ) : (
              <DashboardEmptyState text="Aún no hay productos vendidos registrados." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
          <DashboardSectionHeader title="Stock bajo" subtitle="Prioridad de reposición" />
          <div className="divide-y divide-zinc-100 px-5">
            {isLoading ? (
              <DashboardEmptyState text="Cargando inventario..." />
            ) : performance.lowStock.length > 0 ? (
              performance.lowStock.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center gap-4 py-4">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{product.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{product.category} · Mínimo {product.lowStockThreshold}</p>
                  </div>
                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{product.stock} uds.</span>
                </div>
              ))
            ) : (
              <DashboardEmptyState text="Todo el inventario está sobre el mínimo." />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
        <DashboardSectionHeader title="Actividad reciente" subtitle="Movimientos de órdenes e inventario" />
        <div className="divide-y divide-zinc-100 px-5">
          {isLoading ? (
            <DashboardEmptyState text="Cargando actividad..." />
          ) : performance.activities.length > 0 ? (
            performance.activities.map((activity) => (
              <div key={activity.id} className="grid gap-2 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                <span className={"h-2.5 w-2.5 rounded-full " + (activity.kind === "order" ? "bg-emerald-500" : "bg-blue-500")} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{activity.title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{activity.detail}</p>
                </div>
                <time dateTime={activity.date} className="text-xs text-zinc-400">{formatDashboardDate(activity.date)}</time>
              </div>
            ))
          ) : (
            <DashboardEmptyState text="Aún no hay actividad registrada." />
          )}
        </div>
      </section>
    </section>
  );
}

function DashboardMetric({ label, value, helper, accent }: { label: string; value: string | number; helper: string; accent: "emerald" | "amber" | "blue" | "red" }) {
  const accentClasses = { emerald: "bg-emerald-500", amber: "bg-amber-500", blue: "bg-blue-500", red: "bg-red-500" }[accent];
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accentClasses}`} />
      </div>
      <p className="mt-4 text-2xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </article>
  );
}

function DashboardSectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="text-xs text-zinc-400">{subtitle}</p>
    </div>
  );
}

function DashboardEmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-zinc-400">{text}</p>;
}

function normalizeDashboardText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function formatDashboardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDashboardMonth(month: number) {
  return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(new Date(2026, month - 1, 1));
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
