"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { RWANDAN_UNIVERSITIES } from "@/lib/data/universities";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { Upload, ShieldCheck, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Step 1: Studies
  const [universityId, setUniversityId] = React.useState("");
  const [universityOther, setUniversityOther] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [programme, setProgramme] = React.useState("");
  const [level, setLevel] = React.useState<"diploma" | "bachelor" | "master" | "phd">("bachelor");
  const [yearOfStudy, setYearOfStudy] = React.useState<number>(2);
  const [expectedGraduation, setExpectedGraduation] = React.useState("2027-06");

  // Step 2: CV
  const [cvConsent, setCvConsent] = React.useState(false);
  const [cvFile, setCvFile] = React.useState<File | null>(null);
  const [cvParsing, setCvParsing] = React.useState(false);
  const [cvParsed, setCvParsed] = React.useState<Record<string, unknown> | null>(null);

  // Proposed fields from CV / User Profile
  const [fullName, setFullName] = React.useState("Jean Mugisha");
  const [gpa, setGpa] = React.useState("");
  const [gpaScale, setGpaScale] = React.useState("4.0");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [newSkill, setNewSkill] = React.useState("");

  // Step 3: Goals & Interests
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([
    "scholarship",
    "internship",
  ]);
  const [selectedFields, setSelectedFields] = React.useState<string[]>([
    "Technology",
    "Health",
  ]);
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([
    "Master's degree abroad",
  ]);
  const [selectedDestinations, setSelectedDestinations] = React.useState<string[]>([
    "Rwanda",
    "Europe",
  ]);

  // Sensitive optional fields
  const [gender, setGender] = React.useState<string>("");
  const [dateOfBirth, setDateOfBirth] = React.useState<string>("");

  const handleCvUploadAndParse = async (file: File) => {
    if (!cvConsent) {
      setErrorMessage("Please accept the data storage consent before uploading your CV.");
      return;
    }

    setCvFile(file);
    setCvParsing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv/parse", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to parse CV");
      }

      if (json.data) {
        setCvParsed(json.data);
        if (json.data.full_name) setFullName(json.data.full_name);
        if (json.data.programme) setProgramme(json.data.programme);
        if (json.data.level) setLevel(json.data.level);
        if (json.data.year_of_study) setYearOfStudy(json.data.year_of_study);
        if (json.data.gpa) setGpa(String(json.data.gpa));
        if (json.data.gpa_scale) setGpaScale(String(json.data.gpa_scale));
        if (json.data.skills && Array.isArray(json.data.skills)) {
          setSkills(json.data.skills);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reading CV.";
      setErrorMessage(msg);
    } finally {
      setCvParsing(false);
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

  const toggleSelection = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const profilePayload = {
        full_name: fullName,
        university_id: universityId === "other" ? null : universityId || null,
        university_other: universityId === "other" ? universityOther : null,
        college: college || null,
        programme: programme || null,
        level,
        year_of_study: yearOfStudy,
        expected_graduation: expectedGraduation ? `${expectedGraduation}-01` : null,
        gpa: gpa ? parseFloat(gpa) : null,
        gpa_scale: gpaScale ? parseFloat(gpaScale) : 4.0,
        skills,
        fields: selectedFields,
        goals: selectedGoals,
        destinations: selectedDestinations,
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
        cv_parsed: (cvParsed as unknown as Json) ?? null,
        onboarding_complete: true,
      };

      if (user) {
        await supabase
          .from("profiles")
          .upsert({ id: user.id, ...profilePayload });
      }

      // Also store to localStorage as mock/local session backup
      if (typeof window !== "undefined") {
        localStorage.setItem("student360_profile", JSON.stringify(profilePayload));
      }

      router.push("/opportunities");
    } catch (err: unknown) {
      console.error("Save profile error:", err);
      // Even if network fails without Supabase configured, allow local progression
      router.push("/opportunities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 max-w-2xl mx-auto text-[var(--ink)]">
      {/* Header and Step Indicator */}
      <div className="space-y-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-[var(--teal)] uppercase tracking-wider">
            Step {step} of 3
          </span>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            {step === 1 && "Your University Studies"}
            {step === 2 && "Curriculum Vitae (Optional)"}
            {step === 3 && "Your Goals and Preferences"}
          </h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            {step === 1 && "We use your programme and year of study to check university requirements."}
            {step === 2 && "Upload your CV to automatically fill skills, GPA, and experience."}
            {step === 3 && "Tell us what you are looking for so we rank the most relevant opportunities first."}
          </p>
        </div>

        {/* Step Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1.5 rounded-[2px] ${step >= 1 ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />
          <div className={`h-1.5 rounded-[2px] ${step >= 2 ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />
          <div className={`h-1.5 rounded-[2px] ${step >= 3 ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-[6px] border border-[var(--red)] bg-[var(--red-subtle)] p-3 text-xs text-[var(--red)] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: STUDIES */}
      {step === 1 && (
        <div className="space-y-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--ink)]">
              Full name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alice Umutoni"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--ink)]">
              University
            </label>
            <Select value={universityId} onValueChange={setUniversityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your university" />
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
              <label className="text-sm font-medium text-[var(--ink)]">
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
              <label className="text-sm font-medium text-[var(--ink)]">
                College / School (optional)
              </label>
              <Input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. CST, CBE, CMHS"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--ink)]">
                Programme of study
              </label>
              <Input
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                placeholder="e.g. Computer Science, Public Health"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--ink)]">
                Study level
              </label>
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
              <label className="text-sm font-medium text-[var(--ink)]">
                Year of study
              </label>
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
              <label className="text-sm font-medium text-[var(--ink)]">
                Expected graduation
              </label>
              <Input
                type="month"
                value={expectedGraduation}
                onChange={(e) => setExpectedGraduation(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[var(--line)]">
            <span className="text-xs text-[var(--ink-2)]">
              All details can be edited anytime in your profile.
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!programme) {
                  setErrorMessage("Please enter your programme of study.");
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
            >
              Continue to Step 2
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: CV UPLOAD & FIELD CONFIRMATION */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Privacy Consent Box */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--teal)]" />
              <span>CV Storage &amp; Privacy Notice</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              <strong>What we store:</strong> Your confirmed profile fields and an encrypted PDF in private storage.
              <br />
              <strong>Why:</strong> To check eligibility against real scholarship, fellowship, and internship requirements.
              <br />
              <strong>How to delete:</strong> You can delete your CV file or permanently erase your account at any time in Settings.
            </p>
            <label className="flex items-center gap-2 pt-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cvConsent}
                onChange={(e) => setCvConsent(e.target.checked)}
                className="rounded border-[var(--line-strong)] text-[var(--teal)] focus:ring-[var(--teal)]"
              />
              <span className="text-[var(--ink)]">
                I understand and agree to store my CV for eligibility checking.
              </span>
            </label>
          </div>

          {/* Upload Area */}
          <div className="rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-6 text-center space-y-3">
            <Upload className="h-8 w-8 text-[var(--muted)] mx-auto" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">
                {cvFile ? cvFile.name : "Upload your CV in PDF format"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Maximum file size: 5 MB
              </p>
            </div>

            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={!cvConsent || cvParsing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCvUploadAndParse(file);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!cvConsent || cvParsing}
                asChild
              >
                <span>{cvParsing ? "Extracting profile fields..." : "Select PDF file"}</span>
              </Button>
            </label>
          </div>

          {/* Field-by-Field Confirmation */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              Confirm or Edit Extracted Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  Grade Point Average (GPA)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3.65"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink)]">
                  GPA Scale
                </label>
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

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--ink)]">
                Skills &amp; Competencies
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border border-[var(--line-strong)] rounded-[6px] bg-[var(--surface)]">
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
                  placeholder="Type a skill and press Enter"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={addSkill}
                  className="flex-1 min-w-[140px] text-xs bg-transparent outline-none text-[var(--ink)] placeholder:text-[var(--muted)]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline"
            >
              Skip this step for now
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" variant="primary" onClick={() => setStep(3)}>
                Continue to Step 3
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GOALS, PREFERENCES & SENSITIVE ELIGIBILITY */}
      {step === 3 && (
        <div className="space-y-6 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6">
          {/* Opportunity Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]">
              Opportunity types you are looking for
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "scholarship", label: "Scholarships" },
                { id: "fellowship", label: "Fellowships" },
                { id: "internship", label: "Internships" },
                { id: "course", label: "Courses & Training" },
                { id: "competition", label: "Competitions" },
                { id: "conference", label: "Conferences" },
                { id: "grant", label: "Grants" },
                { id: "research", label: "Research calls" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleSelection(selectedTypes, setSelectedTypes, t.id)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedTypes.includes(t.id)
                      ? "bg-[var(--teal-subtle)] text-[var(--teal)] border-[var(--teal)]"
                      : "bg-[var(--surface-2)] text-[var(--ink-2)] border-transparent"
                  }`}
                >
                  {selectedTypes.includes(t.id) && "✓ "}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]">
              Fields of interest
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Technology & Software",
                "Health & Biomedical",
                "Business & Finance",
                "Agriculture & Food",
                "Engineering & Energy",
                "Policy & Governance",
                "Education",
              ].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleSelection(selectedFields, setSelectedFields, f)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedFields.includes(f)
                      ? "bg-[var(--teal-subtle)] text-[var(--teal)] border-[var(--teal)]"
                      : "bg-[var(--surface-2)] text-[var(--ink-2)] border-transparent"
                  }`}
                >
                  {selectedFields.includes(f) && "✓ "}
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]">
              Preferred study destinations
            </label>
            <div className="flex flex-wrap gap-2">
              {["Rwanda", "East Africa", "Africa", "Europe", "North America", "Asia", "Online"].map(
                (d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      toggleSelection(selectedDestinations, setSelectedDestinations, d)
                    }
                    className={`rounded-[4px] px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedDestinations.includes(d)
                        ? "bg-[var(--teal-subtle)] text-[var(--teal)] border-[var(--teal)]"
                        : "bg-[var(--surface-2)] text-[var(--ink-2)] border-transparent"
                    }`}
                  >
                    {selectedDestinations.includes(d) && "✓ "}
                    {d}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]">
              Primary study and career goals
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Master's degree abroad",
                "Local job after graduation",
                "Start a business or venture",
                "Academic research or PhD",
                "Internship during holidays",
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleSelection(selectedGoals, setSelectedGoals, g)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedGoals.includes(g)
                      ? "bg-[var(--teal-subtle)] text-[var(--teal)] border-[var(--teal)]"
                      : "bg-[var(--surface-2)] text-[var(--ink-2)] border-transparent"
                  }`}
                >
                  {selectedGoals.includes(g) && "✓ "}
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Sensitive Optional Fields */}
          <div className="border-t border-[var(--line)] pt-4 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Optional Eligibility Criteria
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">
                Gender (optional)
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[var(--ink-2)]">
                Some opportunities target women or underrepresented scholars. We only use this to check eligibility.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--ink)]">
                Date of birth (optional)
              </label>
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

          {/* Profile Strength Note */}
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-2)]">
            {gpa
              ? "Your profile is ready. You will be matched against all published opportunity requirements."
              : "Add your GPA later to check 14 more requirement rules."}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              onClick={handleFinishOnboarding}
            >
              {saving ? "Completing setup..." : "Finish and view opportunities"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
