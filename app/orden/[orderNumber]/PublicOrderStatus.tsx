"use client";

import type { PublicOrderStatus, ServiceOrder } from "@/lib/service-order-types";
import { formatOrderDate, statusBadgeClass } from "@/lib/service-order-format";
import { FIXIT_PHONE_BRAND } from "@/lib/warranty-terms";

const STATUS_STEPS = [
  "Recibido",
  "Diagnóstico",
  "En reparación",
  "Listo",
  "Entregado",
] as const;

export default function PublicOrderStatus({
  order,
  publicStatus,
}: {
  order: ServiceOrder;
  publicStatus: PublicOrderStatus;
}) {
  const currentIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 text-zinc-950">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <p className="text-xl font-black tracking-[0.15em]">{FIXIT_PHONE_BRAND.name}</p>
          <p className="mt-1 text-sm text-zinc-500">Consulta pública de reparación</p>
        </div>

        <article className="mt-8 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Orden</p>
              <p className="text-2xl font-bold tracking-tight">{order.orderNumber}</p>
            </div>
            <span
              className={
                "rounded-full px-3 py-1 text-xs font-semibold ring-1 " +
                statusBadgeClass(order.status)
              }
            >
              {order.status}
            </span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Progreso de la reparación
            </p>
            <ol className="mt-3 space-y-2">
              {STATUS_STEPS.map((step, index) => {
                const done = index <= currentIndex;
                const active = index === currentIndex;
                return (
                  <li
                    key={step}
                    className={
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm " +
                      (active
                        ? "bg-zinc-950 text-white"
                        : done
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-zinc-50 text-zinc-400")
                    }
                  >
                    <span
                      className={
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                        (active
                          ? "bg-white text-zinc-950"
                          : done
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-500")
                      }
                    >
                      {done && !active ? "✓" : index + 1}
                    </span>
                    {step}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-400">Cliente</p>
              <p className="text-sm font-medium">{publicStatus.clientNameMasked}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Equipo</p>
              <p className="text-sm font-medium">
                {order.brand} {order.model}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Ingreso</p>
              <p className="text-sm">{formatOrderDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Garantía</p>
              <p className="text-sm">
                {publicStatus.warrantyActive ? "Vigente" : "No vigente / vencida"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-zinc-100 pt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/service-orders/${encodeURIComponent(order.orderNumber)}/qr`}
              alt="Código QR"
              className="h-20 w-20 rounded-lg border border-zinc-200"
            />
            <p className="text-xs leading-5 text-zinc-500">
              Escanea este código QR para consultar el estado de tu reparación en cualquier momento.
            </p>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Última actualización: {formatOrderDate(order.updatedAt)}
        </p>
      </div>
    </main>
  );
}
