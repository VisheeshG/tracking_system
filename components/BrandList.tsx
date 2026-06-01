"use client";

import { useState } from "react";
import { Brand } from "@/lib/supabase";
import { Briefcase, Trash2, AlertTriangle, Link2, MousePointerClick } from "lucide-react";

export type BrandWithStats = Brand & {
  projectCount: number;
  linkCount: number;
  clickCount: number;
};

interface BrandListProps {
  brands: BrandWithStats[];
  onSelectBrand: (brand: Brand) => void;
  onDeleteBrand: (brandId: string) => void | Promise<void>;
}

export function BrandList({
  brands,
  onSelectBrand,
  onDeleteBrand,
}: BrandListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    brandId: string | null;
    brandName: string | null;
  }>({ show: false, brandId: null, brandName: null });

  const handleDelete = (
    e: React.MouseEvent,
    brandId: string,
    brandName: string
  ) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, brandId, brandName });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.brandId) {
      const brandId = deleteConfirm.brandId;
      setDeleteConfirm({ show: false, brandId: null, brandName: null });
      await onDeleteBrand(brandId);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, brandId: null, brandName: null });
  };

  if (brands.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="clickable-card relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-violet-300 transition group"
          >
            <button
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="absolute inset-0 z-0 w-full h-full rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              aria-label={`Open brand ${brand.name}`}
            />

            <div className="relative z-10 p-4 sm:p-6 pointer-events-none">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition flex-shrink-0">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, brand.id, brand.name)}
                  className="relative z-20 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-100 sm:opacity-0 group-hover:opacity-100 pointer-events-auto cursor-pointer"
                  aria-label={`Delete ${brand.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 group-hover:text-violet-600 transition break-words text-left">
                {brand.name}
              </h3>

              {brand.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2 text-left">
                  {brand.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-medium">
                  {brand.projectCount} project
                  {brand.projectCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {brand.linkCount.toLocaleString()} links
                </span>
                <span className="flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  {brand.clickCount.toLocaleString()} clicks
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="clickable-backdrop absolute inset-0 bg-black/50"
            onClick={cancelDelete}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Delete Brand
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteConfirm.brandName}</span>?
              Projects in this brand will move to Unbranded. This action cannot
              be undone.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={confirmDelete}
                className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
