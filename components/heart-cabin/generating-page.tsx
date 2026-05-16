"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Heart, House, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { HanddrawnIconButton } from "@/components/handbook/handdrawn-icon-button";
import { PaperButton } from "@/components/handbook/paper-button";
import { ProgressStickers } from "@/components/handbook/progress-stickers";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { AppShell } from "@/components/layout/app-shell";
import { PaperPage } from "@/components/layout/paper-page";
import { MiniDoor } from "@/components/heart-cabin/decorations";
import { useCreateRoomDraft } from "@/lib/use-create-room-draft";

export function GeneratingPage() {
  const router = useRouter();
  const { draft, resetDraft } = useCreateRoomDraft();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const sentence = draft.sentence.trim();

    if (!sentence) {
      router.replace("/create");
      return;
    }

    async function generateRoom() {
      const response = await fetch("/api/rooms/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sentence,
          emotionTags: draft.moodTags.length > 0 ? draft.moodTags : ["秘密"],
          imageAssetId: null,
          visibility: "unlisted"
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error?.message ?? "生成失败，请稍后再试。"
        );
      }

      const payload = (await response.json()) as {
        redirectUrl?: string;
      };

      resetDraft();
      router.replace(payload.redirectUrl ?? "/");
    }

    generateRoom().catch((reason) => {
      setError(reason instanceof Error ? reason.message : "生成失败，请稍后再试。");
    });
  }, [draft.moodTags, draft.sentence, resetDraft, router]);

  return (
    <AppShell>
      <PaperPage className="pt-16">
        <header className="relative mb-6 text-center">
          <HanddrawnIconButton
            icon={<ArrowLeft className="h-7 w-7" />}
            label="返回创建页"
            onClick={() => router.push("/create")}
            className="absolute left-0 top-0"
          />
          <h1 className="soft-title pt-12 text-[34px] leading-tight">正在把心事藏进小屋......</h1>
        </header>

        <section className="relative mt-9 h-[360px]">
          <TornPaperCard className="absolute left-9 top-8 z-10 w-28 -rotate-[13deg] p-3 font-serif text-base leading-7" tone="parchment">
            {draft.sentence.trim() ? draft.sentence.trim().slice(0, 12) : "你的心事正在被读懂"}
          </TornPaperCard>
          <TornPaperCard className="absolute left-32 top-28 z-20 w-24 rotate-[9deg] p-3 font-serif text-base leading-7" tone="parchment">
            变成线索
          </TornPaperCard>
          <TornPaperCard className="absolute left-48 top-40 z-10 w-20 rotate-[15deg] p-3 font-serif text-base leading-7" tone="parchment">
            轻轻收好
          </TornPaperCard>
          <motion.div
            animate={{ opacity: [0.45, 1, 0.55], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute left-12 top-40 h-28 w-56 rounded-full bg-warm-orange/16 blur-xl"
          />
          <MiniDoor className="absolute bottom-8 left-1/2 -translate-x-1/2" />
        </section>

        <div className="mt-2 grid grid-cols-3 gap-3">
          {[
            ["1", "读懂这句话的情绪", <Heart key="h" className="h-10 w-10 text-brick-red" />],
            ["2", "变成 5 个线索物件", <KeyRound key="k" className="h-10 w-10 text-coffee/70" />],
            ["3", "搭好一间秘密小屋", <House key="r" className="h-10 w-10 text-sage" />]
          ].map(([index, label, icon]) => (
            <TornPaperCard key={String(index)} className="min-h-32 p-3 text-center" tape="top">
              <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage text-sm text-cream">
                {index}
              </span>
              <div className="mx-auto mb-2 flex justify-center">{icon}</div>
              <p className="font-serif text-base leading-6">{label}</p>
            </TornPaperCard>
          ))}
        </div>

        <section className="mt-7">
          <p className="mb-4 font-serif text-xl">线索正在生成</p>
          <ProgressStickers total={5} current={3} />
        </section>

        <TornPaperCard tone="cream" className="mt-8 text-center font-serif text-xl" tape="corner">
          {error ?? "别急，秘密正在被轻轻收好。"}
        </TornPaperCard>

        <PaperButton className="mb-12 mt-8" withTape onClick={() => router.push("/create")}>
          {error ? "回到信纸重试" : "回到信纸"}
          <ChevronRight className="h-7 w-7" />
        </PaperButton>
      </PaperPage>
    </AppShell>
  );
}
