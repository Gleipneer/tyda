export type Synlighet = "privat" | "publik";

export interface UserRef {
  anvandar_id: number;
  anvandarnamn: string;
}

export interface CategoryRef {
  kategori_id: number;
  namn: string;
}

export interface Post {
  post_id: number;
  titel: string;
  innehall: string;
  synlighet: Synlighet;
  skapad_datum: string;
  anvandar: UserRef;
  kategori: CategoryRef;
}

export interface PostCreate {
  kategori_id: number;
  titel: string;
  innehall: string;
  synlighet: Synlighet;
}
