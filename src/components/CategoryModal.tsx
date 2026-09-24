import React, { useState, useEffect } from 'react';
import { X, Tag, Palette } from 'lucide-react';
import { Category, CategoryType } from '../types';
import { AVAILABLE_ICONS, CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (category: Omit<Category, 'id' | 'created_at'>, id?: number) => void;
  initialCategory?: Category | null;
}

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#0EA5E9', // Sky
  '#F97316', // Orange
  '#84CC16', // Lime
  '#64748B', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSaveCategory,
  initialCategory,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setIcon(initialCategory.icon);
      setColor(initialCategory.color);
    } else {
      setName('');
      setType('expense');
      setIcon('Tag');
      setColor('#3B82F6');
    }
  }, [initialCategory, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCategory(
      {
        name: name.trim(),
        type,
        icon,
        color,
      },
      initialCategory?.id
    );
    setName('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {initialCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <p className="text-xs text-slate-500">
              {initialCategory ? 'Modify category name, icon, and styling' : 'Create a personalized tracking tag'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="category-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income Category
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Subscriptions, Pet Care, Book royalties"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Theme Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 rounded-lg transition transform active:scale-95 flex items-center justify-center cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    icon === ic ? 'bg-amber-100 ring-2 ring-amber-500' : 'hover:bg-slate-100'
                  }`}
                >
                  <CategoryIcon iconName={ic} color={color} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Sticky Pinned Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            className="px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            {initialCategory ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
};
