import argon2 from "argon2";

export const hashPassword = (p: string) => argon2.hash(p, { type: argon2.argon2id });
export const verifyPassword = async (hash: string, p: string) => {
  try {
    return await argon2.verify(hash, p);
  } catch {
    return false;
  }
};