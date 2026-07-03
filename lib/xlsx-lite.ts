import { inflateRawSync } from "zlib";

type ZipEntry = {
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};

export type XlsxSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

function readUInt16(buffer: Buffer, offset: number): number {
  return buffer.readUInt16LE(offset);
}

function readUInt32(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function readZipEntries(buffer: Buffer): Map<string, ZipEntry> {
  let endOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (readUInt32(buffer, index) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }

  if (endOffset === -1) {
    throw new Error("El archivo no parece ser un Excel válido.");
  }

  const totalEntries = readUInt16(buffer, endOffset + 10);
  const centralDirectoryOffset = readUInt32(buffer, endOffset + 16);
  const entries = new Map<string, ZipEntry>();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (readUInt32(buffer, offset) !== 0x02014b50) {
      throw new Error("No se pudo leer la estructura interna del Excel.");
    }

    const method = readUInt16(buffer, offset + 10);
    const compressedSize = readUInt32(buffer, offset + 20);
    const localHeaderOffset = readUInt32(buffer, offset + 42);
    const nameLength = readUInt16(buffer, offset + 28);
    const extraLength = readUInt16(buffer, offset + 30);
    const commentLength = readUInt16(buffer, offset + 32);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");

    entries.set(name, { method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipText(buffer: Buffer, entries: Map<string, ZipEntry>, name: string): string {
  const entry = entries.get(name);
  if (!entry) return "";

  const localOffset = entry.localHeaderOffset;
  if (readUInt32(buffer, localOffset) !== 0x04034b50) {
    throw new Error("No se pudo leer una hoja del Excel.");
  }

  const nameLength = readUInt16(buffer, localOffset + 26);
  const extraLength = readUInt16(buffer, localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) return compressed.toString("utf8");
  if (entry.method === 8) return inflateRawSync(compressed).toString("utf8");

  throw new Error("El Excel usa un método de compresión no soportado.");
}

function readSharedStrings(xml: string): string[] {
  if (!xml) return [];

  const strings: string[] = [];
  const items = xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g);

  for (const item of items) {
    const textParts = Array.from(item[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((match) =>
      decodeXml(match[1]),
    );
    strings.push(textParts.join(""));
  }

  return strings;
}

function attr(source: string, name: string): string {
  const match = source.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : "";
}

function columnFromCell(cellRef: string): string {
  return cellRef.replace(/[0-9]/g, "");
}

function readCellValue(cellAttrs: string, cellXml: string, sharedStrings: string[]): string {
  const type = attr(cellAttrs, "t");

  if (type === "s") {
    const value = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
    return value ? sharedStrings[Number(value)] ?? "" : "";
  }

  if (type === "inlineStr") {
    return Array.from(cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
      .map((match) => decodeXml(match[1]))
      .join("");
  }

  return decodeXml(cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
}

export function readFirstSheet(buffer: Buffer): XlsxSheet {
  const entries = readZipEntries(buffer);
  const sharedStrings = readSharedStrings(readZipText(buffer, entries, "xl/sharedStrings.xml"));
  const sheetXml = readZipText(buffer, entries, "xl/worksheets/sheet1.xml");

  if (!sheetXml) {
    throw new Error("El Excel no contiene una hoja principal legible.");
  }

  const rawRows: Array<Record<string, string>> = [];
  const rowMatches = sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const cells: Record<string, string> = {};
    const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const cellRef = attr(cellMatch[1], "r");
      const column = columnFromCell(cellRef);
      cells[column] = readCellValue(cellMatch[1], cellMatch[2], sharedStrings).trim();
    }

    rawRows.push(cells);
  }

  const headerRow = rawRows[0] ?? {};
  const columns = Object.keys(headerRow).sort((a, b) => a.localeCompare(b));
  const headers = columns.map((column) => headerRow[column]);

  const rows = rawRows.slice(1).map((row) => {
    const item: Record<string, string> = {};
    columns.forEach((column, index) => {
      const header = headers[index];
      if (header) item[header] = row[column] ?? "";
    });
    return item;
  });

  return {
    headers,
    rows: rows.filter((row) => Object.values(row).some((value) => value.trim() !== "")),
  };
}
