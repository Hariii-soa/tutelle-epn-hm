import "dotenv/config";
import argon2 from "argon2";
import { blindIndex, encrypt } from "../../src/common/crypto/aes-gcm.js";
import { prisma } from "../../src/common/db/prisma.js";

const pwd = process.env.SEED_ADMIN_PASSWORD;
const email = process.env.SEED_ADMIN_EMAIL;
if (!pwd || !email) throw new Error("SEED_ADMIN_PASSWORD / SEED_ADMIN_EMAIL manquant");

const admin = await prisma.user.findFirst({
  where: { OR: [{ identifiant: "admin" }, { identifiant: email }, { matricule: "ADMIN" }] },
});
if (!admin) throw new Error("Aucun admin en base : lance le seed");

await prisma.user.update({
  where: { id: admin.id },
  data: {
    identifiant: "admin",
    emailEnc: encrypt(email),
    emailIdx: blindIndex(email),
    passwordHash: await argon2.hash(pwd, { type: argon2.argon2id }),
    failedAttempts: 0,
    lockedUntil: null,
    tokenVersion: { increment: 1 },
  },
});
console.log("Admin réparé :", email);
await prisma.$disconnect();