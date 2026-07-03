"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import type { ServiceOrder } from "@/lib/service-order-types";
import { FIXIT_PHONE_BRAND, WARRANTY_TERMS } from "@/lib/warranty-terms";
import { formatOrderDate } from "@/lib/service-order-format";

type ServiceOrderReceiptProps = {
  order: ServiceOrder;
  qrUrl?: string;
  className?: string;
};

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900">{value || "—"}</p>
    </div>
  );
}

export default function ServiceOrderReceipt({ order, qrUrl, className = "" }: ServiceOrderReceiptProps) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    if (qrUrl) {
      setQrSrc(qrUrl);
      return;
    }
    setQrSrc(`/api/service-orders/${encodeURIComponent(order.orderNumber)}/qr`);
  }, [order.orderNumber, qrUrl]);

  const accessories =
    order.accessories.length > 0 ? order.accessories.join(", ") : "Ninguno reportado";

  return (
    <article
      id="service-order-receipt"
      className={
        "service-order-receipt mx-auto w-full max-w-[816px] bg-white text-zinc-900 " + className
      }
    >
      <div className="border-b-2 border-zinc-900 px-8 pb-5 pt-8 text-center">
        <p className="text-2xl font-black tracking-[0.2em] text-zinc-950">{FIXIT_PHONE_BRAND.name}</p>
        <p className="mt-1 text-xs text-zinc-500">{FIXIT_PHONE_BRAND.tagline}</p>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-zinc-800">
          Orden de servicio y garantía
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 px-8 py-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Número de orden
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-zinc-950">{order.orderNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Fecha</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{formatOrderDate(order.createdAt)}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Estado
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-900">{order.status}</p>
        </div>
      </div>

      <div className="mx-8 grid grid-cols-2 gap-6 border-t border-zinc-200 py-6">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Datos del cliente</p>
          <ReceiptField label="Nombre" value={order.clientName} />
          <ReceiptField label="Teléfono" value={order.clientPhone} />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Datos del equipo</p>
          <ReceiptField label="Marca / Modelo" value={`${order.brand} ${order.model}`} />
          <ReceiptField label="Color" value={order.color} />
          <ReceiptField label="IMEI" value={order.imei ?? "No registrado"} />
        </div>
      </div>

      <div className="mx-8 space-y-4 border-t border-zinc-200 py-6">
        <ReceiptField label="Daño reportado por el cliente" value={order.reportedDamage} />
        {order.technicalDiagnosis && (
          <ReceiptField label="Diagnóstico técnico" value={order.technicalDiagnosis} />
        )}
        <ReceiptField label="Accesorios entregados" value={accessories} />
        <ReceiptField label="Estado físico del equipo" value={order.physicalCondition} />
        <ReceiptField label="Observaciones" value={order.observations || "Sin observaciones adicionales."} />
        <ReceiptField label="Valor estimado" value={formatCurrency(order.estimatedValue)} />
      </div>

      <div className="mx-8 border-t border-zinc-200 py-6">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
          Términos y condiciones de garantía
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-[11px] leading-5 text-zinc-600">
          {WARRANTY_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
        {order.warrantyExpiresAt && (
          <p className="mt-4 text-xs text-zinc-700">
            <span className="font-semibold">Vigencia de garantía:</span>{" "}
            {formatOrderDate(order.warrantyExpiresAt)} ({order.warrantyDays ?? 90} días)
          </p>
        )}
      </div>

      <div className="mx-8 grid grid-cols-[1fr_auto_1fr] items-end gap-6 border-t border-zinc-200 py-8">
        <div>
          <div className="border-b border-zinc-400 pb-1" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Firma del cliente
          </p>
        </div>
        <div className="text-center">
          {qrSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt={`QR ${order.orderNumber}`} className="mx-auto h-24 w-24" />
          )}
          <p className="mt-1 text-[9px] text-zinc-400">Consultar estado</p>
        </div>
        <div>
          <div className="border-b border-zinc-400 pb-1" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Firma del técnico
          </p>
          {order.technicianName && (
            <p className="mt-1 text-xs text-zinc-600">{order.technicianName}</p>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-8 py-4 text-center text-[10px] text-zinc-400">
        {FIXIT_PHONE_BRAND.address} · {FIXIT_PHONE_BRAND.email}
      </div>
    </article>
  );
}
