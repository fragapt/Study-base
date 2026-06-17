"use client";

import type { StudyContent } from "@/lib/studyContent";
import ResumoView from "./ResumoView";
import FlashcardDeck from "./FlashcardDeck";
import QuizRunner from "./QuizRunner";
import MindmapView from "./MindmapView";

// Renders study content by kind. `content` is the parsed jsonb from a
// study_resources row.
export default function StudyResourceView({ content }: { content: StudyContent }) {
  switch (content.kind) {
    case "resumo":
      return <ResumoView markdown={content.markdown} />;
    case "flashcards":
      return <FlashcardDeck cards={content.cards} />;
    case "quiz":
      return <QuizRunner questions={content.questions} />;
    case "mindmap":
      return <MindmapView root={content.root} />;
    default:
      return null;
  }
}
