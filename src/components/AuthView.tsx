import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  Shield,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { CurrencyCode, User } from '../types';
import { CURRENCY_CONFIGS } from '../utils/formatters';
import { 
  evaluatePasswordStrength, 
  sanitizeInput, 
  validateEmail, 
  verifyPassword, 
  hashPassword,
  generateSecureId 
} from '../utils/security';
import { api } from '../services/api';

interface AuthViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  onUpdateUserPassword?: (email: string, newPasswordHash: string) => boolean;
  defaultEmail?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  users,
  onLogin,
  onRegister,
  onUpdateUserPassword,
  defaultEmail = '',
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(defaultEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Rate-limiting / Brute-force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCurrency, setRegCurrency] = useState<CurrencyCode>('USD');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Error & Feedback state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength for registration
  const passwordStrength = evaluatePasswordStrength(regPassword);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const trimmed = sanitizeInput(loginIdentifier).trim();
    const cleanPassword = loginPassword;

    if (!trimmed) {
      setErrorMsg('Please enter your email or username.');
      setIsSubmitting(false);
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Please enter your password.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Direct authoritative authentication with TiDB Cloud MySQL database
      const result = await api.login(trimmed, cleanPassword);
      if (result && result.success && result.user) {
        setFailedAttempts(0);
        setSuccessMsg(`Welcome back, ${result.user.first_name || result.user.username}! Redirecting to workspace...`);
        setTimeout(() => {
          onLogin(result.user);
        }, 300);
        return;
      }
      throw new Error(result.message || 'Login failed');
    } catch (apiErr: any) {
      // 2. Check local fallback users if available
      const foundUser = users.find(
        (u) =>
          u.email.toLowerCase() === trimmed.toLowerCase() ||
          u.username.toLowerCase() === trimmed.toLowerCase()
      );

      if (foundUser && foundUser.password) {
        const isValid = await verifyPassword(cleanPassword, foundUser.password);
        if (isValid) {
          setFailedAttempts(0);
          setSuccessMsg(`Welcome back, ${foundUser.first_name}! Redirecting...`);
          setTimeout(() => {
            onLogin(foundUser);
          }, 300);
          return;
        }
      }

      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLockoutSeconds(30);
        setErrorMsg('Too many failed attempts. Security cooldown active for 30 seconds.');
      } else {
        const message = apiErr.message || 'Invalid email or password. Please check your credentials or reset password.';
        setErrorMsg(`${message} (Attempt ${attempts} of 5)`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanFirstName = sanitizeInput(regFirstName).trim();
    const cleanLastName = sanitizeInput(regLastName).trim();
    const cleanUsername = sanitizeInput(regUsername).toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = sanitizeInput(regEmail).toLowerCase().trim();

    if (!cleanFirstName || !cleanLastName) {
      setErrorMsg('Please enter both your first and last name.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 alphanumeric characters.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please provide a valid email address (e.g. name@domain.com).');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and re-type.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Direct registration into TiDB Cloud MySQL database
      const res = await api.register({
        first_name: cleanFirstName,
        last_name: cleanLastName,
        username: cleanUsername,
        email: cleanEmail,
        currency: regCurrency,
        password: regPassword,
      });

      if (res && res.success && res.user) {
        setSuccessMsg('Account created successfully in TiDB Cloud! Logging in...');
        setTimeout(() => {
          onRegister(res.user);
        }, 400);
        return;
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanEmail = sanitizeInput(resetEmail).toLowerCase().trim();
    if (!cleanEmail) {
      setResetError('Please enter your registered email address.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      const res = await api.resetPassword(cleanEmail, resetNewPassword);
      if (onUpdateUserPassword) {
        onUpdateUserPassword(cleanEmail, resetNewPassword);
      }
      setResetSuccess(res.message || 'Password updated in TiDB Cloud database! You can now log in.');
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(null);
        setResetEmail('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setActiveMode('login');
        setLoginIdentifier(cleanEmail);
        setLoginPassword(resetNewPassword);
      }, 1400);
    } catch (err: any) {
      setResetError(err.message || 'No account found with this email or username.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-bold mb-3 shadow-lg">
            <Coins className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Expense & Budget Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Personal Finance & Budgeting Management
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-mono border border-amber-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Authentication Module</span>
          </div>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5">
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setActiveMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'login'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-amber-600" />
            <span>Sign In</span>
          </button>

          <button
            id="tab-register"
            type="button"
            onClick={() => {
              setActiveMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'register'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* Lockout Warning */}
          {lockoutSeconds > 0 && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Brute-force security delay: Retry in {lockoutSeconds}s</span>
            </div>
          )}

          {/* Sign In Form */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                      setIsResetModalOpen(true);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    Reset Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Keep session signed in</span>
                </label>
                <span className="text-slate-400 font-mono text-[11px]">Flask Session</span>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isSubmitting || lockoutSeconds > 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Form */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    id="reg-firstname"
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Ramya"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    id="reg-lastname"
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Selva"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ramyaselva"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramyaselva048@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Primary Currency
                </label>
                <select
                  id="reg-currency"
                  value={regCurrency}
                  onChange={(e) => setRegCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900 font-semibold cursor-pointer"
                >
                  {Object.values(CURRENCY_CONFIGS).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {regPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Security strength:</span>
                      <span className="font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300 rounded-full" 
                        style={{ 
                          width: `${Math.max(15, (passwordStrength.score / 4) * 100)}%`,
                          backgroundColor: passwordStrength.color 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer mt-3"
              >
                <span>{isSubmitting ? 'Registering Account...' : 'Complete Secure Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHA-256 Encrypted Passwords</span>
          </span>
          <span>MySQL Users Database</span>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Account Password</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="ramyaselva048@gmail.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="New strong password"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
