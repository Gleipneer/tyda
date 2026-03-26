import { get, post, put, del } from "./api";
import type { Post, PostCreate } from "@/types/posts";

interface FetchPostsOptions {
  anvandarId?: number;
  synlighet?: "privat" | "publik";
}

export function fetchPosts(options?: FetchPostsOptions): Promise<Post[]> {
  const params = new URLSearchParams();
  if (options?.anvandarId) params.set("anvandar_id", String(options.anvandarId));
  if (options?.synlighet) params.set("synlighet", options.synlighet);
  const qs = params.toString();
  return get<Post[]>(`/posts${qs ? `?${qs}` : ""}`);
}

export function fetchPublicPosts(): Promise<Post[]> {
  return get<Post[]>("/posts/public");
}

export function fetchPost(id: number): Promise<Post> {
  return get<Post>(`/posts/${id}`);
}

export function fetchPublicPost(id: number): Promise<Post> {
  return get<Post>(`/posts/public/${id}`);
}

export function createPost(data: PostCreate): Promise<{ post_id: number; message: string }> {
  return post<{ post_id: number; message: string }>("/posts", data);
}

export function updatePost(id: number, data: Partial<PostCreate>): Promise<{ message: string }> {
  return put<{ message: string }>(`/posts/${id}`, data);
}

export function deletePost(id: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/posts/${id}`);
}
