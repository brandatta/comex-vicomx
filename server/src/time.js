import { DateTime } from "luxon";

export const TZ_AR = "America/Argentina/Buenos_Aires";

// MySQL DATETIME string "YYYY-MM-DD HH:mm:ss"
export function nowArSql() {
  return DateTime.now().setZone(TZ_AR).toFormat("yyyy-LL-dd HH:mm:ss");
}

// Para numero de pedido: "YYYYMMDD-HHMMSS"
export function nowArCompact() {
  return DateTime.now().setZone(TZ_AR).toFormat("yyyyLLdd-HHmmss");
}
