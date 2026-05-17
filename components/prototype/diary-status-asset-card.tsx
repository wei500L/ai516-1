import { PrototypeAsset } from "@/components/prototype/prototype-asset";
import { classifiedAsset } from "@/lib/prototype-assets";
import { cn } from "@/lib/utils";

type DiaryStatus = "locked" | "near" | "requestable" | "unlocked" | "saved";

type DiaryStatusAssetCardProps = {
  status: DiaryStatus;
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

const diaryAssets: Record<DiaryStatus, string> = {
  locked: classifiedAsset("objects/diary/diary_lock_unmet_card.png"),
  near: classifiedAsset("objects/diary/diary_near_unlock_card.png"),
  requestable: classifiedAsset("objects/diary/diary_requestable.png"),
  unlocked: classifiedAsset("objects/diary/diary_unlocked_card.png"),
  saved: classifiedAsset("objects/diary/diary_unlocked_note.png")
};

const tagAssets: Record<DiaryStatus, string> = {
  locked: classifiedAsset("ui/progress/affinity_tag_keep_close.png"),
  near: classifiedAsset("ui/progress/affinity_tag_keep_close.png"),
  requestable: classifiedAsset("ui/progress/affinity_tag_tacit_match.png"),
  unlocked: classifiedAsset("ui/progress/affinity_tag_unlocked.png"),
  saved: classifiedAsset("ui/progress/affinity_tag_unlocked.png")
};

export function DiaryStatusAssetCard({
  status,
  title,
  children,
  className,
  action
}: DiaryStatusAssetCardProps) {
  return (
    <div className={cn("relative min-h-[164px] px-6 py-5 font-serif text-lg leading-8 text-coffee drop-shadow-sticker", className)}>
      <PrototypeAsset
        src={diaryAssets[status]}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fit="fill"
      />
      <div className="relative z-10">
        <PrototypeAsset src={tagAssets[status]} className="mb-2 h-8 w-32" fit="contain" />
        <h3 className="soft-title text-2xl">{title}</h3>
        <div className="mt-2 text-coffee/74">{children}</div>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
