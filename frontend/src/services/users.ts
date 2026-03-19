import { get, post } from "./api";

export interface User {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
  skapad_datum?: string;
  ar_admin?: boolean;
}

export function loginUser(identifier: string, password: string): Promise<User> {
  return post<User>("/auth/login", { identifier, password });
}

export function createUser(data: { anvandarnamn: string; epost: string; losenord: string }): Promise<User> {
  return post<User>("/users", data);
}
