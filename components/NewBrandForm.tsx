"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { slugifyName, isValidSlug } from "@/lib/slug-utils";

interface NewBrandFormProps {
  onSubmit: (
    name: string,
    description: string,
    slug: string
  ) => Promise<boolean>;
  onCancel: () => void;
}

export function NewBrandForm({ onSubmit, onCancel }: NewBrandFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slugTouched) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (name.trim()) setSlug(slugifyName(name));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, slugTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name, description, slug);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-4 sm:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Create New Brand
          </h3>
          <p className="text-xs text-slate-600">
            Used in public links: linkto.in/your-brand/...
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="brand-name"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Brand Name
          </label>
          <input
            id="brand-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-3 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
            placeholder="e.g., Finance with Sharan"
            required
          />
        </div>

        <div>
          <label
            htmlFor="brand-slug"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Brand URL slug
          </label>
          <input
            id="brand-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            className={`w-full px-3 py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all font-mono ${
              slug && !isValidSlug(slug)
                ? "border-amber-400 bg-amber-50"
                : "border-slate-300"
            }`}
            placeholder="fws"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Public links look like{" "}
            <span className="font-mono text-slate-700">
              linkto.in/{slug || "your-brand"}/project/link/creator
            </span>
          </p>
        </div>

        <div>
          <label
            htmlFor="brand-description"
            className="block text-sm font-bold text-slate-700 mb-1.5"
          >
            Description{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="brand-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-3 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none transition-all"
            rows={2}
            placeholder="Brief description of this brand"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isValidSlug(slug)}
          className="w-full sm:flex-1 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white py-2 text-sm rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Brand"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-sm rounded-xl transition-all font-semibold disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
