import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const AIChat = ({ boardId }: { boardId: string }) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    const loadingToast = toast.loading("AI is thinking...");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, boardId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI failed to perform actions");
      }

      toast.success(data.message || "AI actions completed!", {
        id: loadingToast,
      });

      setPrompt("");
    } catch (error) {
      console.error("AI Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute AI request",
        {
          id: loadingToast,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/95 to-cyan-50/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-200/50">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Make all notes blue and delete the red circle"
            disabled={isLoading}
            className="w-full px-4 py-3 pr-12 bg-white/90 border border-blue-200/60 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: "400px" }}
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center w-12 h-12 cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-slate-300 disabled:to-slate-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <div className="relative">
              <Sparkles className="w-5 h-5 text-white transition-transform " />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </button>
      </div>
    </form>
  );
};

export default AIChat;
