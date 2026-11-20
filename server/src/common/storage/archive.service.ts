import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { HttpError } from "../http/errors.js";

const ROOT = path.resolve(env.ARCHIVE_DIR);
const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, "_");
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

export async function savePdf(buf: Buffer, f: { etabCode: string; exercice: number; name: string }) {
  const pdfPath = path.join(safe(f.etabCode), String(f.exercice), `${safe(f.name)}.pdf`);
  const abs = path.join(ROOT, pdfPath);
  await mkdir(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.${process.pid}.tmp`;
  await writeFile(tmp, buf);
  await rename(tmp, abs); // remplace l'existant, écriture atomique
  return { pdfPath, pdfSha256: sha256(buf) };
}

export async function readPdf(pdfPath: string, expectedSha256: string) {
  const abs = path.resolve(ROOT, pdfPath);
  if (!abs.startsWith(ROOT + path.sep)) throw new HttpError(400, "Chemin invalide", "BAD_PATH");
  const buf = await readFile(abs).catch(() => {
    throw new HttpError(404, "Fichier d'archive introuvable", "FILE_MISSING");
  });
  if (sha256(buf) !== expectedSha256)
    throw new HttpError(409, "Intégrité du fichier compromise", "FILE_TAMPERED");
  return buf;
}