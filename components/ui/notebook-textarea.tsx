import { cn } from "@/lib/utils";

type NotebookTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function NotebookTextarea({ className, ...props }: NotebookTextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[clamp(260px,32dvh,300px)] w-full resize-none border-0 bg-[url('/assets/prototype/classified/transparent/ui/notes/note_wide_paperclip.png')] bg-[length:100%_100%] bg-center px-8 py-9 font-serif text-xl leading-[38px] text-coffee drop-shadow-sticker outline-none placeholder:text-coffee/42 focus:ring-2 focus:ring-warm-orange/35",
        className
      )}
      {...props}
    />
  );
}
