import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkDailyUsage, incrementDailyUsage } from "@/lib/ai/rate-limit";
import {
  assembleAdvisorSystemPrompt,
  ApplicationContextItem,
} from "@/lib/ai/advisor-context";
import { createAdvisorTools } from "@/lib/ai/advisor-tools";
import { SEED_OPPORTUNITIES, OpportunityItem } from "@/lib/data/opportunities";
import type { StudentProfileData } from "@/lib/eligibility/types";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  thread_id: z.string().optional(),
});

const DEFAULT_PROFILE: StudentProfileData = {
  full_name: "Jean Mugisha",
  nationality: "Rwanda",
  level: "bachelor",
  year_of_study: 3,
  gpa: 3.65,
  gpa_scale: 4.0,
  fields: ["Computer Science", "STEM"],
  interests: ["Software Engineering", "Artificial Intelligence"],
  languages: [
    { language: "English", level: "fluent", test: "IELTS", score: 7.5 },
    { language: "Kinyarwanda", level: "native" },
  ],
  experience: [
    {
      role: "Software Engineering Intern",
      organisation: "Irembo",
      start: "2024-06",
      end: "2024-09",
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid message payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message: userPrompt, thread_id: clientThreadId } = parsed.data;

    // 1. Identify User Session
    let userId = "demo-user";
    let profile: StudentProfileData = DEFAULT_PROFILE;
    let applications: ApplicationContextItem[] = [];

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;

        // Fetch DB profile
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (dbProfile) {
          profile = {
            id: dbProfile.id,
            full_name: dbProfile.full_name,
            nationality: dbProfile.nationality,
            level: dbProfile.level,
            year_of_study: dbProfile.year_of_study,
            gpa: dbProfile.gpa,
            gpa_scale: dbProfile.gpa_scale,
            date_of_birth: dbProfile.date_of_birth,
            gender: dbProfile.gender,
            fields: dbProfile.fields,
            interests: dbProfile.interests,
            languages: dbProfile.languages as StudentProfileData["languages"],
            experience: dbProfile.experience as StudentProfileData["experience"],
          };
        }

        // Fetch user's active applications
        const { data: dbApps } = await supabase
          .from("applications")
          .select("opportunity_id, status, opportunities(title, organisation, deadline)")
          .eq("user_id", user.id);

        if (dbApps && dbApps.length > 0) {
          applications = dbApps.map((a) => {
            const opp = a.opportunities as unknown as {
              title: string;
              organisation: string;
              deadline: string | null;
            } | null;
            return {
              opportunity_id: a.opportunity_id,
              title: opp?.title || "Opportunity",
              organisation: opp?.organisation || "Organisation",
              status: a.status,
              deadline: opp?.deadline || null,
            };
          });
        }
      }
    } catch {
      // Use fallback session
    }

    // 2. Enforce Daily Message Cap before calling the model (docs/AI_ADVISOR.md)
    const usage = await checkDailyUsage(userId);
    if (!usage.allowed) {
      return Response.json(
        {
          error: "Daily limit reached. Resets at midnight Kigali time.",
          remaining: 0,
          cap: usage.cap,
        },
        { status: 429 }
      );
    }

    // 3. Thread Management
    const serviceClient = createServiceClient();
    const now = new Date().toISOString();
    let threadId = clientThreadId;

    if (!threadId) {
      const title =
        userPrompt.length > 40
          ? `${userPrompt.slice(0, 37)}...`
          : userPrompt;

      try {
        const { data: newThread } = await serviceClient
          .from("ai_threads")
          .insert({
            user_id: userId,
            title,
            created_at: now,
          })
          .select("id")
          .single();

        if (newThread) {
          threadId = newThread.id;
        }
      } catch {
        threadId = `local-thread-${Date.now()}`;
      }
    }

    // 4. Save User Message
    try {
      if (threadId && !threadId.startsWith("local-")) {
        await serviceClient.from("ai_messages").insert({
          thread_id: threadId,
          role: "user",
          content: userPrompt,
          created_at: now,
        });
      }
    } catch {
      // Non-critical persistence failure
    }

    // 5. Load Thread History (last 20 messages per AI_ADVISOR.md)
    const messagesHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    try {
      if (threadId && !threadId.startsWith("local-")) {
        const { data: pastMessages } = await serviceClient
          .from("ai_messages")
          .select("role, content")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true })
          .limit(20);

        if (pastMessages && pastMessages.length > 0) {
          for (const msg of pastMessages) {
            if (msg.role === "user" || msg.role === "assistant") {
              messagesHistory.push({
                role: msg.role,
                content: msg.content,
              });
            }
          }
        }
      }
    } catch {
      // Continue with current message
    }

    if (messagesHistory.length === 0 || messagesHistory[messagesHistory.length - 1].content !== userPrompt) {
      messagesHistory.push({ role: "user", content: userPrompt });
    }

    // 6. Fetch Opportunities & Build System Prompt
    let allOpportunities: OpportunityItem[] = SEED_OPPORTUNITIES;
    try {
      const { data: dbOpps } = await serviceClient
        .from("opportunities")
        .select("*")
        .eq("status", "published");

      if (dbOpps && dbOpps.length > 0) {
        allOpportunities = dbOpps as unknown as OpportunityItem[];
      }
    } catch {
      // Keep SEED_OPPORTUNITIES
    }

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = assembleAdvisorSystemPrompt({
      profile,
      applications,
      allOpportunities,
      today,
    });

    const tools = createAdvisorTools(profile, allOpportunities, today);

    // 7. Stream text with Gemini AI_MODEL_SMART (maxOutputTokens: 700, maxSteps: 4)
    const result = streamText({
      model: google(env.server.AI_MODEL_SMART),
      system: systemPrompt,
      messages: messagesHistory,
      tools,
      stopWhen: stepCountIs(4),
      maxOutputTokens: 700,
      async onFinish({ text, usage: tokenUsage }) {
        try {
          if (threadId && !threadId.startsWith("local-")) {
            await serviceClient.from("ai_messages").insert({
              thread_id: threadId,
              role: "assistant",
              content: text,
              tokens_in: tokenUsage?.inputTokens ?? null,
              tokens_out: tokenUsage?.outputTokens ?? null,
              created_at: new Date().toISOString(),
            });
          }
        } catch {
          // Log save error silently
        }

        // Increment daily usage
        await incrementDailyUsage(userId, undefined, (tokenUsage?.inputTokens || 0) + (tokenUsage?.outputTokens || 0));
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Advisor-Thread-Id": threadId || "",
        "X-Advisor-Remaining": String(Math.max(0, usage.remaining - 1)),
        "X-Advisor-Cap": String(usage.cap),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal advisor error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
