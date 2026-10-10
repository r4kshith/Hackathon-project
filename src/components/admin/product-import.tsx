"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, Check, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Button, Select } from "../ui";
import { importProductsAction, previewSpreadsheetAction } from "../../app/admin/import/actions";

type Category = { id: string; name: string };
type Preview = { headers: string[]; rows: { rowNumber: number; values: string[] }[]; fileName: string };
type Field = "name" | "description" | "price" | "sku" | "stock" | "categoryName" | "imageUrl";
const fields: { key: Field; label: string; required?: boolean; aliases: string[] }[] = [
  { key: "name", label: "Product name", required: true, aliases: ["name", "product", "product name", "product_name", "title", "item", "item name"] },
  { key: "description", label: "Description", aliases: ["description", "details", "product description", "desc"] },
  { key: "price", label: "Price", required: true, aliases: ["price", "cost", "cost ₹", "amount", "rate", "sale price"] },
  { key: "sku", label: "SKU", aliases: ["sku", "product code", "code", "item number", "product id"] },
  { key: "stock", label: "Stock quantity", aliases: ["stock", "inventory", "qty", "quantity", "available"] },
  { key: "categoryName", label: "Category", aliases: ["category", "collection", "type", "product category"] },
  { key: "imageUrl", label: "Image URL", aliases: ["image url", "imageurl", "image", "photo url", "photo", "image link"] },
];
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function ProductImport({ categories }: { categories: Category[] }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<Field, number>>({ name: -1, description: -1, price: -1, sku: -1, stock: -1, categoryName: -1, imageUrl: -1 });
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [errors, setErrors] = useState<{ rowNumber: number; message: string }[]>([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const mappedRows = useMemo(() => preview?.rows.map((row) => ({
    rowNumber: row.rowNumber,
    name: mapping.name >= 0 ? row.values[mapping.name] ?? "" : "",
    description: mapping.description >= 0 ? row.values[mapping.description] ?? "" : "",
    price: mapping.price >= 0 ? row.values[mapping.price] ?? "" : "",
    sku: mapping.sku >= 0 ? row.values[mapping.sku] ?? "" : "",
    stock: mapping.stock >= 0 ? row.values[mapping.stock] ?? "0" : "0",
    categoryName: mapping.categoryName >= 0 ? row.values[mapping.categoryName] ?? "" : "",
    imageUrl: mapping.imageUrl >= 0 ? row.values[mapping.imageUrl] ?? "" : "",
  })) ?? [], [preview, mapping]);
  const mappingProblems = fields.filter((field) => field.required && mapping[field.key] < 0);
  const rowProblems = useMemo(() => {
    const report: { rowNumber: number; message: string }[] = [];
    const names = new Set<string>(); const skus = new Set<string>();
    for (const row of mappedRows) {
      if (!row.name.trim()) report.push({ rowNumber: row.rowNumber, message: "Product name is missing." });
      if (!row.price || !Number.isFinite(Number(row.price.replace(/[$₹,\s]/g, ""))) || Number(row.price.replace(/[$₹,\s]/g, "")) <= 0) report.push({ rowNumber: row.rowNumber, message: "Price must be a positive number." });
      const nameKey = normalize(row.name); const skuKey = normalize(row.sku);
      if (nameKey && names.has(nameKey)) report.push({ rowNumber: row.rowNumber, message: `Duplicate name: ${row.name}.` });
      if (skuKey && skus.has(skuKey)) report.push({ rowNumber: row.rowNumber, message: `Duplicate SKU: ${row.sku}.` });
      if (nameKey) names.add(nameKey); if (skuKey) skus.add(skuKey);
      if (row.stock.trim() && (!Number.isInteger(Number(row.stock)) || Number(row.stock) < 0)) report.push({ rowNumber: row.rowNumber, message: "Stock must be a whole number of zero or more." });
    }
    return report;
  }, [mappedRows]);

  function chooseFile(file?: File) {
    setPreview(null); setErrors([]); setResult(""); setError("");
    if (!file) return;
    const form = new FormData(); form.set("file", file);
    startTransition(async () => {
      const response = await previewSpreadsheetAction(form);
      if ("error" in response) { setError(response.error ?? "Could not read this file."); return; }
      const autoMap = { ...mapping };
      fields.forEach((field) => {
        const found = response.headers.findIndex((header) => field.aliases.includes(normalize(header)));
        autoMap[field.key] = found;
      });
      setMapping(autoMap); setPreview(response);
    });
  }
  function importRows() {
    setError(""); setErrors([]); setResult("");
    startTransition(async () => {
      const response = await importProductsAction({ rows: mappedRows, defaultCategoryId: defaultCategoryId || null });
      if ("error" in response) { setError(response.error ?? "Import failed."); return; }
      setResult(`${response.imported} product${response.imported === 1 ? "" : "s"} imported.`);
      setErrors(response.errors);
    });
  }

  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Bring it all in</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Import products</h1><p className="mt-2 text-sm text-muted">Upload a spreadsheet, match its columns, and review every row before it goes live.</p></div><a href="/product-import-template.csv" download className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold"><Download size={16} className="mr-2"/>Download template</a></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]"><section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><FileSpreadsheet size={19}/></span><div><h2 className="font-semibold">Choose a catalogue file</h2><p className="mt-1 text-xs leading-5 text-muted">CSV or Excel (.xlsx), up to 5 MB and 500 product rows.</p></div></div><label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-background px-4 text-center hover:border-primary/50"><Upload size={22} className="text-primary"/><span className="mt-2 text-sm font-semibold">{pending && !preview ? "Reading your file…" : "Choose a CSV or Excel file"}</span><span className="mt-1 text-xs text-muted">The file is previewed before any products are saved.</span><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" disabled={pending} onChange={(event) => chooseFile(event.target.files?.[0])}/></label>
      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{error}</p>}
      {preview && <div className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Column mapping</p><h3 className="mt-1 text-lg font-semibold">{preview.fileName}</h3><p className="mt-1 text-xs text-muted">{preview.rows.length} rows · {mappingProblems.length ? "Required columns still need mapping" : "Ready to preview"}</p></div><label className="text-xs font-medium">Default category<select value={defaultCategoryId} onChange={(event) => setDefaultCategoryId(event.target.value)} className="mt-1 block min-h-10 rounded-xl border border-line bg-white px-3 text-sm"><option value="">Use categories from the file</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fields.map((field) => <label key={field.key} className="text-xs font-medium">{field.label}{field.required && <span className="ml-1 text-red-700">Required</span>}<Select value={mapping[field.key]} onChange={(event) => setMapping({ ...mapping, [field.key]: Number(event.target.value) })} className="mt-1 min-h-10"><option value={-1}>Not mapped</option>{preview.headers.map((header, index) => <option key={`${index}-${header}`} value={index}>{header || `Column ${index + 1}`}</option>)}</Select></label>)}</div>
        {mappingProblems.length > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Map the required fields: {mappingProblems.map((field) => field.label).join(", ")}.</p>}
        <div className="mt-5 hidden overflow-hidden rounded-xl border border-line md:block"><table className="w-full text-left text-xs"><thead className="bg-background text-muted"><tr><th className="p-3">Row</th><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">SKU</th><th className="p-3">Stock</th><th className="p-3">Category</th></tr></thead><tbody className="divide-y divide-line">{mappedRows.slice(0, 8).map((row) => <tr key={row.rowNumber}><td className="p-3 text-muted">{row.rowNumber}</td><td className="p-3 font-medium">{row.name || <span className="text-red-700">Missing</span>}</td><td className="p-3">{row.price || <span className="text-red-700">Missing</span>}</td><td className="p-3">{row.sku || "—"}</td><td className="p-3">{row.stock || "0"}</td><td className="p-3">{row.categoryName || "Default"}</td></tr>)}</tbody></table></div><div className="mt-4 space-y-2 md:hidden">{mappedRows.slice(0, 5).map((row) => <article key={row.rowNumber} className="rounded-xl border border-line bg-white p-3"><div className="flex justify-between gap-2"><strong className="line-clamp-1 text-sm">{row.name || <span className="text-red-700">Missing name</span>}</strong><span className="shrink-0 text-xs text-muted">Row {row.rowNumber}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"><span>{row.price ? `₹${row.price}` : <span className="text-red-700">Missing price</span>}</span><span>{row.sku || "No SKU"}</span><span>{row.stock || "0"} in stock</span></div></article>)}</div>
        {rowProblems.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">{rowProblems.length} preview issue{rowProblems.length === 1 ? "" : "s"} to review</p><ul className="mt-2 max-h-24 space-y-1 overflow-auto text-xs">{rowProblems.slice(0, 8).map((item, index) => <li key={`${item.rowNumber}-${index}`}>Row {item.rowNumber}: {item.message}</li>)}</ul></div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="max-w-lg text-xs leading-5 text-muted">Duplicate names or SKUs and invalid prices are skipped with a row-by-row report. You approve this import by pressing the button.</p><Button onClick={importRows} disabled={pending || mappingProblems.length > 0}>{pending ? "Importing…" : "Import valid rows"}</Button></div>
      </div>}
      {result && <div role="status" className="mt-5 rounded-2xl bg-accent/60 p-4"><p className="flex items-center gap-2 font-semibold text-primary"><Check size={17}/>{result}</p>{errors.length > 0 && <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3"><p className="text-sm font-semibold text-amber-900">{errors.length} row{errors.length === 1 ? "" : "s"} skipped</p><ul className="mt-2 max-h-36 space-y-1 overflow-auto text-xs text-muted">{errors.map((item, index) => <li key={`${item.rowNumber}-${index}`}>Row {item.rowNumber}: {item.message}</li>)}</ul></div>}</div>}
    </section><aside className="h-fit rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold">A few tips for a smooth import</h2><ul className="mt-4 space-y-3 text-sm text-muted"><li className="flex gap-2"><span className="font-bold text-primary">01</span><span>Use one header row. The mapper recognizes common names like “Item”, “Cost”, “Qty” and “Photo URL”.</span></li><li className="flex gap-2"><span className="font-bold text-primary">02</span><span>Name and price are required. Stock can be blank and starts at zero.</span></li><li className="flex gap-2"><span className="font-bold text-primary">03</span><span>Existing or repeated product names and SKUs are reported and skipped.</span></li><li className="flex gap-2"><span className="font-bold text-primary">04</span><span>Unknown collection names in the file become new custom categories.</span></li></ul><a href="/sample-messy-catalogue.csv" download className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"><Download size={15} className="mr-2"/>Try the messy sample file</a></aside></div>
  </div>;
}
