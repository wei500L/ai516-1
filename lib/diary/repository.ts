import type { DiaryRepository } from "@/lib/diary/createDiaryEntry";
import type { MemoryScope } from "@/lib/diary/updateMemoryDocument";
import {
  supabaseRest,
  type SupabaseServerConfig
} from "@/lib/server/supabaseRest";

export function createDiaryRepository(config: SupabaseServerConfig): DiaryRepository {
  return {
    async createDiaryEntry(args) {
      const rows = await supabaseRest<Array<{ id: string }>>(
        "diary_entries",
        {
          method: "POST",
          body: JSON.stringify({
            owner_id: args.ownerId,
            room_id: args.roomId,
            guess_attempt_id: args.guessAttemptId,
            entry_type: args.entryType,
            title: args.title,
            markdown_content: args.markdownContent,
            visibility: args.visibility ?? "private"
          })
        },
        config
      );

      return { id: rows[0]?.id ?? "" };
    },
    async loadMemoryDocument(scope: MemoryScope) {
      const rows = await supabaseRest<
        Array<{ id: string; markdown_content: string; summary: string | null }>
      >(
        `memory_documents?owner_id=eq.${encodeURIComponent(
          scope.ownerId
        )}&scope_type=eq.${scope.scopeType}${
          scope.scopeId
            ? `&scope_id=eq.${encodeURIComponent(scope.scopeId)}`
            : "&scope_id=is.null"
        }&select=id,markdown_content,summary&limit=1`,
        { method: "GET" },
        config
      );
      const row = rows[0];

      return {
        id: row?.id ?? null,
        markdownContent: row?.markdown_content ?? "",
        summary: row?.summary ?? null
      };
    },
    async saveMemoryDocument(args) {
      const body = JSON.stringify({
        owner_id: args.ownerId,
        scope_type: args.scopeType,
        scope_id: args.scopeId,
        markdown_content: args.markdownContent,
        summary: args.summary
      });

      if (args.id) {
        await supabaseRest(
          `memory_documents?id=eq.${encodeURIComponent(args.id)}`,
          {
            method: "PATCH",
            body
          },
          config
        );
        return;
      }

      await supabaseRest(
        "memory_documents",
        {
          method: "POST",
          body
        },
        config
      );
    }
  };
}

export function markdownPreview(markdown: string) {
  return markdown
    .replace(/[#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function containsUnsafeCommentContent(content: string) {
  return /<script|<\/script|javascript:|onerror=|onload=/i.test(content);
}
