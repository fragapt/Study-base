import { render } from "@testing-library/react";
import ConfigProvider from "@/lib/config/ConfigProvider";
import { EMPTY_CONFIG, type UserConfig } from "@/lib/config/types";
import type { SubjectRow, ProgressTopicRow } from "@/lib/supabase/types";

export function subjectRow(partial: Partial<SubjectRow> = {}): SubjectRow {
  return {
    id: "s1",
    user_id: "u1",
    slug: "eletricidade",
    name: "Eletricidade",
    color: "#2383e2",
    icon: "⚡",
    exam_match: ["eletric"],
    position: 0,
    created_at: "",
    ...partial,
  };
}

export function topicRow(partial: Partial<ProgressTopicRow> = {}): ProgressTopicRow {
  return {
    id: "t1",
    user_id: "u1",
    subject_id: "s1",
    title: "Tópico",
    description: null,
    position: 0,
    created_at: "",
    source: "manual",
    kind: "task",
    ...partial,
  };
}

export function renderWithConfig(
  ui: React.ReactNode,
  config: Partial<UserConfig> = {},
) {
  const full: UserConfig = { ...EMPTY_CONFIG, ...config };
  return render(<ConfigProvider initial={full}>{ui}</ConfigProvider>);
}
