import { get, post } from "./api";
import type { SessionUser } from "./authStorage";

export interface User {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
  skapad_datum?: string;
  ar_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function loginUser(identifier: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/login", { identifier, password });
}

export function createUser(data: { anvandarnamn: string; epost: string; losenord: string }): Promise<AuthResponse> {
  return post<AuthResponse>("/users", data);
}

/** Bygger SessionUser för localStorage efter inloggning/registrering. */
export function toSessionUser(res: AuthResponse): SessionUser {
  return {
    ...res.user,
    access_token: res.access_token,
  };
}
