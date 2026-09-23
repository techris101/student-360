"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, X, HelpCircle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

const emptySubscribe = () => () => {};

export default function DevUIPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );


  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-4xl mx-auto space-y-10">
      {/* Header & Theme Control */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Design System Primitives</h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            Verification page for all UI components in light and dark themes.
          </p>
        </div>
        {mounted && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-1.5" /> Light theme
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-1.5" /> Dark theme
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Buttons */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Save opportunity</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">View details</Button>
          <Button variant="destructive">Delete account</Button>
          <Button variant="primary" disabled>
            Disabled action
          </Button>
        </div>
      </section>

      {/* Inputs & Form Elements */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Form Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--ink)]">Full name</label>
            <Input placeholder="e.g. Jean Mugisha" />
            <p className="text-xs text-[var(--ink-2)]">As written on official documents</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--ink)]">University</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ur">University of Rwanda</SelectItem>
                <SelectItem value="cmu">Carnegie Mellon University Africa</SelectItem>
                <SelectItem value="alu">ALU Rwanda</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--ink)]">GPA (with error state)</label>
            <Input defaultValue="5.2" error />
            <p className="text-xs text-[var(--red)]">GPA must be between 0.0 and 4.0 or 5.0</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-[var(--ink)]">Motivation summary</label>
            <Textarea placeholder="Outline your key study or career focus..." />
          </div>
        </div>
      </section>

      {/* Chips */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Status Chips</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="default">Scholarship</Chip>
          <Chip variant="met">Eligible</Chip>
          <Chip variant="partial">3 of 5 met</Chip>
          <Chip variant="not_met">Not eligible</Chip>
        </div>
      </section>

      {/* Requirement Check Signature Panel */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Requirement Check (Signature Panel)</h2>
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 border-l-4 border-l-[var(--amber)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Requirement check</h3>
            <span className="text-sm font-medium text-[var(--ink-2)]">You meet 2 of 4 requirements</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 text-[var(--teal)] mt-0.5 shrink-0" />
              <div>
                <span className="text-[var(--ink)]">Open to Rwandan nationals</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 text-[var(--teal)] mt-0.5 shrink-0" />
              <div>
                <span className="text-[var(--ink)]">Bachelor&apos;s students in year 2 or above</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-sm">
              <X className="h-4 w-4 text-[var(--red)] mt-0.5 shrink-0" />
              <div>
                <span className="text-[var(--ink)]">Minimum GPA 3.5 / 4.0</span>
                <p className="text-xs text-[var(--ink-2)]">Yours is currently 3.2 / 4.0</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-sm">
              <HelpCircle className="h-4 w-4 text-[var(--muted)] mt-0.5 shrink-0" />
              <div>
                <span className="text-[var(--ink)]">IELTS 6.5 or equivalent</span>
                <p className="text-xs text-[var(--ink-2)]">Add your English test to check</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tabs &amp; Segmented Controls</h2>
        <div className="space-y-4">
          <Tabs defaultValue="all">
            <TabsList variant="underline">
              <TabsTrigger variant="underline" value="all">
                All opportunities
              </TabsTrigger>
              <TabsTrigger variant="underline" value="eligible">
                Eligible only
              </TabsTrigger>
              <TabsTrigger variant="underline" value="plan_ahead">
                Plan ahead
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="text-sm text-[var(--ink-2)]">
              Showing all verified opportunities open to Rwandan university students.
            </TabsContent>
            <TabsContent value="eligible" className="text-sm text-[var(--ink-2)]">
              Filtered to opportunities matching your current profile.
            </TabsContent>
            <TabsContent value="plan_ahead" className="text-sm text-[var(--ink-2)]">
              Scholarships to prepare for in future academic cycles.
            </TabsContent>
          </Tabs>

          <Tabs defaultValue="week">
            <TabsList variant="segmented">
              <TabsTrigger variant="segmented" value="week">
                Next 7 days
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="month">
                30 days
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="rolling">
                Rolling
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Dialogs, Sheets, Dropdowns, Toast */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Overlays &amp; Feedback</h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm submission</DialogTitle>
                <DialogDescription>
                  Marking this opportunity as submitted will move it to your applied applications and add you to the opportunity cohort.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Confirm submitted</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filter opportunities</SheetTitle>
                <SheetDescription>
                  Filter the list by study level, field, or funding type.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Button variant="primary" className="w-full">
                  Apply filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Options menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Opportunity actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => toast("Saved to your list")}>
                Save opportunity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Marked as submitted")}>
                Mark as submitted
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast("Removed from list")}>
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toast Triggers */}
          <Button
            variant="ghost"
            onClick={() => toast("Application saved to your tracker")}
          >
            Trigger success toast
          </Button>
          <Button
            variant="ghost"
            onClick={() => toast("Failed to update status. Please try again.", "error")}
          >
            Trigger error toast
          </Button>
        </div>
      </section>

      {/* Skeletons */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Skeletons (No Shimmer)</h2>
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      </section>
    </div>
  );
}
