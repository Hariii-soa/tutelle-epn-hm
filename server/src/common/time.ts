const MG_OFFSET_MS = 3 * 3600_000; // Indian/Antananarivo : UTC+3, sans DST
const pad = (n: number) => String(n).padStart(2, "0");

export const startOfTodayMg = () => {
  const d = new Date(Date.now() + MG_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - MG_OFFSET_MS);
};

export const currentYearMg = () => new Date(Date.now() + MG_OFFSET_MS).getUTCFullYear();


export const formatDateMg = (d: Date) => {
  const x = new Date(d.getTime() + MG_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(x.getUTCDate())}/${p(x.getUTCMonth() + 1)}/${x.getUTCFullYear()}`;
};