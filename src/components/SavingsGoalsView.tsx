import React, { useMemo } from 'react';
import { 
  Plus, 
  Target, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  Trophy
} from 'lucide-react';
import { SavingsGoal, User } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SavingsGoalsViewProps {
  user: User;
  goals: SavingsGoal[];
  onOpenNewGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: number) => void;
  onOpenGoalFunds: (goal: SavingsGoal) => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  user,
  goals,
  onOpenNewGoal,
  onEditGoal,
  onDeleteGoal,
  onOpenGoalFunds,
}) => {
  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.saved_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.target_amount, 0), [goals]);
  const completedCount = useMemo(() => goals.filter(g => g.is_completed || g.saved_amount >= g.target_amount).length, [goals]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Savings Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Define personal targets, fund emergency reserves, and track milestones
          </p>
        </div>
        <button
          id="create-goal-btn"
          onClick={onOpenNewGoal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Accumulated
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatCurrency(totalSaved, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accumulated across {goals.length} active goals
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Combined Target
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalTarget, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% achieved so far
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Milestones Completed
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight flex items-center gap-2">
            <span>{completedCount} of {goals.length}</span>
            {completedCount > 0 && <Trophy className="w-5 h-5 text-amber-500" />}
          </div>
          <p className="text-xs text-slate-500 mt-1">Fully funded targets</p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const isDone = goal.is_completed || goal.saved_amount >= goal.target_amount;
          const percent = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
          const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

          return (
            <div
              key={goal.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {goal.name}
                      </h3>
                      {goal.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{goal.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Edit Goal"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="my-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <div>
                      <span className="font-black text-xl text-slate-900">
                        {formatCurrency(goal.saved_amount, user.currency)}
                      </span>
                      <span className="text-slate-500 font-medium"> saved</span>
                    </div>
                    <div className="font-bold text-sm text-amber-600">
                      {percent}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>Goal: {formatCurrency(goal.target_amount, user.currency)}</span>
                    <span>
                      {isDone ? (
                        <strong className="text-emerald-600">Target reached! 🎉</strong>
                      ) : (
                        `${formatCurrency(remaining, user.currency)} to go`
                      )}
                    </span>
                  </div>
                </div>

                {/* Target Date */}
                {goal.target_date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Date: <strong>{formatDate(goal.target_date)}</strong></span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenGoalFunds(goal)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  <span>Deposit / Adjust Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
