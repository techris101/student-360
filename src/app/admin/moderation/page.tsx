import React from "react";
import { getAdminReportedMessages } from "@/app/actions/cohorts";
import { ModerationClient } from "./moderation-client";

export default async function AdminModerationPage() {
  const reports = await getAdminReportedMessages();

  return <ModerationClient initialReports={reports} />;
}
