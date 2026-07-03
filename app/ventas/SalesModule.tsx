"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import type { SaleRecord } from "@/lib/sales-types";
import { registerSaleForPage, type SalesProduct } from "./actions";

function inputClassName() {
  return "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
}

function productDetail(product: SalesProduct) {
  return [product.variant, product.connector, product.color, product.boxColor, product.visualLocation]
    .filter(Boolean)
    .join(" · ");
}

function productPrice(product: SalesProduct) {
  return product.salePrice ?? product.minimumPrice ?? 0;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function SalesModule({ initialProducts, initialSales }: { initialProducts: SalesProduct[]; initialSales: SaleRecord[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState(initialSales);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (!query) return true;
      return [
        product.name,
        product.brand,
        product.model,
        product.variant,
        product.color,
        product.connector,
        product.boxColor,
        product.visualLocation,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [products, search]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const unitPrice = selectedProduct ? productPrice(selectedProduct) : 0;
  const total = unitPrice * quantity;

  const selectProduct = (product: SalesProduct) => {
    setSelectedProductId(product.id);
    setQuantity(product.stock > 0 ? 1 : 0);
    setError("");
    setSuccess("");
  };

  const confirmSale = async () => {
    if (!selectedProduct) {
      setError("Selecciona un producto para registrar la venta.");
      return;
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }
    if (quantity > selectedProduct.stock) {
      setError("La cantidad supera el stock disponible.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await registerSaleForPage(selectedProduct.id, quantity);
      setProducts(data.products);
      setSales(data.sales);
      setSelectedProductId("");
      setQuantity(1);
      setSuccess(`Venta registrada: ${data.sale.productName} x${data.sale.quantity}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setIsSaving(false);
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
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ventas</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Registro rápido de accesorios con descuento automático de inventario local.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            Ventas registradas: <span className="font-semibold text-zinc-950">{sales.length}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por producto, marca, modelo, color..."
                className={inputClassName()}
              />
            </div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[840px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Detalle</th>
                    <th className="px-4 py-3 font-semibold">Precio</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
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
                        <td className="px-4 py-3 text-zinc-600">{productDetail(product) || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{formatCurrency(productPrice(product), "-")}</td>
                        <td className="px-4 py-3">
                          <span className={product.stock <= 0 ? "rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700" : "rounded-md bg-zinc-100 px-2 py-1 font-semibold text-zinc-800"}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => selectProduct(product)}
                            disabled={product.stock <= 0}
                            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Confirmar venta</h2>
            {selectedProduct ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-zinc-50 p-4">
                  <p className="font-semibold text-zinc-950">{selectedProduct.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{selectedProduct.brand}</p>
                  <p className="mt-2 text-xs text-zinc-500">{productDetail(selectedProduct) || selectedProduct.category}</p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">Cantidad</span>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(0, Number(event.target.value)))}
                    className={inputClassName()}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Precio unitario</p>
                    <p className="mt-1 font-semibold">{formatCurrency(unitPrice)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Total</p>
                    <p className="mt-1 font-semibold">{formatCurrency(total)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void confirmSale()}
                  disabled={isSaving || quantity <= 0 || quantity > selectedProduct.stock}
                  className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Registrando..." : "Confirmar venta"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-zinc-500">
                Selecciona un producto del inventario para calcular precio unitario, cantidad y total.
              </p>
            )}
          </aside>
        </section>

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="text-lg font-semibold">Historial de ventas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Precio unitario</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      Todavía no hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3 text-zinc-600">{formatDate(sale.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-950">{sale.productName}</p>
                        <p className="text-xs text-zinc-500">{sale.productBrand} · {sale.productCategory}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{sale.quantity}</td>
                      <td className="px-4 py-3 text-zinc-700">{formatCurrency(sale.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-950">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
