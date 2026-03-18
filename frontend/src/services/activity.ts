import { get } from "./api";

export interface ActivityEntry {
  logg_id: number;
  post_id: number;
  anvandar_id: number;
  handelse: string;
  tidpunkt: string;
}

export function fetchActivity(): Promise<ActivityEntry[]> {
  return get<ActivityEntry[]>("/activity");
}
