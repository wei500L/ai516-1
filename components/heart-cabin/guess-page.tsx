"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, PenLine, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { PaperIconButton } from "@/components/handbook/paper-icon-button";
import { PaperButton } from "@/components/handbook/paper-button";
import { StickerTag } from "@/components/handbook/sticker-tag";
import { Tape } from "@/components/handbook/tape";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { AppShell } from "@/components/layout/app-shell";
import { PaperPage } from "@/components/layout/paper-page";
import { mockGuessPageData, mockSubmitGuess } from "@/lib/mock-guess-result";
import { useGuessFlow } from "@/lib/use-guess-flow";
import { cn } from "@/lib/utils";
import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { GuessAssetCard } from "@/components/prototype/guess-asset-card";
import { decor, numberToken } from "@/lib/prototype-assets";

type GuessPageProps = {
  roomId: string;
};

export function GuessPage({ roomId }: GuessPageProps) {
  const router = useRouter();
  const setLastSubmission = useGuessFlow((state) => state.setLastSubmission);
  const data = useMemo(
    () => ({
      ...mockGuessPageData,
      roomId
    }),
    [roomId]
  );
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [ownGuess, setOwnGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedOptionId || isSubmitting) return;
    setIsSubmitting(true);
    const submission = {
      roomId: data.roomId,
      selectedOptionId,
      ownGuess,
      discoveredObjectIds: data.clues.map((clue) => clue.id)
    };
    setLastSubmission(submission);
    const result = await mockSubmitGuess(submission);
    router.push(`/result/${result.guessId}`);
  }

  return (
    <AppShell>
      <PaperPage className="pt-16">
        <Tape className="left-16 top-11" />
        <header className="relative mb-6 text-center">
          <PaperIconButton
            icon={<ArrowLeft className="h-7 w-7" />}
            label="返回小屋"
            onClick={() => router.push(`/rooms/${roomId}/play`)}
            className="absolute left-0 top-0"
          />
          <h1 className="soft-title pt-3 text-[34px] leading-tight">交出你的猜想</h1>
          <div className="mx-auto mt-2 flex w-36 items-center justify-center gap-2 text-coffee/36">
            <span className="h-px flex-1 bg-coffee/22" />
            <PrototypeAsset src={decor.leaf} className="h-5 w-5" />
            <span className="h-px flex-1 bg-coffee/22" />
          </div>
        </header>

        <section>
          <StickerTag tone="sage" className="mb-4 text-base">
            已收集到的线索
          </StickerTag>
          <div className="space-y-3">
            {data.clues.map((clue, index) => (
              <TornPaperCard key={clue.id} tone="cream" className="flex items-start gap-3 px-4 py-3">
                <PrototypeAsset src={numberToken(index + 1, "default")} className="mt-1 h-8 w-8 shrink-0" />
                <div>
                  <p className="soft-title text-lg">{clue.name}</p>
                  <p className="font-serif text-base leading-7 text-coffee/70">{clue.clue}</p>
                </div>
              </TornPaperCard>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <StickerTag icon={<PrototypeAsset src={decor.heart} className="h-4 w-4" />} className="mb-4 text-base">
            你觉得它更像哪一句？
          </StickerTag>
          <div className="space-y-4">
            {data.options.map((option) => {
              const selected = selectedOptionId === option.id;
              return (
                <GuessAssetCard
                  key={option.id}
                  onClick={() => setSelectedOptionId(option.id)}
                  selected={selected}
                >
                  <span>
                    <span className="block soft-title text-xl leading-8">{option.label}</span>
                    <span className={cn("mt-1 block font-serif text-base leading-7 text-coffee/62", selected && "text-cream/82")}>
                      {option.description}
                    </span>
                  </span>
                </GuessAssetCard>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <StickerTag icon={<PenLine className="h-4 w-4" />} className="mb-4 text-base">
            也可以写一句自己的猜测
          </StickerTag>
          <textarea
            value={ownGuess}
            onChange={(event) => setOwnGuess(event.target.value.slice(0, 80))}
            placeholder="我觉得这句话可能是在说……"
            className="min-h-36 w-full resize-none border-0 bg-[url('/assets/prototype/classified/transparent/ui/message_note/message_note_empty.png')] bg-[length:100%_100%] bg-center px-6 py-6 font-serif text-lg leading-[34px] text-coffee drop-shadow-sticker outline-none placeholder:text-coffee/42 focus:ring-2 focus:ring-warm-orange/35"
          />
        </section>

        <TornPaperCard tone="parchment" className="mt-7 px-6 py-4 text-center font-serif text-lg leading-8" tape="corner">
          提交后，房间主人可以看到你的猜测记录。
        </TornPaperCard>

        <PaperButton
          className="mb-12 mt-7"
          withTape
          disabled={!selectedOptionId || isSubmitting}
          icon={<Send className="h-7 w-7" />}
          onClick={handleSubmit}
        >
          {isSubmitting ? "正在交给小屋" : "交出我的猜想"}
          <ChevronRight className="h-7 w-7" />
        </PaperButton>
      </PaperPage>
    </AppShell>
  );
}
