/**
 * Login Page
 * 
 * Themed Google sign-in screen matching the FIRE app brand system.
 * Fixed light theme with branded colors.
 */

import { useAuth } from './AuthProvider';
import { useState } from 'react';
import { logger } from '@/lib/logger';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      logger.error('Sign-in failed', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#E4572E] to-[#CC4E29] mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0F1115] mb-2">
            FIRE Finance
          </h1>
          <p className="text-[#4B5563] text-base">
            Track your path to financial independence
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="bg-white rounded-[14px] shadow-sm p-8 border border-gray-100">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#0F1115] mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-[#4B5563]">
                Sign in with your Google account to continue
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#E4572E] hover:bg-[#CC4E29] text-white font-medium rounded-[14px] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-[#4B5563]">
              <p>
                By signing in, you agree to our{' '}
                <a href="#" className="text-[#E4572E] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#E4572E] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[#2E86AB] font-semibold text-sm mb-1">
              🔒 Secure
            </div>
            <div className="text-xs text-[#4B5563]">End-to-end encryption</div>
          </div>
          <div>
            <div className="text-[#2E86AB] font-semibold text-sm mb-1">
              📊 Insights
            </div>
            <div className="text-xs text-[#4B5563]">FIRE projections</div>
          </div>
          <div>
            <div className="text-[#2E86AB] font-semibold text-sm mb-1">
              🎯 Simple
            </div>
            <div className="text-xs text-[#4B5563]">Manual tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
