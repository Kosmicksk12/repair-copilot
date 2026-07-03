"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ServiceOrderReceipt from "./ServiceOrderReceipt";
import {
  ACCESSORY_OPTIONS,
  REPAIR_STATUSES,
  type RepairStatus,
  type ServiceOrder,
} from "@/lib/service-order-types";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDate, statusBadgeClass } from "@/lib/service-order-format";
import { downloadReceiptPdf, printReceipt } from "@/lib/service-order-pdf";
import { DEFAULT_WARRANTY_DAYS } from "@/lib/warranty-terms";

type FormState = {
  clientName: string;
  clientPhone: string;
  brand: string;
  model: string;
  imei: string;
  color: string;
  reportedDamage: string;
  technicalDiagnosis: string;
  accessories: string[];
  physicalCondition: string;
  observations: string;
  estimatedValue: string;
  status: RepairStatus;
  technicianName: string;
  warrantyDays: string;
};

const emptyForm: FormState = {
  clientName: "",
  clientPhone: "",
  brand: "",
  model: "",
  imei: "",
  color: "",
  reportedDamage: "",
  technicalDiagnosis: "",
  accessories: [],
  physicalCondition: "",
  observations: "",
  estimatedValue: "",
  status: "Recibido",
  technicianName: "",
  warrantyDays: String(DEFAULT_WARRANTY_DAYS),
};

function formFromOrder(order: ServiceOrder): FormState {
  return {
    clientName: order.clientName,
    clientPhone: order.clientPhone,
    brand: order.brand,
    model: order.model,
    imei: order.imei ?? "",
    color: order.color,
    reportedDamage: order.reportedDamage,
    technicalDiagnosis: order.technicalDiagnosis ?? "",
    accessories: order.accessories,
    physicalCondition: order.physicalCondition,
    observations: order.observations,
    estimatedValue: order.estimatedValue?.toString() ?? "",
    status: order.status,
    technicianName: order.technicianName ?? "",
    warrantyDays: String(order.warrantyDays ?? DEFAULT_WARRANTY_DAYS),
  };
}

function inputClassName() {
  return "w-full rounded-xl border border-zinc-200 bg-[#fbfbfa] px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100";
}

function labelClassName() {
  return "mb-1 block text-xs font-medium text-zinc-600";
}

export default function ServiceOrdersModule() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RepairStatus | "Todos">("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "Todos") params.set("status", statusFilter);

      const response = await fetch(`/api/service-orders?${params.toString()}`);
      if (!response.ok) throw new Error("No se pudieron cargar las órdenes.");

      const data = (await response.json()) as { orders: ServiceOrder[] };
      setOrders(data.orders);
    } catch {
      setError("Error al cargar las órdenes de servicio.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openCreate = () => {
    setFormMode("create");
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (order: ServiceOrder) => {
    setFormMode("edit");
    setForm(formFromOrder(order));
    setSelectedOrder(order);
    setFormOpen(true);
  };

  const toggleAccessory = (accessory: string) => {
    setForm((prev) => ({
      ...prev,
      accessories: prev.accessories.includes(accessory)
        ? prev.accessories.filter((item) => item !== accessory)
        : [...prev.accessories, accessory],
    }));
  };

  const buildPayload = () => ({
    clientName: form.clientName,
    clientPhone: form.clientPhone,
    brand: form.brand,
    model: form.model,
    imei: form.imei || undefined,
    color: form.color,
    reportedDamage: form.reportedDamage,
    technicalDiagnosis: form.technicalDiagnosis || undefined,
    accessories: form.accessories,
    physicalCondition: form.physicalCondition,
    observations: form.observations,
    estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
    status: form.status,
    technicianName: form.technicianName || undefined,
    warrantyDays: form.warrantyDays ? Number(form.warrantyDays) : DEFAULT_WARRANTY_DAYS,
  });

  const handleSave = async () => {
    if (
      !form.clientName.trim() ||
      !form.clientPhone.trim() ||
      !form.brand.trim() ||
      !form.model.trim() ||
      !form.color.trim()
    ) {
      setError("Completa los campos obligatorios del cliente y del equipo.");
      return;
    }
    if (!form.reportedDamage.trim() || !form.physicalCondition.trim()) {
      setError("Describe el daño reportado y el estado físico del equipo.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payload = buildPayload();

      if (formMode === "create") {
        const response = await fetch("/api/service-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "No se pudo crear la orden.");
        }
        const data = (await response.json()) as { order: ServiceOrder };
        setSelectedOrder(data.order);
        setShowReceipt(true);
      } else if (selectedOrder) {
        const response = await fetch(
          `/api/service-orders/${encodeURIComponent(selectedOrder.orderNumber)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "No se pudo actualizar la orden.");
        }
        const data = (await response.json()) as { order: ServiceOrder };
        setSelectedOrder(data.order);
      }

      setFormOpen(false);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la orden.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (order: ServiceOrder, status: RepairStatus) => {
    setError("");
    try {
      const response = await fetch(
        `/api/service-orders/${encodeURIComponent(order.orderNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) throw new Error("No se pudo actualizar el estado.");
      const data = (await response.json()) as { order: ServiceOrder };
      setSelectedOrder(data.order);
      await loadOrders();
    } catch {
      setError("Error al cambiar el estado de la reparación.");
    }
  };

  const handleDownloadPdf = async () => {
    const element = receiptRef.current?.querySelector("#service-order-receipt") as HTMLElement | null;
    if (!element || !selectedOrder) return;

    setIsPdfLoading(true);
    try {
      await downloadReceiptPdf(element, `${selectedOrder.orderNumber}.pdf`);
    } catch {
      setError("No se pudo generar el PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePrint = () => {
    printReceipt();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Órdenes de servicio</h2>
          <p className="text-xs text-zinc-500">Fixit Phone · Comprobante de ingreso y garantía</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          + Nueva orden
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col border-r border-zinc-200/80">
          <div className="space-y-3 border-b border-zinc-200/80 p-4">
            <input
              type="search"
              placeholder="Buscar por orden, cliente, teléfono, IMEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClassName()}
            />
            <div className="flex flex-wrap gap-1.5">
              {(["Todos", ...REPAIR_STATUSES] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (statusFilter === status
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300")
                  }
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {error && !formOpen && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {isLoading ? (
              <p className="py-12 text-center text-sm text-zinc-500">Cargando órdenes...</p>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl">📋</p>
                <p className="mt-3 text-sm text-zinc-500">No hay órdenes registradas</p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 text-sm font-medium text-zinc-900 underline"
                >
                  Crear la primera orden
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowReceipt(false);
                    }}
                    className={
                      "w-full rounded-2xl border p-4 text-left transition " +
                      (selectedOrder?.id === order.id
                        ? "border-zinc-400 bg-zinc-50 ring-1 ring-zinc-200"
                        : "border-zinc-200 bg-white hover:border-zinc-300")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-950">{order.orderNumber}</p>
                        <p className="mt-0.5 text-sm text-zinc-700">{order.clientName}</p>
                        <p className="text-xs text-zinc-500">
                          {order.brand} {order.model} · {order.clientPhone}
                        </p>
                      </div>
                      <span
                        className={
                          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 " +
                          statusBadgeClass(order.status)
                        }
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{formatOrderDate(order.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden w-[420px] shrink-0 flex-col bg-[#fbfbfa] xl:flex">
          {selectedOrder ? (
            <>
              <div className="space-y-3 border-b border-zinc-200/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-zinc-950">{selectedOrder.orderNumber}</p>
                    <p className="text-xs text-zinc-500">{formatOrderDate(selectedOrder.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(selectedOrder)}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Editar
                  </button>
                </div>

                <div>
                  <label htmlFor="order-status" className={labelClassName()}>
                    Estado de la reparación
                  </label>
                  <select
                    id="order-status"
                    value={selectedOrder.status}
                    onChange={(e) =>
                      void handleStatusChange(selectedOrder, e.target.value as RepairStatus)
                    }
                    className={inputClassName()}
                  >
                    {REPAIR_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="flex-1 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    Ver comprobante
                  </button>
                  <a
                    href={`/orden/${encodeURIComponent(selectedOrder.orderNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Vista pública
                  </a>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {showReceipt ? (
                  <div ref={receiptRef} className="space-y-3">
                    <div className="flex gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownloadPdf()}
                        disabled={isPdfLoading}
                        className="flex-1 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                      >
                        {isPdfLoading ? "Generando..." : "Descargar PDF"}
                      </button>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <ServiceOrderReceipt order={selectedOrder} />
                    </div>
                  </div>
                ) : (
                  <OrderDetailSummary order={selectedOrder} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-4xl">🧾</p>
                <p className="mt-3 text-sm text-zinc-500">
                  Selecciona una orden para ver detalle, comprobante e imprimir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-zinc-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-semibold text-zinc-950">
              {formMode === "create" ? "Nueva orden de servicio" : "Editar orden"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {formMode === "create"
                ? "Se generará automáticamente un número consecutivo (ej. FP-000001)."
                : selectedOrder?.orderNumber}
            </p>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-5 space-y-6">
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Cliente
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName()}>Nombre *</label>
                    <input
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Teléfono *</label>
                    <input
                      value={form.clientPhone}
                      onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Equipo
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName()}>Marca *</label>
                    <input
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Modelo *</label>
                    <input
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>IMEI</label>
                    <input
                      value={form.imei}
                      onChange={(e) => setForm({ ...form, imei: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Color *</label>
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Reparación
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className={labelClassName()}>Daño reportado *</label>
                    <textarea
                      value={form.reportedDamage}
                      onChange={(e) => setForm({ ...form, reportedDamage: e.target.value })}
                      rows={3}
                      className={inputClassName() + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Diagnóstico técnico</label>
                    <textarea
                      value={form.technicalDiagnosis}
                      onChange={(e) => setForm({ ...form, technicalDiagnosis: e.target.value })}
                      rows={2}
                      className={inputClassName() + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Estado físico del equipo *</label>
                    <textarea
                      value={form.physicalCondition}
                      onChange={(e) => setForm({ ...form, physicalCondition: e.target.value })}
                      rows={2}
                      className={inputClassName() + " resize-none"}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Observaciones</label>
                    <textarea
                      value={form.observations}
                      onChange={(e) => setForm({ ...form, observations: e.target.value })}
                      rows={2}
                      className={inputClassName() + " resize-none"}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Accesorios entregados
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ACCESSORY_OPTIONS.map((accessory) => (
                    <button
                      key={accessory}
                      type="button"
                      onClick={() => toggleAccessory(accessory)}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                        (form.accessories.includes(accessory)
                          ? "bg-zinc-950 text-white"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300")
                      }
                    >
                      {accessory}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Comercial y estado
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName()}>Valor estimado</label>
                    <input
                      type="number"
                      min="0"
                      value={form.estimatedValue}
                      onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Estado</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as RepairStatus })
                      }
                      className={inputClassName()}
                    >
                      {REPAIR_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName()}>Técnico responsable</label>
                    <input
                      value={form.technicianName}
                      onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Días de garantía</label>
                    <input
                      type="number"
                      min="1"
                      value={form.warrantyDays}
                      onChange={(e) => setForm({ ...form, warrantyDays: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setError("");
                }}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isSaving
                  ? "Guardando..."
                  : formMode === "create"
                    ? "Crear orden e imprimir"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetailSummary({ order }: { order: ServiceOrder }) {
  return (
    <div className="space-y-4">
      <DetailBlock title="Cliente">
        <DetailRow label="Nombre" value={order.clientName} />
        <DetailRow label="Teléfono" value={order.clientPhone} />
      </DetailBlock>
      <DetailBlock title="Equipo">
        <DetailRow label="Marca / Modelo" value={`${order.brand} ${order.model}`} />
        <DetailRow label="Color" value={order.color} />
        <DetailRow label="IMEI" value={order.imei ?? "—"} />
      </DetailBlock>
      <DetailBlock title="Reparación">
        <DetailRow label="Daño reportado" value={order.reportedDamage} />
        {order.technicalDiagnosis && (
          <DetailRow label="Diagnóstico" value={order.technicalDiagnosis} />
        )}
        <DetailRow
          label="Accesorios"
          value={order.accessories.length ? order.accessories.join(", ") : "Ninguno"}
        />
        <DetailRow label="Estado físico" value={order.physicalCondition} />
        <DetailRow label="Observaciones" value={order.observations || "—"} />
        <DetailRow label="Valor estimado" value={formatCurrency(order.estimatedValue)} />
      </DetailBlock>
      <DetailBlock title="Garantía">
        <DetailRow
          label="Vigencia"
          value={
            order.warrantyExpiresAt
              ? formatOrderDate(order.warrantyExpiresAt)
              : `${order.warrantyDays ?? 90} días`
          }
        />
        <DetailRow label="Técnico" value={order.technicianName ?? "—"} />
      </DetailBlock>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</h4>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-zinc-400">{label}</p>
      <p className="text-sm leading-6 text-zinc-800">{value}</p>
    </div>
  );
}
