import * as React from "react";
import type { Metadata } from "next";
import { getErrorLogs } from "@/lib/errors/logger";
import { AdminErrorClient } from "./error-client";

export const metadata: Metadata = {
  title: "Error Logs — Admin — Student 360",
};

export default async function AdminErrorsPage() {
  const logs = await getErrorLogs();

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <AdminErrorClient initialLogs={logs} />
    </div>
  );
}
