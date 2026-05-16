"use client";

import { useState } from "react";
import { FlaskConical, ImageUp, Play, RefreshCw } from "lucide-react";
import { PaperButton } from "@/components/handbook/paper-button";
import { TornPaperCard } from "@/components/handbook/torn-paper-card";
import { testAdminLlmChat, testAdminLlmImage } from "@/lib/api/admin-llm";
import { useAdminLlmStore } from "@/lib/admin-llm-store";
import { cn } from "@/lib/utils";

type ResultState = {
  chat: string | null;
  image: string | null;
};

type LlmTestPanelProps = Record<string, never>;

export function LlmTestPanel({}: LlmTestPanelProps) {
  const config = useAdminLlmStore((state) => state.config);
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [result, setResult] = useState<ResultState>({ chat: null, image: null });

  async function handleChatTest() {
    setIsTestingChat(true);
    try {
      const output = await testAdminLlmChat({
        messages: [
          { role: "system", content: "你是《心事小屋》的测试助手，只返回简短 JSON。" },
          { role: "user", content: "请输出 {\"ok\":true,\"label\":\"chat test\"}" }
        ]
      });
      setResult((state) => ({
        ...state,
        chat: output.ok
          ? `成功 · ${output.latencyMs}ms · ${output.message ?? "chat 测试通过"}`
          : `失败 · ${output.error ?? "chat 测试失败"}`
      }));
    } catch (error) {
      setResult((state) => ({
        ...state,
        chat: `失败 · ${error instanceof Error ? error.message : "chat 测试失败"}`
      }));
    } finally {
      setIsTestingChat(false);
    }
  }

  async function handleImageTest() {
    setIsTestingImage(true);
    try {
      const output = await testAdminLlmImage({
        prompt:
          "一张《心事小屋》风格的线索物件测试图，旧纸、手账、纸板微缩模型、暖光、干净背景。"
      });
      setResult((state) => ({
        ...state,
        image: output.ok
          ? `成功 · ${output.latencyMs}ms · ${output.message ?? "image 测试通过"}`
          : `失败 · ${output.error ?? "image 测试失败"}`
      }));
    } catch (error) {
      setResult((state) => ({
        ...state,
        image: `失败 · ${error instanceof Error ? error.message : "image 测试失败"}`
      }));
    } finally {
      setIsTestingImage(false);
    }
  }

  return (
    <TornPaperCard tone="parchment" tape="corner" className="space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-sage" />
        <h2 className="soft-title text-2xl">测试连接</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PaperButton
          variant="paper"
          icon={<Play className="h-6 w-6" />}
          onClick={handleChatTest}
          disabled={isTestingChat}
          className="text-[18px]"
        >
          {isTestingChat ? "测试 chat..." : "测试 chat completions"}
        </PaperButton>
        <PaperButton
          variant="paper"
          icon={<ImageUp className="h-6 w-6" />}
          onClick={handleImageTest}
          disabled={isTestingImage}
          className="text-[18px]"
        >
          {isTestingImage ? "测试图像..." : "测试 image generation"}
        </PaperButton>
      </div>
      <button
        type="button"
        onClick={() => setResult({ chat: null, image: null })}
        className={cn(
          "inline-flex items-center gap-2 rounded-[3px] bg-cream/60 px-3 py-2 font-serif text-sm text-coffee/72 shadow-sticker"
        )}
      >
        <RefreshCw className="h-4 w-4" />
        清空结果
      </button>
      <div className="space-y-2 font-serif text-base leading-7">
        <p className="rounded-[3px] bg-cream/70 px-3 py-2">
          Chat: {result.chat ?? "尚未测试"}
        </p>
        <p className="rounded-[3px] bg-cream/70 px-3 py-2">
          Image: {result.image ?? "尚未测试"}
        </p>
        <p className="text-sm text-coffee/60">
          当前配置：
          {config
            ? `${config.provider.providerName} · ${config.chat.chatEndpointPath} · ${config.image.imagesEndpointPath}`
            : "尚未加载配置"}
        </p>
      </div>
    </TornPaperCard>
  );
}
