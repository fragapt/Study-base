"use client";

import { useMemo, useState } from "react";
import { RotateCw, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/lib/studyContent";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Interactive flip-card deck: click the card to flip, navigate with the arrows.
export default function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = useMemo(() => cards[order[pos]], [cards, order, pos]);
  if (!card) return null;

  function go(delta: number) {
    setFlipped(false);
    setPos((p) => (p + delta + cards.length) % cards.length);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-[12px] text-muted">
        <span>
          {pos + 1} / {cards.length}
        </span>
        <button
          onClick={() => {
            setOrder(shuffle(cards.map((_, i) => i)));
            setPos(0);
            setFlipped(false);
          }}
          className="inline-flex items-center gap-1 hover:text-fg"
        >
          <Shuffle className="h-3.5 w-3.5" /> Baralhar
        </button>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-card border border-edge bg-card2 p-6 text-center transition-colors hover:border-accent"
      >
        <span className="text-[11px] uppercase tracking-wide text-dim">
          {flipped ? "Resposta" : "Pergunta"}
        </span>
        <span className="text-[15px] leading-snug text-fg">
          {flipped ? card.back : card.front}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
          <RotateCw className="h-3 w-3" /> tocar para virar
        </span>
      </button>

      <div className="flex w-full items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={() => go(-1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button variant="secondary" size="sm" onClick={() => go(1)}>
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
