import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const knowledgePath = resolve("data/repair-knowledge.json");

const rules = [
  [/AppleFix\s*Telefonos/gi, "Historial de reparaciones"],
  [/Apple\s+Fix/gi, "Centro de servicio"],
  [/AppleFix/gi, "Taller"],
];

function sanitize(value) {
  if (typeof value === "string") {
    return rules.reduce((text, [pattern, replacement]) => {
      return text.replace(pattern, replacement);
    }, value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitize(entry)]),
    );
  }

  return value;
}

const knowledge = JSON.parse(readFileSync(knowledgePath, "utf8"));
writeFileSync(knowledgePath, `${JSON.stringify(sanitize(knowledge), null, 2)}\n`);

console.log("repair-knowledge.json sanitized");
