import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const key = Buffer.from(process.env.ENC_KEY ?? "", "hex");
const idxKey = Buffer.from(process.env.IDX_KEY ?? "", "hex");
if (key.length !== 32 || idxKey.length !== 32) throw new Error("ENC_KEY / IDX_KEY invalides");

const IV_LEN = 12;
const TAG_LEN = 16;

export const encrypt = (plain: string): string => {
  const iv = randomBytes(IV_LEN);
  const c = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
};

export const decrypt = (b64: string): string => {
  const buf = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", key, buf.subarray(0, IV_LEN), {
    authTagLength: TAG_LEN,
  });
  d.setAuthTag(buf.subarray(IV_LEN, IV_LEN + TAG_LEN));
  return Buffer.concat([d.update(buf.subarray(IV_LEN + TAG_LEN)), d.final()]).toString("utf8");
};

export const blindIndex = (v: string): string =>
  createHmac("sha256", idxKey).update(v.trim().toLowerCase()).digest("hex");