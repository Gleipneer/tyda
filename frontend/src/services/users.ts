import { get, post } from "./api";

export interface User {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
  skapad_datum?: string;
  ar_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function loginUser(identifier: string, password: string): Promise<TokenResponse> {
  return post<TokenResponse>("/auth/login", { identifier, password });
}

export function fetchMe(): Promise<User> {
  return get<User>("/auth/me");
}

export function createUser(data: { anvandarnamn: string; epost: string; losenord: string }): Promise<TokenResponse> {
  return post<TokenResponse>("/users", data);
}
