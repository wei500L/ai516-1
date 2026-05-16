"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Home,
  KeyRound,
  Leaf,
  Coffee,
  Sparkles,
  Star
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { HanddrawnIcons } from "@/components/handbook/handdrawn-assets";
import { HanddrawnIconButton } from "@/components/handbook/handdrawn-icon-button";
import { Tape } from "@/components/handbook/tape";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { AppShell } from "@/components/layout/app-shell";
import { PaperPage } from "@/components/layout/paper-page";
import { Stamp } from "@/components/heart-cabin/decorations";
import { mockCreateRoom } from "@/lib/mock-create-room";
import { useCreateRoomDraft } from "@/lib/use-create-room-draft";
import { cn } from "@/lib/utils";

const generationSteps = [
  {
    title: "读懂这句话的情绪",
    icon: <HanddrawnIcons.Heart className="h-10 w-10 text-brick-red" />
  },
  {
    title: "变成 5 个线索物件",
    icon: (
      <div className="flex items-center justify-center gap-1 text-coffee/70">
        <KeyRound className="h-8 w-8" strokeWidth={1.5} />
        <Leaf className="h-8 w-8 text-sage" strokeWidth={1.5} />
        <Coffee className="h-8 w-8 text-warm-orange" strokeWidth={1.5} />
      </div>
    )
  },
  {
    title: "搭好一间秘密小屋",
    icon: <Home className="h-11 w-11 text-sage" strokeWidth={1.4} />
  }
];

const clueStickers = [
  { icon: <Leaf className="h-8 w-8" strokeWidth={1.4} />, label: "植物" },
  { icon: <KeyRound className="h-8 w-8" strokeWidth={1.4} />, label: "钥匙" },
  { icon: <Coffee className="h-8 w-8" strokeWidth={1.4} />, label: "杯子" },
  { icon: <BookOpen className="h-8 w-8" strokeWidth={1.4} />, label: "日记" },
  { icon: <Star className="h-8 w-8" strokeWidth={1.4} />, label: "星星" }
];

export function GeneratingPage() {
  const router = useRouter();
  const draft = useCreateRoomDraft((state) => state.draft);
  const [activeStep, setActiveStep] = useState(0);
  const [clueProgress, setClueProgress] = useState(0);

  const fragments = useMemo(() => getSentenceFragments(draft.sentence), [draft.sentence]);

  useEffect(() => {
    let cancelled = false;
    const timers = [
      window.setTimeout(() => setClueProgress(1), 450),
      window.setTimeout(() => setActiveStep(1), 1250),
      window.setTimeout(() => setClueProgress(2), 1350),
      window.setTimeout(() => setClueProgress(3), 2100),
      window.setTimeout(() => setActiveStep(2), 2550),
      window.setTimeout(() => setClueProgress(4), 2950),
      window.setTimeout(() => setClueProgress(5), 3650)
    ];

    mockCreateRoom(draft).then((room) => {
      if (!cancelled) {
        router.push(`/play/${room.roomId}`);
      }
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [draft, router]);

  return (
    <AppShell>
      <PaperPage className="pt-16">
        <Tape className="left-16 top-11" />
        <header className="relative mb-6 text-center">
          <HanddrawnIconButton
            icon={<ArrowLeft className="h-7 w-7" />}
            label="返回创建页"
            onClick={() => router.push("/create")}
            className="absolute left-0 top-0"
          />
          <Stamp className="absolute right-2 top-0" />
          <h1 className="soft-title pt-14 text-[35px] leading-tight">
            正在把心事藏进小屋……
            <HanddrawnIcons.Heart className="mb-1 ml-1 inline h-6 w-6 text-warm-orange" />
          </h1>
          <div className="mx-auto mt-4 flex w-48 items-center justify-center gap-2 text-coffee/32">
            <span className="h-px flex-1 bg-coffee/24" />
            <HanddrawnIcons.Flower className="h-5 w-5" />
            <span className="h-px flex-1 bg-coffee/24" />
          </div>
        </header>

        <section aria-label="心事藏进纸板小门的动画" className="relative mt-5 h-[385px]">
          <GeneratingDoorStage fragments={fragments} />
        </section>

        <section className="mt-3 grid grid-cols-3 gap-3" aria-label="生成步骤">
          {generationSteps.map((step, index) => (
            <GenerationStepCard
              key={step.title}
              index={index}
              title={step.title}
              active={index <= activeStep}
            >
              {step.icon}
            </GenerationStepCard>
          ))}
        </section>

        <section className="mt-7" aria-label="线索生成进度">
          <div className="mb-4 flex items-center gap-3">
            <p className="shrink-0 font-serif text-xl">线索正在生成</p>
            <span className="h-px flex-1 border-t border-dashed border-coffee/28" />
          </div>
          <div className="flex items-center justify-between gap-3">
            {clueStickers.map((item, index) => {
              const active = index < clueProgress;
              return (
                <motion.span
                  key={item.label}
                  initial={false}
                  animate={active ? { y: [0, -4, 0], rotate: [-2, 2, 0] } : { y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className={cn(
                    "torn-edge paper-grain relative flex h-14 w-14 items-center justify-center bg-cream text-coffee/45 shadow-sticker",
                    active &&
                      "text-warm-orange shadow-[0_0_16px_rgba(236,169,77,0.62),0_7px_13px_rgba(75,45,21,0.18)]"
                  )}
                  title={item.label}
                >
                  {item.icon}
                  {active ? (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warm-orange text-cream shadow-sticker">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                  ) : null}
                </motion.span>
              );
            })}
          </div>
        </section>

        <TornPaperCard
          tone="cream"
          className="mb-12 mt-8 px-7 py-5 text-center font-serif text-xl leading-8"
          tape="corner"
        >
          <HanddrawnIcons.Flower className="mr-2 inline h-6 w-6 text-warm-orange" />
          别急，秘密正在被轻轻收好。
          <HanddrawnIcons.Heart className="ml-2 inline h-5 w-5 text-warm-orange" />
        </TornPaperCard>
      </PaperPage>
    </AppShell>
  );
}

function GenerationStepCard({
  index,
  title,
  active,
  children
}: {
  index: number;
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: active ? 1 : 0.58,
        y: active ? 0 : 6,
        scale: active ? 1 : 0.98
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <TornPaperCard
        className={cn(
          "min-h-32 p-3 text-center transition-shadow",
          active && "shadow-[0_0_18px_rgba(236,169,77,0.32),0_9px_16px_rgba(72,45,24,0.18)]"
        )}
        tape="top"
      >
        <span
          className={cn(
            "mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
            active ? "bg-sage text-cream" : "bg-coffee/15 text-coffee/45"
          )}
        >
          {index + 1}
        </span>
        <div className="mx-auto mb-2 flex h-11 items-center justify-center">{children}</div>
        <p className="font-serif text-base leading-6">{title}</p>
      </TornPaperCard>
    </motion.div>
  );
}

function GeneratingDoorStage({ fragments }: { fragments: string[] }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute bottom-6 left-1/2 h-16 w-[88%] -translate-x-1/2 rounded-[50%] bg-coffee/16 blur-sm" />
      <div className="absolute bottom-8 left-6 h-20 w-20 border-b-[10px] border-l-[8px] border-cream/70 opacity-80" />
      <div className="absolute bottom-8 right-6 h-20 w-20 border-b-[10px] border-r-[8px] border-cream/70 opacity-80" />
      <PaperVines className="left-10 top-36" />
      <PaperVines className="right-9 top-28 scale-x-[-1]" />

      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.4, 0.9, 0.48], scale: [0.96, 1.06, 0.98] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-1/2 h-52 w-44 -translate-x-1/2 rounded-t-full bg-warm-orange/28 blur-xl"
      />

      <div className="absolute bottom-14 left-1/2 h-64 w-48 -translate-x-1/2">
        <div className="absolute bottom-0 left-1/2 h-56 w-40 -translate-x-1/2 rounded-t-full bg-[#b78758] shadow-paper" />
        <div className="absolute bottom-4 left-1/2 h-52 w-32 -translate-x-[30%] rounded-t-full bg-[#8e5c37] shadow-[12px_0_0_rgba(62,38,22,0.18)]">
          <div className="absolute inset-x-4 top-0 h-full bg-[repeating-linear-gradient(90deg,transparent_0_16px,rgba(55,32,16,0.20)_16px_18px)]" />
          <HanddrawnIcons.Heart className="absolute left-1/2 top-20 h-7 w-7 -translate-x-1/2 text-coffee/70" />
          <span className="absolute right-5 top-32 h-3 w-3 rounded-full bg-parchment shadow-sticker" />
        </div>
        <motion.div
          animate={{ opacity: [0.7, 1, 0.72], x: [0, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 left-[58%] h-52 w-8 rounded-r-full bg-[#ffd37c] shadow-[0_0_28px_rgba(255,199,90,0.95)]"
        />
        <div className="absolute bottom-5 left-[62%] h-44 w-24 rounded-r-full bg-[linear-gradient(90deg,rgba(255,210,116,0.58),rgba(255,244,208,0.16))]" />
        <div className="absolute bottom-8 left-[66%] h-32 w-16 opacity-40">
          <div className="absolute bottom-0 h-28 w-12 rounded-t-[20px] bg-coffee/25" />
          <div className="absolute bottom-20 left-8 h-8 w-4 bg-coffee/20" />
          <div className="absolute bottom-14 left-4 h-5 w-5 bg-warm-orange/60 shadow-[0_0_10px_rgba(255,210,116,0.8)]" />
        </div>
        <div className="absolute bottom-0 left-0 h-12 w-16 bg-cream/45 shadow-sticker" />
        <div className="absolute bottom-0 right-0 h-12 w-16 bg-cream/45 shadow-sticker" />
      </div>

      {fragments.map((fragment, index) => (
        <FloatingFragment key={`${fragment}-${index}`} text={fragment} index={index} />
      ))}

      <motion.span
        animate={{ opacity: [0.2, 0.8, 0.25], y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[28%] top-[42%] text-warm-orange"
      >
        <Sparkles className="h-6 w-6" />
      </motion.span>
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -10, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute right-[27%] top-[55%] text-warm-orange"
      >
        <Sparkles className="h-5 w-5" />
      </motion.span>
    </div>
  );
}

function FloatingFragment({ text, index }: { text: string; index: number }) {
  const positions = [
    "left-9 top-10 w-28 rotate-[-13deg]",
    "left-24 top-[6.75rem] w-24 rotate-[9deg]",
    "left-44 top-[9.75rem] w-20 rotate-[15deg]",
    "left-11 top-48 w-16 rotate-[-6deg]",
    "right-14 top-52 w-[4.5rem] rotate-[8deg]"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: -8, rotate: index % 2 ? 8 : -10 }}
      animate={{
        opacity: [0, 1, 0.92, 0.55],
        y: [18, 0, -8, 70],
        x: [index % 2 ? 18 : -10, 0, index % 2 ? 16 : -18, 72],
        rotate: [index % 2 ? 10 : -12, index % 2 ? 4 : -6, index % 2 ? 9 : -2, 18]
      }}
      transition={{
        duration: 4.2,
        delay: index * 0.32,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: "easeInOut"
      }}
      className={cn(
        "torn-edge paper-grain absolute z-20 bg-parchment p-2 text-center font-serif text-sm leading-6 text-coffee shadow-sticker",
        positions[index % positions.length]
      )}
    >
      {text}
    </motion.div>
  );
}

function PaperVines({ className }: { className?: string }) {
  return (
    <div className={cn("absolute h-28 w-10 text-sage/55", className)}>
      <span className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-sage/35" />
      <Leaf className="absolute left-0 top-5 h-6 w-6 rotate-[-24deg]" strokeWidth={1.3} />
      <Leaf className="absolute right-0 top-10 h-5 w-5 rotate-[24deg]" strokeWidth={1.3} />
      <Leaf className="absolute left-1 top-[4.25rem] h-5 w-5 rotate-[-18deg]" strokeWidth={1.3} />
    </div>
  );
}

function getSentenceFragments(sentence: string) {
  const fallback = ["我总是", "怕让别人失望", "但我也好累...", "藏起来", "变成线索"];
  const clean = sentence.trim().replace(/\s+/g, "");

  if (clean.length < 4) {
    return fallback;
  }

  const size = Math.max(2, Math.ceil(clean.length / 3));
  const pieces = [clean.slice(0, size), clean.slice(size, size * 2), clean.slice(size * 2)]
    .filter(Boolean)
    .map((item) => (item.length > 8 ? `${item.slice(0, 8)}...` : item));

  return [...pieces, "变成线索", "轻轻收好"].slice(0, 5);
}
