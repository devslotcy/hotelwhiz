"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

interface AITestResponse {
  reply: string;
  aiUsed?: boolean;
  modelUsed?: string;
  intent?: string;
  waUrl?: string;
  error?: string;
}

export default function AITestPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [testMessage, setTestMessage] = useState("");
  const [response, setResponse] = useState<AITestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ user: string; bot: AITestResponse }[]>([]);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          message: testMessage,
          sessionId: "ai-test-console",
        }),
      });

      const data = await res.json();

      if (data.error) {
        setResponse({ reply: data.error, error: data.error });
      } else {
        const botResponse: AITestResponse = {
          reply: data.reply,
          aiUsed: data.aiUsed,
          modelUsed: data.modelUsed,
          intent: data.intent,
          waUrl: data.waUrl,
        };
        setResponse(botResponse);
        setHistory((prev) => [...prev, { user: testMessage, bot: botResponse }]);
      }
    } catch (err) {
      setResponse({
        reply: "Network error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    "How far is the beach?",
    "Can I book a room for next week?",
    "What time is check-in?",
    "Do you have a swimming pool?",
    "ห้องพักราคาเท่าไหร่?", // Thai: room price?
    "Havuz var mı?", // Turkish: is there a pool?
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Test Console</h1>
        <p className="text-sm text-gray-600">
          Test your chatbot's AI responses in real-time. The bot will search the Knowledge Base first,
          then use AI (Groq/OpenAI) if needed.
        </p>
      </div>

      {/* Quick Test Buttons */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Test Questions:</p>
        <div className="flex flex-wrap gap-2">
          {quickTests.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setTestMessage(q)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Test Form */}
      <form onSubmit={handleTest} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !testMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Testing..." : "Send"}
          </button>
        </div>
      </form>

      {/* Latest Response Card */}
      {response && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Latest Response:</h3>
            <div className="flex gap-2 text-xs">
              {response.modelUsed && (
                <span
                  className={`px-2 py-1 rounded ${
                    response.modelUsed === "groq"
                      ? "bg-green-100 text-green-800"
                      : response.modelUsed === "openai"
                      ? "bg-purple-100 text-purple-800"
                      : response.modelUsed === "kb"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {response.modelUsed.toUpperCase()}
                </span>
              )}
              {response.intent && (
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
                  Intent: {response.intent}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{response.reply}</p>
          {response.waUrl && (
            <a
              href={response.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              📱 WhatsApp Link
            </a>
          )}
          {response.error && (
            <p className="mt-2 text-sm text-red-600">Error: {response.error}</p>
          )}
        </div>
      )}

      {/* Conversation History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Conversation History:</h3>
            <button
              onClick={() => setHistory([])}
              className="text-sm text-red-600 hover:underline"
            >
              Clear History
            </button>
          </div>
          {history.map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="mb-2">
                <span className="font-medium text-blue-700">You:</span>{" "}
                <span className="text-gray-800">{item.user}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-green-700">Bot:</span>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm">{item.bot.reply}</p>
                  {item.bot.modelUsed && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      via {item.bot.modelUsed}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && !response && (
        <div className="text-center py-12 text-gray-500">
          <p>Start testing by sending a message above</p>
        </div>
      )}
    </div>
  );
}
