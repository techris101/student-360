import { type NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { generateText } from "ai";
import { z } from "zod";
import { modelFast } from "@/lib/ai/client";
import { CV_PARSING_PROMPT } from "@/lib/ai/prompts";

export const maxDuration = 60;

const parsedCvSchema = z.object({
  full_name: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  programme: z.string().nullable().optional(),
  level: z.enum(["diploma", "bachelor", "master", "phd"]).nullable().optional(),
  year_of_study: z.number().int().min(1).max(7).nullable().optional(),
  expected_graduation: z.string().nullable().optional(),
  gpa: z.number().nullable().optional(),
  gpa_scale: z.number().nullable().optional(),
  languages: z
    .array(
      z.object({
        language: z.string(),
        level: z.string().optional(),
        test: z.string().nullable().optional(),
        score: z.string().nullable().optional(),
        date: z.string().nullable().optional(),
      })
    )
    .nullable()
    .optional(),
  skills: z.array(z.string()).default([]),
  fields: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        role: z.string(),
        organisation: z.string(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        summary: z.string().optional(),
      })
    )
    .default([]),
  leadership: z
    .array(
      z.object({
        role: z.string(),
        organisation: z.string(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
      })
    )
    .default([]),
  awards: z.array(z.string()).default([]),
});

export type ParsedCV = z.infer<typeof parsedCvSchema>;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF documents are accepted." },
        { status: 400 }
      );
    }

    // Max 5 MB check
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 5 MB." },
        { status: 400 }
      );
    }

    // Extract text using unpdf
    const arrayBuffer = await file.arrayBuffer();
    const { text } = await extractText(new Uint8Array(arrayBuffer));

    const cleanText = Array.isArray(text) ? text.join("\n") : text || "";
    if (cleanText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not read text from this PDF. Please ensure it is not a scanned image, or enter your details manually.",
        },
        { status: 422 }
      );
    }

    // Truncate to 12,000 chars per cost/performance rule
    const truncatedText = cleanText.slice(0, 12000);

    const promptWithText = CV_PARSING_PROMPT.replace("{{cv_text}}", truncatedText);

    // Call fast Gemini model
    const response = await generateText({
      model: modelFast,
      prompt: promptWithText,
    });

    // Clean JSON response (strip markdown fences if any)
    let rawJson = response.text.trim();
    if (rawJson.startsWith("```json")) {
      rawJson = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (rawJson.startsWith("```")) {
      rawJson = rawJson.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsedObject = JSON.parse(rawJson);
    const validated = parsedCvSchema.parse(parsedObject);

    return NextResponse.json({ data: validated });
  } catch (err: unknown) {
    console.error("CV parse error:", err);
    return NextResponse.json(
      {
        error:
          "Unable to extract fields from the uploaded CV. You can continue by filling in your profile manually.",
      },
      { status: 500 }
    );
  }
}
