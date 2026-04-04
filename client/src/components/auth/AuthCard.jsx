import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AtSign, Phone, Building2, Hash, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getFieldError } from '../../utils/validation';
import RoleSelector from './RoleSelector';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const ROLE_COPY = {
  cashier: { access: 'Access table orders, register actions, and billing flow.' },
  kitchen: { access: 'View incoming tickets and update preparation stages.' },
  customer: { access: 'Track placed orders and self-order with ease.' },
  manager: { access: 'Configure operations, monitor performance, and manage staff.' },
};

// ✅ EXTRACTED OUTSIDE to prevent remount on every keystroke
function InputField({ icon: Icon, label, field, type = 'text', placeholder, disabled, autoComplete, value, onChange, onBlur, hasError, isValid, errorMsg, showPw, onTogglePw, loading: isLoading }) {
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={field} className="auth-label">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 transition-colors duration-200 ${
            hasError ? 'text-red-400' : isValid ? 'text-emerald-500' : 'text-stone-400'
          }`} />
        </div>
        <input
          id={field}
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur(field)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          autoComplete={autoComplete}
          className={`auth-input pl-10 ${isPassword ? 'pr-10' : 'pr-4'} ${
            hasError ? 'auth-input-error' : isValid ? 'auth-input-success' : ''
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePw}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {isValid && !isPassword && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-red-500 text-[11px] mt-1.5 animate-slide-down flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}

export default function AuthCard({ mode, onModeChange, onRoleChange }) {
  const navigate = useNavigate();
  const { login, signup, getRoleRedirectPath } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    businessName: '',
    employeeId: '',
    login: '',  // for login mode (email or username)
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Notify parent of role changes
  useEffect(() => {
    onRoleChange?.(formData.role);
  }, [formData.role, onRoleChange]);

  // Reset form on mode change
  useEffect(() => {
    setErrors({});
    setTouched({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
  }, [mode]);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Live validation on touched fields
    if (touched[field]) {
      const error = getFieldError(field, value, { password: field === 'confirmPassword' ? formData.password : '' });
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }, [touched, formData.password]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = getFieldError(field, value, { password: field === 'confirmPassword' ? formData.password : '' });
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, [formData]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!formData.login) newErrors.login = 'Email or username is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ login: true, password: true });
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        login: formData.login,
        password: formData.password,
      });
      toast.success(`Welcome back, ${result.user.fullName}!`, { icon: '☕' });
      const redirectPath = getRoleRedirectPath(result.user.role);
      setTimeout(() => navigate(redirectPath, { replace: true }), 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fieldsToCheck = ['fullName', 'username', 'email', 'password', 'confirmPassword', 'role'];
    const newErrors = {};
    const newTouched = {};

    fieldsToCheck.forEach((field) => {
      newTouched[field] = true;
      const error = getFieldError(field, formData[field], { password: formData.password });
      if (error) newErrors[field] = error;
    });

    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms';
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        phone: formData.phone,
        businessName: formData.businessName,
        employeeId: formData.employeeId,
      });
      toast.success(`Welcome to Odoo POS Cafe, ${result.user.fullName}!`, { icon: '🎉' });
      const redirectPath = getRoleRedirectPath(result.user.role);
      setTimeout(() => navigate(redirectPath, { replace: true }), 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  // Helper to build props for the extracted InputField
  const inputProps = (field) => ({
    value: formData[field],
    onChange: handleChange,
    onBlur: handleBlur,
    hasError: !!(touched[field] && errors[field]),
    isValid: !!(touched[field] && !errors[field] && formData[field]),
    errorMsg: errors[field] || '',
    showPw: field === 'password' ? showPassword : showConfirmPassword,
    onTogglePw: field === 'password' ? () => setShowPassword(!showPassword) : () => setShowConfirmPassword(!showConfirmPassword),
    loading,
  });

  const isLogin = mode === 'login';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mode Toggle */}
      <div className="relative flex bg-stone-100 rounded-2xl p-1 mb-8">
        <div
          className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-gradient-to-r from-cafe-500 to-cafe-600 rounded-xl shadow-md transition-transform duration-400 ease-out"
          style={{ transform: isLogin ? 'translateX(0%)' : 'translateX(100%)' }}
        />
        <button
          type="button"
          onClick={() => onModeChange('login')}
          className={`mode-toggle-btn flex-1 ${isLogin ? 'mode-toggle-active' : 'mode-toggle-inactive'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => onModeChange('signup')}
          className={`mode-toggle-btn flex-1 ${!isLogin ? 'mode-toggle-active' : 'mode-toggle-inactive'}`}
        >
          Create Account
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-display font-bold text-stone-900">
          {isLogin ? 'Welcome back' : 'Create your workspace'}
        </h2>
        <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
          {isLogin
            ? 'Sign in to continue your cafe workflow.'
            : 'Set up your role to enter Odoo POS Cafe.'}
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 animate-slide-down">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={isLogin ? handleLogin : handleSignup} noValidate>
        <div className="space-y-4">
          {isLogin ? (
            /* LOGIN FIELDS */
            <>
              <InputField
                icon={Mail}
                label="Email or Username"
                field="login"
                placeholder="Enter your email or username"
                autoComplete="username"
                {...inputProps('login')}
              />
              <div>
                <InputField
                  icon={Lock}
                  label="Password"
                  field="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...inputProps('password')}
                />
              </div>

              {/* Remember Me & Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-4 h-4 border-2 border-stone-300 rounded-md peer-checked:bg-cafe-500 peer-checked:border-cafe-500 transition-all duration-200 group-hover:border-stone-400 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 group-hover:text-stone-700 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-xs text-cafe-600 hover:text-cafe-700 font-medium transition-colors hover:underline underline-offset-2">
                  Forgot password?
                </button>
              </div>
            </>
          ) : (
            /* SIGNUP FIELDS */
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  icon={User}
                  label="Full Name"
                  field="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                  {...inputProps('fullName')}
                />
                <InputField
                  icon={AtSign}
                  label="Username"
                  field="username"
                  placeholder="johndoe"
                  autoComplete="username"
                  {...inputProps('username')}
                />
              </div>

              <InputField
                icon={Mail}
                label="Email Address"
                field="email"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                {...inputProps('email')}
              />

              <InputField
                icon={Lock}
                label="Password"
                field="password"
                type="password"
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                {...inputProps('password')}
              />
              {formData.password && <PasswordStrengthMeter password={formData.password} />}

              <InputField
                icon={Lock}
                label="Confirm Password"
                field="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...inputProps('confirmPassword')}
              />

              {/* Role Selector */}
              <div className="pt-2">
                <RoleSelector
                  value={formData.role}
                  onChange={(role) => handleChange('role', role)}
                  error={touched.role ? errors.role : ''}
                />
              </div>

              {/* Role Access Preview */}
              {formData.role && ROLE_COPY[formData.role] && (
                <div className="p-3 rounded-xl bg-cafe-50 border border-cafe-200 animate-scale-in">
                  <p className="text-cafe-700 text-xs font-medium">
                    <span className="font-bold">You'll get access to:</span>{' '}
                    {ROLE_COPY[formData.role].access}
                  </p>
                </div>
              )}

              {/* Conditional Fields */}
              {formData.role === 'manager' && (
                <div className="animate-slide-down">
                  <InputField
                    icon={Building2}
                    label="Cafe / Business Name"
                    field="businessName"
                    placeholder="My Awesome Cafe"
                    {...inputProps('businessName')}
                  />
                </div>
              )}

              {['cashier', 'kitchen'].includes(formData.role) && (
                <div className="animate-slide-down">
                  <InputField
                    icon={Hash}
                    label="Employee ID"
                    field="employeeId"
                    placeholder="EMP-001"
                    {...inputProps('employeeId')}
                  />
                </div>
              )}

              {formData.role === 'customer' && (
                <div className="animate-slide-down">
                  <InputField
                    icon={Phone}
                    label="Phone Number (Optional)"
                    field="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    {...inputProps('phone')}
                  />
                </div>
              )}

              {/* Terms */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) setErrors((prev) => ({ ...prev, terms: '' }));
                      }}
                      className="sr-only peer"
                    />
                    <div className={`w-4 h-4 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                      termsAccepted
                        ? 'bg-cafe-500 border-cafe-500'
                        : errors.terms ? 'border-red-400' : 'border-stone-300 group-hover:border-stone-400'
                    }`}>
                      {termsAccepted && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 leading-relaxed">
                    I agree to the{' '}
                    <button type="button" className="text-cafe-600 hover:text-cafe-700 font-medium underline underline-offset-2">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-cafe-600 hover:text-cafe-700 font-medium underline underline-offset-2">
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-[11px] mt-1 ml-6 animate-slide-down">
                    {errors.terms}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary mt-6 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : (
            <>
              <span>{isLogin ? 'Sign in securely' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-sm text-stone-500 mt-6">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => onModeChange(isLogin ? 'signup' : 'login')}
          className="text-cafe-600 hover:text-cafe-700 font-semibold transition-colors hover:underline underline-offset-2"
        >
          {isLogin ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
