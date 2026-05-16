export type MemoryScope = {
  ownerId: string;
  scopeType: "user" | "room" | "relationship" | "pet";
  scopeId: string | null;
};

export type MemoryDocumentRepository = {
  loadMemoryDocument(scope: MemoryScope): Promise<{
    id: string | null;
    markdownContent: string;
    summary: string | null;
  }>;
  saveMemoryDocument(args: MemoryScope & {
    id: string | null;
    markdownContent: string;
    summary: string;
  }): Promise<void>;
};

function summarizeMarkdown(markdown: string) {
  return markdown
    .replace(/[#>*_`-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 80)
    .join(" ");
}

export async function appendMemoryDocument(args: {
  repository: MemoryDocumentRepository;
  scope: MemoryScope;
  eventMarkdown: string;
}) {
  const existing = await args.repository.loadMemoryDocument(args.scope);
  const scopeHeader = `<!-- memory-scope: owner=${args.scope.ownerId}; type=${args.scope.scopeType}; id=${args.scope.scopeId ?? "none"} -->`;
  const base = existing.markdownContent.trim() || scopeHeader;
  const updatedMarkdown = `${base}\n\n## ${new Date().toISOString()}\n\n${args.eventMarkdown.trim()}`;
  const summary = summarizeMarkdown(updatedMarkdown);

  await args.repository.saveMemoryDocument({
    ...args.scope,
    id: existing.id,
    markdownContent: updatedMarkdown,
    summary
  });

  return {
    markdownContent: updatedMarkdown,
    summary
  };
}
