"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
  type InventoryImportSummary,
  type InventoryProduct,
} from "@/lib/inventory-types";

type FormState = {
  category: InventoryCategory;
  name: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
  connector: string;
  boxColor: string;
  visualLocation: string;
  purchasePrice: string;
  salePrice: string;
  minimumPrice: string;
  stock: string;
  lowStockThreshold: string;
};

const emptyForm: FormState = {
  category: "Audifonos",
  name: "",
  brand: "",
  model: "",
  variant: "",
  color: "",
  connector: "",
  boxColor: "",
  visualLocation: "",
  purchasePrice: "",
  salePrice: "",
  minimumPrice: "",
  stock: "0",
  lowStockThreshold: "2",
};

function inputClassName() {
  return "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
}

function formFromProduct(product: InventoryProduct): FormState {
  return {
    category: product.category,
    name: product.name,
    brand: product.brand,
    model: product.model ?? "",
    variant: product.variant ?? "",
    color: product.color ?? "",
    connector: product.connector ?? "",
    boxColor: product.boxColor ?? "",
    visualLocation: product.visualLocation ?? "",
    purchasePrice: product.purchasePrice?.toString() ?? "",
    salePrice: product.salePrice?.toString() ?? "",
    minimumPrice: product.minimumPrice?.toString() ?? "",
    stock: product.stock.toString(),
    lowStockThreshold: product.lowStockThreshold.toString(),
  };
}

function buildPayload(form: FormState) {
  return {
    category: form.category,
    name: form.name,
    brand: form.brand,
    model: form.model,
    variant: form.variant,
    color: form.color,
    connector: form.connector,
    boxColor: form.boxColor,
    visualLocation: form.visualLocation,
    purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
    salePrice: form.salePrice ? Number(form.salePrice) : undefined,
    minimumPrice: form.minimumPrice ? Number(form.minimumPrice) : undefined,
    stock: form.stock ? Number(form.stock) : 0,
    lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : 2,
  };
}

export default function InventoryModule() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<InventoryCategory | "Todos">("Todos");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [summary, setSummary] = useState<InventoryImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("No se pudo cargar el inventario.");
      const data = (await response.json()) as { products: InventoryProduct[] };
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventario.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesSearch =
        !query ||
        [
          product.name,
          product.brand,
          product.model,
          product.variant,
          product.color,
          product.connector,
          product.boxColor,
          product.visualLocation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
  };

  const openEdit = (product: InventoryProduct) => {
    setEditingProduct(product);
    setForm(formFromProduct(product));
    setFormOpen(true);
    setError("");
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      setError("Marca y producto son obligatorios.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = buildPayload(form);
      const response = await fetch(
        editingProduct ? `/api/inventory/${encodeURIComponent(editingProduct.id)}` : "/api/inventory",
        {
          method: editingProduct ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el producto.");

      setFormOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar producto.");
    } finally {
      setIsSaving(false);
    }
  };

  const adjustStock = async (product: InventoryProduct, stockDelta: number) => {
    setError("");
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(product.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockDelta }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar stock.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar stock.");
    }
  };

  const deleteProduct = async (product: InventoryProduct) => {
    setError("");
    try {
      const response = await fetch(`/api/inventory/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar el producto.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar producto.");
    }
  };

  const importExcel = async (file: File | undefined) => {
    if (!file) return;

    setIsImporting(true);
    setError("");
    setSummary(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { summary?: InventoryImportSummary; error?: string };
      if (!response.ok || !data.summary) throw new Error(data.error ?? "No se pudo importar Excel.");
      setSummary(data.summary);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              RepairCopilot AI
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inventario</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(event) => void importExcel(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-60"
            >
              {isImporting ? "Importando..." : "Importar Excel"}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Agregar producto
            </button>
          </div>
        </div>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Productos</p>
            <p className="mt-1 text-2xl font-semibold">{products.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Stock total</p>
            <p className="mt-1 text-2xl font-semibold">
              {products.reduce((total, product) => total + product.stock, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-700">Stock bajo</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900">{lowStockProducts.length}</p>
          </div>
        </section>

        {lowStockProducts.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Alerta de stock bajo: {lowStockProducts.slice(0, 4).map((product) => product.name).join(", ")}
            {lowStockProducts.length > 4 ? ` y ${lowStockProducts.length - 4} mas` : ""}.
          </div>
        )}

        {summary && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Importacion {summary.catalogType}: {summary.processedRows} filas, {summary.added} nuevos,{" "}
            {summary.updated} actualizados, {summary.skipped} omitidos.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white">
          <div className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-[1fr_240px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por producto, marca, modelo, color..."
              className={inputClassName()}
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as InventoryCategory | "Todos")}
              className={inputClassName()}
            >
              <option value="Todos">Todas las categorias</option>
              {INVENTORY_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Detalle</th>
                  <th className="px-4 py-3 font-semibold">Venta</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      Cargando inventario...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      No hay productos para mostrar.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-950">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.brand}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{product.category}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {[product.variant, product.connector, product.color, product.boxColor, product.visualLocation]
                          .filter(Boolean)
                          .join(" · ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{formatCurrency(product.salePrice, "-")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void adjustStock(product, -1)}
                            className="h-8 w-8 rounded-md border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            -
                          </button>
                          <span
                            className={
                              "min-w-10 rounded-md px-2 py-1 text-center font-semibold " +
                              (product.stock <= product.lowStockThreshold
                                ? "bg-amber-100 text-amber-900"
                                : "bg-zinc-100 text-zinc-800")
                            }
                          >
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => void adjustStock(product, 1)}
                            className="h-8 w-8 rounded-md border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProduct(product)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingProduct ? "Editar producto" : "Agregar producto"}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {editingProduct?.sourceCatalog ?? "Producto manual"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Categoria">
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as InventoryCategory })
                  }
                  className={inputClassName()}
                >
                  {INVENTORY_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca *">
                <input
                  value={form.brand}
                  onChange={(event) => setForm({ ...form, brand: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Producto *">
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Modelo">
                <input
                  value={form.model}
                  onChange={(event) => setForm({ ...form, model: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Tipo / Variante">
                <input
                  value={form.variant}
                  onChange={(event) => setForm({ ...form, variant: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Color">
                <input
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Conector">
                <input
                  value={form.connector}
                  onChange={(event) => setForm({ ...form, connector: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Color de caja">
                <input
                  value={form.boxColor}
                  onChange={(event) => setForm({ ...form, boxColor: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Ubicacion visual">
                <input
                  value={form.visualLocation}
                  onChange={(event) => setForm({ ...form, visualLocation: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Precio venta">
                <input
                  type="number"
                  value={form.salePrice}
                  onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Precio minimo">
                <input
                  type="number"
                  value={form.minimumPrice}
                  onChange={(event) => setForm({ ...form, minimumPrice: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  className={inputClassName()}
                />
              </Field>
              <Field label="Alerta stock bajo">
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(event) =>
                    setForm({ ...form, lowStockThreshold: event.target.value })
                  }
                  className={inputClassName()}
                />
              </Field>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveProduct()}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
