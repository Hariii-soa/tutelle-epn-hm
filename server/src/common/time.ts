const MG_OFFSET_MS = 3 * 3600_000; // Indian/Antananarivo : UTC+3, sans DST

export const startOfTodayMg = () => {
  const d = new Date(Date.now() + MG_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - MG_OFFSET_MS);
};