"use client";

import { useState, useTransition } from "react";
import { BookOpen, Plus, Trash2, Save, Loader2, Sparkles } from "lucide-react";
import { seedKBTemplates, createKBEntry, updateKBEntry, deleteKBEntry } from "./actions";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface KBSectionProps {
  slug: string;
  entries: KBEntry[];
  categories: Record<string, string>;
}

export function KBSection({ slug, entries, categories }: KBSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);
  const usedCategories = [...new Set(entries.map((e) => e.category))];

  function handleSeedTemplates() {
    startTransition(async () => {
      await seedKBTemplates(slug);
    });
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Knowledge Base</h3>
          <span className="text-xs text-slate-500">({entries.length} questions)</span>
        </div>
        <div className="flex gap-2">
          {entries.length === 0 && (
            <button
              onClick={handleSeedTemplates}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Load Templates
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition"
          >
            <Plus className="w-3 h-3" />
            Add Question
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {entries.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {usedCategories.map((cat) => (
            <FilterChip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
              {categories[cat] || cat}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Add New Form */}
      {showAdd && (
        <AddEntryForm
          slug={slug}
          categories={categories}
          onDone={() => setShowAdd(false)}
        />
      )}

      {/* Empty State */}
      {entries.length === 0 && !showAdd && (
        <div className="text-center py-8">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No knowledge base entries yet</p>
          <p className="text-slate-500 text-xs">
            Click &quot;Load Templates&quot; to start with 15 common hotel questions
          </p>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <KBEntryRow
            key={entry.id}
            entry={entry}
            slug={slug}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
}

function KBEntryRow({
  entry,
  slug,
  categories,
}: {
  entry: KBEntry;
  slug: string;
  categories: Record<string, string>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [answer, setAnswer] = useState(entry.answer);
  const [question, setQuestion] = useState(entry.question);
  const [isPending, startTransition] = useTransition();

  const hasAnswer = entry.answer.trim().length > 0;

  function handleSave() {
    startTransition(async () => {
      await updateKBEntry(slug, entry.id, { question, answer });
      setIsEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this question?")) return;
    startTransition(async () => {
      await deleteKBEntry(slug, entry.id);
    });
  }

  if (isEditing) {
    return (
      <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Type your answer here..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setIsEditing(false); setAnswer(entry.answer); setQuestion(entry.question); }}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs text-white font-medium transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group rounded-lg p-4 cursor-pointer transition border ${
        hasAnswer
          ? "bg-slate-900 border-slate-700 hover:border-slate-600"
          : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
      }`}
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-700 text-slate-300 rounded">
              {categories[entry.category] || entry.category}
            </span>
            {!hasAnswer && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                Needs answer
              </span>
            )}
          </div>
          <p className="text-sm text-white font-medium">{entry.question}</p>
          {hasAnswer ? (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.answer}</p>
          ) : (
            <p className="text-xs text-amber-400/60 mt-1 italic">Click to add answer...</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function AddEntryForm({
  slug,
  categories,
  onDone,
}: {
  slug: string;
  categories: Record<string, string>;
  onDone: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    startTransition(async () => {
      await createKBEntry(slug, { question, answer, category });
      setQuestion("");
      setAnswer("");
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-blue-500/30 rounded-lg p-4 mb-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Do you offer room service?"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="general">General</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder="Type your answer (can fill later)"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs text-white font-medium transition disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add
        </button>
      </div>
    </form>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-lg transition ${
        active
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          : "bg-slate-700/50 text-slate-400 border border-transparent hover:border-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
