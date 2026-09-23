import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal, User } from '../types';
import { CURRENCY_CONFIGS, formatCurrency } from '../utils/formatters';

interface GoalFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  user: User;
  onUpdateGoalAmount: (goalId: number, newSavedAmount: number, isCompleted: boolean) => void;
}

export const GoalFundsModal: React.FC<GoalFundsModalProps> = ({
  isOpen,
  onClose,
  goal,
  user,
  onUpdateGoalAmount,
}) => {
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('');

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

  if (!isOpen || !goal) return null;

  const currencySymbol = CURRENCY_CONFIGS[user.currency]?.symbol || '$';
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    let newSaved = action === 'deposit' ? goal.saved_amount + val : goal.saved_amount - val;
    if (newSaved < 0) newSaved = 0;

    const willBeCompleted = newSaved >= goal.target_amount;

    if (willBeCompleted && !goal.is_completed) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // ignore if not supported
      }
    }

    onUpdateGoalAmount(goal.id, newSaved, willBeCompleted);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-sm w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{goal.name}</h3>
            <p className="text-xs text-slate-500">
              Current: {formatCurrency(goal.saved_amount, user.currency)} / {formatCurrency(goal.target_amount, user.currency)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAction('deposit')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                action === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Deposit Funds
            </button>
            <button
              type="button"
              onClick={() => setAction('withdraw')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                action === 'withdraw'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Withdraw
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {action === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'} *
              </label>
              {action === 'deposit' && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toString())}
                  className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                >
                  Pay remainder ({formatCurrency(remaining, user.currency)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                {currencySymbol}
              </span>
              <input
                id="funds-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="funds-submit-btn"
              type="submit"
              className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                action === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Confirm {action === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
