import type { SearchViajesQuery, ViajeDetail, ViajeListItem } from "./types";

export interface ViajesRepository {
  search(query: SearchViajesQuery): Promise<ViajeListItem[]>;
  findById(id: string): Promise<ViajeDetail | null>;
}
