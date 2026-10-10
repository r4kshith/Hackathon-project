"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { z } from "zod";
import { tenantData } from "../../../lib/tenant";

export async function previewSpreadsheetAction(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Choose a CSV or Excel file first." };
  if (file.size === 0 || file.size > 5_000_000) return { error: "Files must be between 1 byte and 5 MB." };
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "csv" && extension !== "xlsx") return { error: "Use a .csv or .xlsx file." };
  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (extension === "csv") await workbook.csv.read(Readable.from([buffer]) as never);
    else await workbook.xlsx.load(buffer as never);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) return { error: "The first sheet needs a header and at least one product row." };
    if (sheet.actualColumnCount > 40) return { error: "This sheet has too many columns. Keep it to 40 or fewer." };
    if (sheet.actualRowCount > 501) return { error: "Import up to 500 product rows at a time." };
    const headerCount = sheet.actualColumnCount;
    const headers = Array.from({ length: headerCount }, (_, index) => sheet.getCell(1, index + 1).text.trim());
    if (headers.every((header) => !header)) return { error: "We couldn't find column headers in the first row." };
    const rows: { rowNumber: number; values: string[] }[] = [];
    for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber++) {
      const values = Array.from({ length: headerCount }, (_, index) => sheet.getCell(rowNumber, index + 1).text.trim());
      if (values.some(Boolean)) rows.push({ rowNumber, values });
    }
    if (!rows.length) return { error: "No product rows found below the header." };
    return { headers, rows, fileName: file.name };
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "spreadsheet_preview_failed", error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't read that file. Check that it is a valid CSV or Excel workbook." };
  }
}

const rowSchema = z.object({ rowNumber: z.number().int().min(2), name: z.string().trim().min(2).max(120), description: z.string().trim().max(4000), price: z.string(), sku: z.string().trim().max(60), stock: z.string(), categoryName: z.string().trim().max(50), imageUrl: z.string().trim().max(2048) });

function slugify(value: string) { return `${value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "category"}-${crypto.randomUUID().slice(0, 5)}`; }
function key(value: string) { return value.normalize("NFKD").trim().toLowerCase().replace(/[^a-z0-9]+/g, " "); }

export async function importProductsAction(raw: unknown) {
  const parsed = z.object({ rows: z.array(z.unknown()).min(1).max(500), defaultCategoryId: z.string().nullable() }).safeParse(raw);
  if (!parsed.success) return { error: "The import preview expired. Upload the file again." };
  const scoped = await tenantData();
  if (parsed.data.defaultCategoryId && !await scoped.categories.exists(parsed.data.defaultCategoryId)) return { error: "Choose a category from your store." };
  const existingProducts = await scoped.products.list();
  const existingNames = new Set(existingProducts.map((product) => key(product.name)));
  const existingSkus = new Set(existingProducts.map((product) => product.sku?.trim().toLowerCase()).filter(Boolean));
  const batchNames = new Set<string>(); const batchSkus = new Set<string>();
  const categories = await scoped.categories.list();
  const categoryMap = new Map(categories.map((category) => [key(category.name), category.id]));
  const errors: { rowNumber: number; message: string }[] = [];
  let imported = 0;
  for (const rawRow of parsed.data.rows) {
    const rowParsed = rowSchema.safeParse(rawRow);
    if (!rowParsed.success) { errors.push({ rowNumber: 0, message: rowParsed.error.issues[0]?.message ?? "Invalid row" }); continue; }
    const row = rowParsed.data;
    const price = Number(row.price.replace(/[$₹,\s]/g, ""));
    const stock = Number(row.stock.trim() || "0");
    if (!Number.isFinite(price) || price <= 0) { errors.push({ rowNumber: row.rowNumber, message: "Price must be a positive number." }); continue; }
    if (!Number.isInteger(stock) || stock < 0) { errors.push({ rowNumber: row.rowNumber, message: "Stock must be a whole number of zero or more." }); continue; }
    if (row.imageUrl && !/^https:\/\//i.test(row.imageUrl)) { errors.push({ rowNumber: row.rowNumber, message: "Image URL must start with https://." }); continue; }
    const normalizedName = key(row.name); const normalizedSku = row.sku.trim().toLowerCase();
    if (existingNames.has(normalizedName) || batchNames.has(normalizedName)) { errors.push({ rowNumber: row.rowNumber, message: `Duplicate product name: ${row.name}.` }); continue; }
    if (normalizedSku && (existingSkus.has(normalizedSku) || batchSkus.has(normalizedSku))) { errors.push({ rowNumber: row.rowNumber, message: `Duplicate SKU: ${row.sku}.` }); continue; }
    let categoryId = parsed.data.defaultCategoryId;
    if (row.categoryName) {
      const categoryKey = key(row.categoryName);
      categoryId = categoryMap.get(categoryKey) ?? null;
      if (!categoryId) {
        const created = await scoped.categories.create(row.categoryName, slugify(row.categoryName));
        categoryId = created.id; categoryMap.set(categoryKey, categoryId);
      }
    }
    try {
      await scoped.products.create({ name: row.name, slug: slugify(row.name), sku: row.sku || null, description: row.description || `${row.name}, thoughtfully chosen for your shop.`, price, compareAt: null, stock, active: true, categoryId, imageUrl: row.imageUrl || null });
      imported++; existingNames.add(normalizedName); if (normalizedSku) existingSkus.add(normalizedSku); batchNames.add(normalizedName); if (normalizedSku) batchSkus.add(normalizedSku);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") errors.push({ rowNumber: row.rowNumber, message: "SKU is already used in this store." });
      else { console.error(JSON.stringify({ level: "error", event: "product_import_row_failed", storeId: scoped.storeId, rowNumber: row.rowNumber })); errors.push({ rowNumber: row.rowNumber, message: "Could not save this row." }); }
    }
  }
  return { ok: true, imported, errors };
}
