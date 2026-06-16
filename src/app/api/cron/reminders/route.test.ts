// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn(async () => ({})) },
}));
vi.mock("@/lib/google", () => ({
  listCalendarEvents: vi.fn(),
  isExam: (ev: { summary?: string }) =>
    (ev.summary ?? "").toLowerCase().includes("testes"),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));

import webpush from "web-push";
import { listCalendarEvents } from "@/lib/google";
import { createServiceClient } from "@/lib/supabase/server";
import { GET } from "./route";

const sendNotification = vi.mocked(webpush.sendNotification);
const listEvents = vi.mocked(listCalendarEvents);
const makeServiceClient = vi.mocked(createServiceClient);

function isoInDays(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Minimal chainable fake of the Supabase service client used by the cron route.
function makeSupabase({
  subs = [] as unknown[],
  settings = [{ user_id: "u1", exam_calendar_id: "cal@x" }] as unknown[],
  sentExisting = false,
} = {}) {
  const insertSpy = vi.fn(async () => ({ error: null }));
  const deleteEq = vi.fn(async () => ({ error: null }));
  const client = {
    from(table: string) {
      return {
        select() {
          const result =
            table === "push_subscriptions"
              ? { data: subs, error: null }
              : table === "app_settings"
                ? { data: settings, error: null }
                : { data: [], error: null };
          const chain: Record<string, unknown> = {
            eq() {
              return chain;
            },
            maybeSingle: async () =>
              sentExisting ? { data: { id: "r1" }, error: null } : { data: null, error: null },
            then: (onF: (v: unknown) => unknown) => Promise.resolve(result).then(onF),
          };
          return chain;
        },
        insert: insertSpy,
        delete() {
          return { eq: deleteEq };
        },
      };
    },
  };
  return { client, insertSpy, deleteEq };
}

function req(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/cron/reminders", { headers });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "secret");
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
  vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
  vi.stubEnv("VAPID_SUBJECT", "mailto:x@y.z");
  sendNotification.mockClear();
  listEvents.mockReset();
});

describe("GET /api/cron/reminders", () => {
  it("401s without the cron secret", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    const wrong = await GET(req({ authorization: "Bearer nope" }));
    expect(wrong.status).toBe(401);
  });

  it("sends a push for an exam due in 3 days", async () => {
    listEvents.mockResolvedValue([
      { id: "e1", summary: "Eletricidade testes", start: { dateTime: isoInDays(3) } },
    ]);
    const { client, insertSpy } = makeSupabase({
      subs: [{ id: "s1", user_id: "u1", endpoint: "https://push/1", p256dh: "p", auth: "a" }],
    });
    makeServiceClient.mockReturnValue(client as never);

    const res = await GET(req({ authorization: "Bearer secret" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });

  it("does not re-send an already-sent reminder (dedupe)", async () => {
    listEvents.mockResolvedValue([
      { id: "e1", summary: "Eletricidade testes", start: { dateTime: isoInDays(1) } },
    ]);
    const { client } = makeSupabase({
      subs: [{ id: "s1", user_id: "u1", endpoint: "https://push/1", p256dh: "p", auth: "a" }],
      sentExisting: true,
    });
    makeServiceClient.mockReturnValue(client as never);

    const res = await GET(req({ authorization: "Bearer secret" }));
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("ignores exams that are not 3/1/0 days away", async () => {
    listEvents.mockResolvedValue([
      { id: "e1", summary: "Eletricidade testes", start: { dateTime: isoInDays(5) } },
    ]);
    const { client } = makeSupabase({
      subs: [{ id: "s1", user_id: "u1", endpoint: "https://push/1", p256dh: "p", auth: "a" }],
    });
    makeServiceClient.mockReturnValue(client as never);

    const res = await GET(req({ authorization: "Bearer secret" }));
    const body = await res.json();
    expect(body.sent).toBe(0);
  });
});
