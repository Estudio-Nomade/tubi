import type {
  SearchViajesQuery,
  ViajeDetail,
  ViajeListItem,
  ViajesRepository,
} from "@/domain/viajes";

export function createViajesService(repo: ViajesRepository) {
  return {
    search(query: SearchViajesQuery): Promise<ViajeListItem[]> {
      return repo.search(query);
    },
    getById(id: string): Promise<ViajeDetail | null> {
      return repo.findById(id);
    },
  };
}

export type ViajesService = ReturnType<typeof createViajesService>;
