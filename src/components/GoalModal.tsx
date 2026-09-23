import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, FileText } from 'lucide-react';
import { SavingsGoal, User } from '../types';
import { CURRENCY_CONFIGS } from '../utils/formatters';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSaveGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>, id?: number) => void;
  initialGoal?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveGoal,
  initialGoal,
}) => {
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [savedAmount, setSavedAmount] = useState<string>('0');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(initialGoal.target_amount.toString());
      setSavedAmount(initialGoal.saved_amount.toString());
      setTargetDate(initialGoal.target_date || '');
      setNotes(initialGoal.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setSavedAmount('0');
      // default 6 months in future
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setTargetDate(future.toISOString().slice(0, 10));
      setNotes('');
    }
  }, [initialGoal, isOpen]);

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

  const currencySymbol = CURRENCY_CONFIGS[user.currency]?.symbol || '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedSaved = parseFloat(savedAmount) || 0;
    if (isNaN(parsedTarget) || parsedTarget <= 0) return;

    onSaveGoal(
      {
        user_id: user.id,
        name: name.trim(),
        target_amount: parsedTarget,
        saved_amount: parsedSaved,
        target_date: targetDate,
        is_completed: parsedSaved >= parsedTarget,
        notes: notes.trim(),
      },
      initialGoal?.id
    );
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
              {initialGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
            </h3>
            <p className="text-xs text-slate-500">Track and achieve your financial aspirations</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="goal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Goal Name *
            </label>
            <input
              id="goal-name-input"
              type="text"
              required
              placeholder="e.g. Emergency Fund, New Car, Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Amount ({user.currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currencySymbol}
                </span>
                <input
                  id="goal-target-input"
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Saved ({user.currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={savedAmount}
                  onChange={(e) => setSavedAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Motivation
            </label>
            <input
              type="text"
              placeholder="e.g. Put aside $200 each paycheck"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-amber-500"
            />
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
            id="goal-save-btn"
            type="submit"
            form="goal-form"
            className="px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            {initialGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};
