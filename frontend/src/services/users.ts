import { get, post } from "./api";

export interface User {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
}

export function fetchUsers(): Promise<User[]> {
  return get<User[]>("/users");
}

export function createUser(data: { anvandarnamn: string; epost: string }): Promise<User> {
  return post<User>("/users", data);
}
