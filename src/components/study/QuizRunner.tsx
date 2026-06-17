"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/studyContent";

// Interactive quiz: pick one option per question, submit to score and reveal
// the correct answers + explanations.
export default function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0,
  );

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const chosen = answers[qi];
        return (
          <div key={qi} className="rounded-card border border-edge bg-card2/40 p-3">
            <div className="mb-2 text-[13.5px] font-medium text-fg">
              {qi + 1}. {q.question}
            </div>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isCorrect = oi === q.answerIndex;
                let cls = "border-edge hover:border-accent";
                if (submitted) {
                  if (isCorrect) cls = "border-green bg-greenSoft text-green";
                  else if (isChosen) cls = "border-red bg-redSoft text-red";
                  else cls = "border-edge opacity-70";
                } else if (isChosen) {
                  cls = "border-accent bg-accentSoft text-accent";
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={[
                      "flex w-full items-center gap-2 rounded-card border px-3 py-2 text-left text-[13px] transition-colors",
                      cls,
                    ].join(" ")}
                  >
                    <span className="flex-1">{opt}</span>
                    {submitted && isCorrect ? <Check className="h-4 w-4" /> : null}
                    {submitted && isChosen && !isCorrect ? <X className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation ? (
              <p className="mt-2 text-[12px] text-muted">💡 {q.explanation}</p>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        {!submitted ? (
          <Button
            onClick={() => setSubmitted(true)}
            disabled={answeredCount < questions.length}
          >
            Submeter ({answeredCount}/{questions.length})
          </Button>
        ) : (
          <>
            <div className="text-sm font-semibold text-fg">
              {score} / {questions.length} certas (
              {Math.round((score / questions.length) * 100)}%)
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Repetir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
