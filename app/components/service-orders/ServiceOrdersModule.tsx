"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ServiceOrderReceipt from "./ServiceOrderReceipt";
import {
  ACCESSORY_OPTIONS,
  REPAIR_STATUSES,
  type RepairStatus,
  type ServiceOrder,
  type ServiceOrderPart,
} from "@/lib/service-order-types";
import type { InventoryProduct } from "@/lib/inventory-types";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDate, statusBadgeClass } from "@/lib/service-order-format";
import { downloadReceiptPdf, printReceipt } from "@/lib/service-order-pdf";
import { DEFAULT_WARRANTY_DAYS } from "@/lib/warranty-terms";
import {
  createServiceOrderForModule,
  deleteServiceOrderForModule,
  getAvailablePartsForModule,
  getServiceOrdersForModule,
  payServiceOrderForModule,
  updateServiceOrderForModule,
} from "./actions";

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
  laborCost: string;
  discount: string;
  advance: string;
  finalPayment: string;
  parts: ServiceOrderPart[];
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
  laborCost: "",
  discount: "",
  advance: "",
  finalPayment: "",
  parts: [],
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
    laborCost: order.laborCost?.toString() ?? "",
    discount: order.discount?.toString() ?? "",
    advance: order.advance?.toString() ?? "",
    finalPayment: order.finalPayment?.toString() ?? "",
    parts: order.parts ?? [],
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

function toFormNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function productUnitPrice(product: InventoryProduct) {
  return product.salePrice ?? product.minimumPrice ?? 0;
}

function productLabel(product: InventoryProduct) {
  return [product.name, product.brand, product.model ?? product.variant, product.color]
    .filter(Boolean)
    .join(" · ");
}

function calculateFormTotals(form: FormState) {
  const partsSubtotal = form.parts.reduce((total, part) => total + part.quantity * part.unitPrice, 0);
  const laborTotal = toFormNumber(form.laborCost);
  const discount = toFormNumber(form.discount);
  const advance = toFormNumber(form.advance);
  const finalPayment = toFormNumber(form.finalPayment);
  const paidAmount = advance + finalPayment;
  const finalTotal = Math.max(0, partsSubtotal + laborTotal - discount);
  const balanceDue = Math.max(0, finalTotal - paidAmount);

  return { partsSubtotal, laborTotal, discount, advance, finalPayment, paidAmount, finalTotal, balanceDue };
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ServiceOrdersModule() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [availableParts, setAvailableParts] = useState<InventoryProduct[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [search, setSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RepairStatus | "Todos">("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
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
      const [orders, parts] = await Promise.all([
        getServiceOrdersForModule({
          search: search.trim() || undefined,
          status: statusFilter,
        }),
        getAvailablePartsForModule(),
      ]);
      setOrders(orders);
      setAvailableParts(parts);
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
    laborCost: toFormNumber(form.laborCost),
    parts: form.parts,
    discount: toFormNumber(form.discount),
    advance: toFormNumber(form.advance),
    finalPayment: toFormNumber(form.finalPayment),
    status: form.status,
    technicianName: form.technicianName || undefined,
    warrantyDays: form.warrantyDays ? Number(form.warrantyDays) : DEFAULT_WARRANTY_DAYS,
  });

  const filteredPartProducts = availableParts.filter((product) => {
    const query = partSearch.trim().toLowerCase();
    if (!query) return true;
    return productLabel(product).toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
  });

  const addPart = (product: InventoryProduct) => {
    const unitPrice = productUnitPrice(product);
    setForm((prev) => {
      const existing = prev.parts.find((part) => part.productId === product.id);
      if (existing) {
        return {
          ...prev,
          parts: prev.parts.map((part) =>
            part.productId === product.id
              ? {
                  ...part,
                  quantity: Math.min(product.stock, part.quantity + 1),
                  subtotal: Math.min(product.stock, part.quantity + 1) * part.unitPrice,
                }
              : part,
          ),
        };
      }

      return {
        ...prev,
        parts: [
          ...prev.parts,
          {
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            productBrand: product.brand,
            productModel: product.model ?? product.variant,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
          },
        ],
      };
    });
  };

  const updatePart = (productId: string, patch: Partial<Pick<ServiceOrderPart, "quantity" | "unitPrice">>) => {
    const product = availableParts.find((item) => item.id === productId);
    setForm((prev) => ({
      ...prev,
      parts: prev.parts.map((part) => {
        if (part.productId !== productId) return part;
        const quantity = patch.quantity !== undefined
          ? Math.max(1, Math.min(product?.stock ?? patch.quantity, Math.trunc(patch.quantity)))
          : part.quantity;
        const unitPrice = patch.unitPrice !== undefined ? Math.max(0, patch.unitPrice) : part.unitPrice;
        return { ...part, quantity, unitPrice, subtotal: quantity * unitPrice };
      }),
    }));
  };

  const removePart = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      parts: prev.parts.filter((part) => part.productId !== productId),
    }));
  };

  const formTotals = calculateFormTotals(form);

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
        const order = await createServiceOrderForModule(payload);
        setSelectedOrder(order);
        setShowReceipt(true);
      } else if (selectedOrder) {
        const order = await updateServiceOrderForModule(selectedOrder.orderNumber, payload);
        setSelectedOrder(order);
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
    if (status === "Pagada") {
      await handlePayOrder(order);
      return;
    }

    setError("");
    try {
      const updatedOrder = await updateServiceOrderForModule(order.orderNumber, { status });
      setSelectedOrder(updatedOrder);
      await loadOrders();
    } catch {
      setError("Error al cambiar el estado de la reparación.");
    }
  };

  const handleDeleteOrder = async (order: ServiceOrder) => {
    const confirmed = window.confirm(`¿Eliminar la orden ${order.orderNumber}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");
    try {
      await deleteServiceOrderForModule(order.orderNumber);
      if (selectedOrder?.orderNumber === order.orderNumber) {
        setSelectedOrder(null);
        setShowReceipt(false);
      }
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la orden.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayOrder = async (order: ServiceOrder) => {
    const confirmed = window.confirm(`¿Marcar la orden ${order.orderNumber} como pagada? Se descontará el inventario de repuestos.`);
    if (!confirmed) return;

    setIsPaying(true);
    setError("");
    try {
      const paidOrder = await payServiceOrderForModule(order.orderNumber);
      setSelectedOrder(paidOrder);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar la orden como pagada.");
    } finally {
      setIsPaying(false);
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
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f5]">
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Órdenes de servicio</h2>
            <p className="text-xs text-zinc-500">Lista operativa y ficha fija de la orden seleccionada.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + Nueva orden
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="space-y-3 border-b border-zinc-100 p-3">
            <div>
              <input
                type="search"
                placeholder="Buscar orden, cliente, equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClassName()}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(["Todos", ...REPAIR_STATUSES] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (statusFilter === status
                      ? "bg-zinc-950 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")
                  }
                >
                  {status}
                </button>
              ))}
            </div>
            {error && !formOpen && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <p className="py-16 text-center text-sm text-zinc-500">Cargando órdenes...</p>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl">📋</p>
                <p className="mt-3 text-sm text-zinc-500">No hay órdenes registradas</p>
                <button type="button" onClick={openCreate} className="mt-4 text-sm font-semibold text-zinc-900 underline">
                  Crear la primera orden
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {orders.map((order) => {
                  const active = selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowReceipt(false);
                      }}
                      className={
                        "w-full rounded-xl border px-3 py-2.5 text-left transition " +
                        (active
                          ? "border-zinc-400 bg-zinc-50 ring-1 ring-zinc-200"
                          : "border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-50")
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950">{order.orderNumber}</p>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">{order.clientName}</p>
                        </div>
                        <span className={"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 " + statusBadgeClass(order.status)}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs text-zinc-500">{order.brand} {order.model} · {order.technicianName ?? "Sin técnico"}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-400">{formatCompactDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-zinc-950">{formatCurrency(order.finalTotal)}</p>
                          <p className={order.balanceDue > 0 ? "text-[11px] font-medium text-amber-700" : "text-[11px] font-medium text-emerald-700"}>
                            Saldo {formatCurrency(order.balanceDue)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {selectedOrder ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-zinc-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Orden seleccionada</p>
                    <h3 className="mt-1 text-lg font-semibold text-zinc-950">{selectedOrder.orderNumber}</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatCompactDate(selectedOrder.createdAt)}</p>
                  </div>
                  <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 " + statusBadgeClass(selectedOrder.status)}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {showReceipt ? (
                  <div ref={receiptRef} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 print:hidden">
                      <button type="button" onClick={handlePrint} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                        Imprimir
                      </button>
                      <button type="button" onClick={() => void handleDownloadPdf()} disabled={isPdfLoading} className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60">
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

              <div className="grid grid-cols-5 gap-2 border-t border-zinc-200 bg-white p-3">
                <button type="button" onClick={() => openEdit(selectedOrder)} className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  Editar
                </button>
                <button type="button" onClick={() => setShowReceipt((value) => !value)} className="rounded-xl bg-zinc-950 px-2 py-2 text-xs font-semibold text-white hover:bg-zinc-800">
                  {showReceipt ? "Detalle" : "Recibo"}
                </button>
                <a href={`/orden/${encodeURIComponent(selectedOrder.orderNumber)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  Pública
                </a>
                <button
                  type="button"
                  onClick={() => void handlePayOrder(selectedOrder)}
                  disabled={selectedOrder.status === "Pagada" || isPaying}
                  className="rounded-xl bg-emerald-600 px-2 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteOrder(selectedOrder)}
                  disabled={isDeleting}
                  className="rounded-xl border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Borrar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="text-4xl">🧾</p>
                <h3 className="mt-4 text-base font-semibold text-zinc-950">Selecciona una orden</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  El panel lateral mostrará cliente, equipo, timeline, finanzas, garantía y acciones.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/30">
          <div
            role="dialog"
            aria-modal="true"
            className="h-full w-full max-w-xl overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl"
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
                  Repuestos utilizados
                </h4>
                <div className="space-y-3">
                  <input
                    type="search"
                    placeholder="Buscar repuesto en inventario con stock..."
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className={inputClassName()}
                  />
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200">
                    {filteredPartProducts.slice(0, 8).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addPart(product)}
                        className="flex w-full items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2 text-left text-xs last:border-0 hover:bg-zinc-50"
                      >
                        <span>
                          <span className="block font-medium text-zinc-800">{productLabel(product)}</span>
                          <span className="text-zinc-400">Stock {product.stock} · {product.category}</span>
                        </span>
                        <span className="font-semibold text-zinc-700">{formatCurrency(productUnitPrice(product))}</span>
                      </button>
                    ))}
                    {filteredPartProducts.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-zinc-400">
                        No hay repuestos con stock para esa búsqueda.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {form.parts.length === 0 ? (
                      <p className="rounded-xl bg-zinc-50 px-3 py-3 text-xs text-zinc-500">
                        Aún no hay repuestos agregados a esta orden.
                      </p>
                    ) : (
                      form.parts.map((part) => (
                        <div key={part.productId} className="rounded-xl border border-zinc-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{part.productName}</p>
                              <p className="text-xs text-zinc-500">{part.productBrand} · {part.productCategory}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePart(part.productId)}
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Quitar
                            </button>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <label>
                              <span className={labelClassName()}>Cantidad</span>
                              <input
                                type="number"
                                min="1"
                                value={part.quantity}
                                onChange={(e) => updatePart(part.productId, { quantity: Number(e.target.value) })}
                                className={inputClassName()}
                              />
                            </label>
                            <label>
                              <span className={labelClassName()}>Precio unitario</span>
                              <input
                                type="number"
                                min="0"
                                value={part.unitPrice}
                                onChange={(e) => updatePart(part.productId, { unitPrice: Number(e.target.value) })}
                                className={inputClassName()}
                              />
                            </label>
                            <div className="rounded-xl bg-zinc-50 p-3">
                              <p className="text-xs text-zinc-500">Subtotal</p>
                              <p className="mt-1 text-sm font-semibold text-zinc-900">
                                {formatCurrency(part.quantity * part.unitPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                    <label className={labelClassName()}>Mano de obra</label>
                    <input
                      type="number"
                      min="0"
                      value={form.laborCost}
                      onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Descuento</label>
                    <input
                      type="number"
                      min="0"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Anticipo</label>
                    <input
                      type="number"
                      min="0"
                      value={form.advance}
                      onChange={(e) => setForm({ ...form, advance: e.target.value })}
                      className={inputClassName()}
                    />
                  </div>
                  <div>
                    <label className={labelClassName()}>Pago final</label>
                    <input
                      type="number"
                      min="0"
                      value={form.finalPayment}
                      onChange={(e) => setForm({ ...form, finalPayment: e.target.value })}
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
                        <option key={status} value={status} disabled={status === "Pagada"}>
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
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Subtotal repuestos</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(formTotals.partsSubtotal)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Total final</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(formTotals.finalTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Pagado</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(formTotals.paidAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Saldo pendiente</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(formTotals.balanceDue)}</p>
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
    <div className="space-y-3">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <CompactFact label="Cliente" value={order.clientName} helper={order.clientPhone} />
          <CompactFact label="Equipo" value={`${order.brand} ${order.model}`} helper={[order.color, order.imei].filter(Boolean).join(" · ") || "Sin detalle"} />
        </div>
        <div className="mt-3 rounded-xl bg-zinc-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Reporte</p>
          <p className="mt-1 text-sm leading-5 text-zinc-800">{order.reportedDamage}</p>
          {order.technicalDiagnosis && (
            <p className="mt-2 text-xs leading-5 text-zinc-500">Diagnóstico: {order.technicalDiagnosis}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Timeline de reparación</h4>
        <div className="mt-4 space-y-3">
          {order.statusHistory.map((entry, index) => (
            <div key={`${entry.status}-${entry.changedAt}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-950 ring-4 ring-zinc-100" />
              <div>
                <p className="text-sm font-semibold text-zinc-900">{entry.status}</p>
                <p className="text-xs text-zinc-500">{formatOrderDate(entry.changedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resumen financiero</h4>
          <p className={order.balanceDue > 0 ? "text-sm font-bold text-amber-700" : "text-sm font-bold text-emerald-700"}>
            {order.balanceDue > 0 ? "Saldo pendiente" : "Sin saldo"}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniMoney label="Mano de obra" value={order.laborTotal} />
          <MiniMoney label="Repuestos" value={order.partsSubtotal} />
          <MiniMoney label="Anticipo" value={order.advance ?? 0} />
          <MiniMoney label="Pago" value={order.finalPayment ?? 0} />
        </div>
        <div className="mt-3 rounded-2xl bg-zinc-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">Total final</span>
            <span className="text-lg font-semibold">{formatCurrency(order.finalTotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-xs text-zinc-300">Saldo</span>
            <span className="text-lg font-semibold">{formatCurrency(order.balanceDue)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Repuestos utilizados</h4>
        <div className="mt-3 space-y-2">
          {order.parts.length > 0 ? order.parts.map((part) => (
            <div key={part.productId} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{part.productName}</p>
                <p className="text-xs text-zinc-500">{part.quantity} x {formatCurrency(part.unitPrice)}</p>
              </div>
              <p className="text-sm font-semibold text-zinc-950">{formatCurrency(part.subtotal)}</p>
            </div>
          )) : (
            <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-500">Sin repuestos registrados.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Garantía</h4>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <CompactFact label="Vigencia" value={order.warrantyExpiresAt ? formatCompactDate(order.warrantyExpiresAt) : "—"} helper={`${order.warrantyDays ?? 90} días`} />
          <CompactFact label="Técnico" value={order.technicianName ?? "—"} helper={order.paidAt ? `Pago: ${formatCompactDate(order.paidAt)}` : "Pago pendiente"} />
        </div>
      </section>
    </div>
  );
}

function CompactFact({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-zinc-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-900">{value}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{helper}</p>
    </div>
  );
}

function MiniMoney({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-950">{formatCurrency(value)}</p>
    </div>
  );
}
