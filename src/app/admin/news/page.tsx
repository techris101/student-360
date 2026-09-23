import React from "react";
import { getAdminNewsAction } from "@/app/actions/news";
import { AdminNewsClient } from "./admin-news-client";

export default async function AdminNewsPage() {
  const newsItems = await getAdminNewsAction();

  return <AdminNewsClient initialItems={newsItems} />;
}
