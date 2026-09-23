"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { exportUserData, deleteAccount } from "@/app/actions/account";
import { Sun, Moon, Laptop, Download, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [emailOptIn, setEmailOptIn] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportUserData();
      if (res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `student-360-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast("Data exported successfully");
      } else {
        toast(res.error || "Unable to export data", "error");
      }
    } catch (err) {
      console.error("Export error:", err);
      toast("Error exporting data", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteAccount();
      if (res.success) {
        toast("Account deleted");
        setDialogOpen(false);
        router.push("/sign-in");
      } else {
        toast(res.error || "Failed to delete account", "error");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast("Error deleting account", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell pageTitle="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            Manage your interface theme, email preferences, and personal data.
          </p>
        </div>

        {/* Appearance Section */}
        <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
            Appearance
          </h2>
          <p className="text-xs text-[var(--ink-2)]">
            Choose how Student 360 looks on your device.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-1.5" /> Light
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-1.5" /> Dark
            </Button>
            <Button
              type="button"
              variant={theme === "system" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTheme("system")}
            >
              <Laptop className="h-4 w-4 mr-1.5" /> System default
            </Button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
            Notifications &amp; Reminders
          </h2>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => {
                setEmailOptIn(e.target.checked);
                toast(
                  e.target.checked
                    ? "Email reminders enabled"
                    : "Email reminders disabled"
                );
              }}
              className="mt-0.5 rounded border-[var(--line-strong)] text-[var(--teal)] focus:ring-[var(--teal)]"
            />
            <div>
              <span className="text-sm font-medium text-[var(--ink)]">
                Email deadline reminders
              </span>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Receive an email 7 days and 1 day before deadlines for opportunities you have saved or applied to.
              </p>
            </div>
          </label>
        </section>

        {/* Data Privacy & Export */}
        <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
            Data Privacy &amp; Export
          </h2>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            In compliance with Rwanda Law Nº 058/2021 relating to the protection of personal data and privacy, you have full ownership of your data. You may download all records or permanently delete your account.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={exporting}
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Preparing download..." : "Export data (JSON)"}
            </Button>
          </div>
        </section>

        {/* Danger Zone: Delete Account */}
        <section className="rounded-[8px] border border-[var(--red)] bg-[var(--surface)] p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--red)] border-b border-[var(--line)] pb-2">
            Delete Account
          </h2>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Permanently delete your profile, applications, saved opportunities, and uploaded CV files. This action is irreversible.
          </p>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete my account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Permanently delete account?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your applications, saved opportunities, uploaded CV files, and progress records will be permanently erased.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Permanently delete account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </AppShell>
  );
}
