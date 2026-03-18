import { get } from "./api";

export interface Category {
  kategori_id: number;
  namn: string;
  beskrivning?: string;
}

export function fetchCategories(): Promise<Category[]> {
  return get<Category[]>("/categories");
}
