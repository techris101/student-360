"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { RWANDAN_UNIVERSITIES } from "@/lib/data/universities";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Profile state
  const [fullName, setFullName] = React.useState("Jean Mugisha");
  const [email, setEmail] = React.useState("jean.m@ur.ac.rw");
  const [universityId, setUniversityId] = React.useState("univ-ur");
  const [universityOther, setUniversityOther] = React.useState("");
  const [college, setCollege] = React.useState("College of Science and Technology");
  const [programme, setProgramme] = React.useState("Computer Science");
  const [level, setLevel] = React.useState<"diploma" | "bachelor" | "master" | "phd">("bachelor");
  const [yearOfStudy, setYearOfStudy] = React.useState(3);
  const [expectedGraduation, setExpectedGraduation] = React.useState("2027-06");
  const [gpa, setGpa] = React.useState("3.65");
  const [gpaScale, setGpaScale] = React.useState("4.0");

  const [skills, setSkills] = React.useState<string[]>([
    "TypeScript",
    "Python",
    "Data Analysis",
  ]);
  const [newSkill, setNewSkill] = React.useState("");

  const [fields, setFields] = React.useState<string[]>([
    "Technology & Software",
    "Engineering & Energy",
  ]);
  const [destinations, setDestinations] = React.useState<string[]>([
    "Rwanda",
    "Europe",
  ]);

  const [gender, setGender] = React.useState("male");
  const [dateOfBirth, setDateOfBirth] = React.useState("2002-05-14");

  React.useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.university_id) setUniversityId(profile.university_id);
            if (profile.university_other) setUniversityOther(profile.university_other);
            if (profile.college) setCollege(profile.college);
            if (profile.programme) setProgramme(profile.programme);
            if (profile.level) setLevel(profile.level);
            if (profile.year_of_study) setYearOfStudy(profile.year_of_study);
            if (profile.gpa) setGpa(String(profile.gpa));
            if (profile.gpa_scale) setGpaScale(String(profile.gpa_scale));
            if (profile.skills) setSkills(profile.skills);
            if (profile.fields) setFields(profile.fields);
            if (profile.destinations) setDestinations(profile.destinations);
            if (profile.gender) setGender(profile.gender);
            if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);
          }
        } else {
          // Check local storage mock if offline / demo mode
          const cached = localStorage.getItem("student360_profile");
          if (cached) {
            const p = JSON.parse(cached);
            if (p.full_name) setFullName(p.full_name);
            if (p.programme) setProgramme(p.programme);
            if (p.gpa) setGpa(String(p.gpa));
          }
        }
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        full_name: fullName,
        university_id: universityId === "other" ? null : universityId || null,
        university_other: universityId === "other" ? universityOther : null,
        college,
        programme,
        level,
        year_of_study: yearOfStudy,
        expected_graduation: expectedGraduation ? `${expectedGraduation}-01` : null,
        gpa: gpa ? parseFloat(gpa) : null,
        gpa_scale: gpaScale ? parseFloat(gpaScale) : 4.0,
        skills,
        fields,
        destinations,
        gender,
        date_of_birth: dateOfBirth || null,
      };

      if (user) {
        await supabase.from("profiles").update(payload).eq("id", user.id);
      }

      localStorage.setItem("student360_profile", JSON.stringify(payload));
      toast("Profile updated successfully");
    } catch (err) {
      console.error("Save error:", err);
      toast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Profile strength plain sentence per DESIGN.md:
  // "Profile strength, shown as a plain sentence, never a badge: 'Add your GPA to check 14 more requirements.'"
  const profileStrengthText = !gpa
    ? "Add your GPA to check 14 more requirements."
    : !dateOfBirth
    ? "Add your date of birth to check age requirements on youth fellowships."
    : "Your profile is complete for all eligibility requirement checks.";

  return (
    <AppShell
      pageTitle="Profile"
      user={{
        name: fullName,
        email,
        initials: fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            Keep your academic and study details accurate for precise eligibility checks.
          </p>
        </div>

        {/* Profile Strength Banner */}
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-2)]">
          {profileStrengthText}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
          {/* Academic Studies Card */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
              Academic Studies
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">University</label>
              <Select value={universityId} onValueChange={setUniversityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {RWANDAN_UNIVERSITIES.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.short_name})
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other institution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {universityId === "other" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  Institution name
                </label>
                <Input
                  value={universityOther}
                  onChange={(e) => setUniversityOther(e.target.value)}
                  placeholder="Enter university name"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  College / School
                </label>
                <Input
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  Programme of study
                </label>
                <Input
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">Degree level</label>
                <Select
                  value={level}
                  onValueChange={(val: "diploma" | "bachelor" | "master" | "phd") => setLevel(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="bachelor">Bachelor&apos;s</SelectItem>
                    <SelectItem value="master">Master&apos;s</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">Year of study</label>
                <Select
                  value={String(yearOfStudy)}
                  onValueChange={(v) => setYearOfStudy(parseInt(v, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                    <SelectItem value="5">Year 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  Graduation date
                </label>
                <Input
                  type="month"
                  value={expectedGraduation}
                  onChange={(e) => setExpectedGraduation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  Cumulative GPA
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 3.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">GPA Scale</label>
                <Select value={gpaScale} onValueChange={setGpaScale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.0">Out of 4.0</SelectItem>
                    <SelectItem value="5.0">Out of 5.0</SelectItem>
                    <SelectItem value="20.0">Out of 20.0</SelectItem>
                    <SelectItem value="100.0">Percentage (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Skills Card */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
              Skills and Competencies
            </h2>

            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 border border-[var(--line-strong)] rounded-[6px] bg-[var(--surface)]">
              {skills.map((s) => (
                <Chip key={s} variant="default" className="gap-1.5">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    ×
                  </button>
                </Chip>
              ))}
              <input
                type="text"
                placeholder="Type skill & press Enter"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={addSkill}
                className="flex-1 min-w-[140px] text-xs bg-transparent outline-none text-[var(--ink)] placeholder:text-[var(--muted)]"
              />
            </div>
          </div>

          {/* Sensitive Demographic Fields */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-base font-semibold border-b border-[var(--line)] pb-2">
              Eligibility Details
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">Gender</label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[var(--ink-2)]">
                Some opportunities target women or have age limits. We only use this to check eligibility.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">Date of birth</label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <p className="text-[11px] text-[var(--ink-2)]">
                Some fellowship programmes have youth or age limits. We only use this to check eligibility.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving changes..." : "Save profile"}
            </Button>
          </div>
        </form>
        )}
      </div>
    </AppShell>
  );
}
