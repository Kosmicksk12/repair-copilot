"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import type { CustomerProfile } from "@/lib/customer-profiles";

function inputClassName() {
  return "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ClientesModule({ initialProfiles }: { initialProfiles: CustomerProfile[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialProfiles[0]?.id ?? "");

  const filteredProfiles = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return initialProfiles;
    return initialProfiles.filter((profile) =>
      normalize([profile.name, profile.phone, ...profile.devices.map((device) => `${device.brand} ${device.model}`)].join(" ")).includes(query),
    );
  }, [initialProfiles, search]);

  const selectedProfile =
    initialProfiles.find((profile) => profile.id === selectedId) ??
    filteredProfiles[0] ??
    null;

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              RepairCopilot AI
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Clientes</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Ficha automática del cliente construida desde órdenes, ventas e inventario local.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            Clientes encontrados: <span className="font-semibold text-zinc-950">{initialProfiles.length}</span>
          </div>
        </div>

        <section className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 p-4">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, teléfono o equipo..."
                className={inputClassName()}
              />
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-3">
              {filteredProfiles.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-400">No hay clientes para mostrar.</p>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setSelectedId(profile.id)}
                      className={
                        "w-full rounded-xl border p-3 text-left transition " +
                        (selectedProfile?.id === profile.id
                          ? "border-zinc-400 bg-zinc-50 ring-1 ring-zinc-200"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      <p className="font-semibold text-zinc-950">{profile.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{profile.phone || "Sin teléfono"}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>{profile.repairCount} reparaciones</span>
                        <span>{formatCurrency(profile.totalSpent)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {selectedProfile ? <CustomerDetail profile={selectedProfile} /> : (
            <section className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
              No hay información de clientes todavía.
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function CustomerDetail({ profile }: { profile: CustomerProfile }) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ficha de cliente</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{profile.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{profile.phone || "Sin teléfono registrado"}</p>
          </div>
          <div className="rounded-xl bg-zinc-950 px-4 py-3 text-white">
            <p className="text-xs text-zinc-300">Total gastado</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(profile.totalSpent)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Última visita" value={formatDate(profile.lastVisit)} />
          <Metric label="Reparaciones" value={profile.repairCount} />
          <Metric label="Compras" value={profile.purchaseCount} />
          <Metric label="Garantías activas" value={profile.activeWarrantyCount} />
          <Metric label="Equipos" value={profile.devices.length} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Historial de reparaciones">
          {profile.repairs.length === 0 ? <Empty text="Sin reparaciones." /> : profile.repairs.map((repair) => (
            <Row key={repair.orderNumber} title={`${repair.orderNumber} · ${repair.equipment}`} meta={`${repair.status} · ${formatDate(repair.createdAt)}`} value={formatCurrency(repair.total)} />
          ))}
        </Panel>

        <Panel title="Historial de compras">
          {profile.purchases.length === 0 ? <Empty text="Sin compras rápidas asociadas." /> : profile.purchases.map((purchase) => (
            <Row key={purchase.id} title={purchase.productName} meta={`${purchase.quantity} x ${formatCurrency(purchase.unitPrice)} · ${formatDate(purchase.createdAt)}`} value={formatCurrency(purchase.total)} />
          ))}
        </Panel>

        <Panel title="Historial de garantías">
          {profile.warranties.length === 0 ? <Empty text="Sin garantías." /> : profile.warranties.map((warranty) => (
            <Row
              key={warranty.orderNumber}
              title={`${warranty.orderNumber} · ${warranty.equipment}`}
              meta={`Vence: ${formatDate(warranty.warrantyExpiresAt)} · ${warranty.warrantyDays ?? 0} días`}
              value={warranty.active ? "Activa" : "Vencida"}
            />
          ))}
        </Panel>

        <Panel title="Equipos registrados">
          {profile.devices.length === 0 ? <Empty text="Sin equipos registrados." /> : profile.devices.map((device) => (
            <Row
              key={device.key}
              title={`${device.brand} ${device.model}`}
              meta={[device.color, device.imei ? `IMEI ${device.imei}` : undefined].filter(Boolean).join(" · ") || "Sin detalle adicional"}
              value={formatDate(device.lastSeenAt)}
            />
          ))}
        </Panel>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      </div>
      <div className="divide-y divide-zinc-100 px-5">{children}</div>
    </section>
  );
}

function Row({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">{title}</p>
        <p className="mt-1 truncate text-xs text-zinc-500">{meta}</p>
      </div>
      <p className="text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-zinc-400">{text}</p>;
}
