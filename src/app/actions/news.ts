"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { filterPublishedNews, NewsCategory } from "@/lib/news/news";
import { SEED_NEWS, NewsItem } from "@/lib/data/news";

export async function listPublishedNewsAction(
  category?: string,
  query?: string
): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let q = supabase
      .from("news_items")
      .select("id, title, summary, url, published_at, category, relevance, status")
      .eq("status", "published")
      .gte("published_at", thirtyDaysAgo)
      .order("published_at", { ascending: false });

    if (category && category !== "all") {
      q = q.eq("category", category as NewsCategory);
    }

    if (query && query.trim()) {
      q = q.ilike("title", `%${query.trim()}%`);
    }

    const { data: dbNews, error } = await q;

    if (error || !dbNews || dbNews.length === 0) {
      return filterPublishedNews(SEED_NEWS, { category, query });
    }

    return dbNews.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.url,
      published_at: item.published_at || new Date().toISOString(),
      category: item.category as NewsCategory,
      relevance: Number(item.relevance),
      status: item.status as "published" | "pending_review" | "rejected",
    }));
  } catch {
    return filterPublishedNews(SEED_NEWS, { category, query });
  }
}

export async function getAdminNewsAction(): Promise<NewsItem[]> {
  try {
    const serviceClient = createServiceClient();
    const { data: dbNews, error } = await serviceClient
      .from("news_items")
      .select("id, title, summary, url, published_at, category, relevance, status")
      .order("published_at", { ascending: false });

    if (error || !dbNews || dbNews.length === 0) {
      return SEED_NEWS;
    }

    return dbNews.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.url,
      published_at: item.published_at || new Date().toISOString(),
      category: item.category as NewsCategory,
      relevance: Number(item.relevance),
      status: item.status as "published" | "pending_review" | "rejected",
    }));
  } catch {
    return SEED_NEWS;
  }
}

export async function adminUpdateNewsStatus(
  newsId: string,
  status: "published" | "rejected",
  category?: NewsCategory,
  summary?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceClient = createServiceClient();
    const updateData: {
      status: "published" | "rejected";
      category?: NewsCategory;
      summary?: string;
    } = { status };

    if (category) updateData.category = category;
    if (summary) updateData.summary = summary;

    await serviceClient
      .from("news_items")
      .update(updateData)
      .eq("id", newsId);

    revalidatePath("/news");
    revalidatePath("/admin/news");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update news status",
    };
  }
}
