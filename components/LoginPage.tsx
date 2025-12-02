'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { clientSignup, adminLogin, SignupRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [typedText, setTypedText] = useState('');

  const fullText = 'Welcome to Trademark Comparison';
  const finalText = 'Trademark Comparison';

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];

    // Typing phase
    const typeText = (index: number) => {
      if (index < fullText.length) {
        setTypedText(fullText.substring(0, index + 1));
        const timeoutId = setTimeout(() => typeText(index + 1), 100);
        timeoutIds.push(timeoutId);
      } else {
        // After full text is typed, wait 2 seconds then start removing
        const waitTimeout = setTimeout(() => {
          let removeIndex = fullText.length;
          const removeText = () => {
            if (removeIndex > finalText.length) {
              setTypedText(fullText.substring(0, removeIndex - 1));
              removeIndex--;
              const timeoutId = setTimeout(removeText, 50);
              timeoutIds.push(timeoutId);
            } else {
              setTypedText(finalText);
            }
          };
          removeText();
        }, 2000);
        timeoutIds.push(waitTimeout);
      }
    };

    typeText(0);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []); // Run once on mount

  const [signupData, setSignupData] = useState<SignupRequest>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [adminLoginData, setAdminLoginData] = useState({
    email: '',
    password: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (signupData.password !== signupData.password_confirmation) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const response = await clientSignup(signupData);
      setMessage({ type: 'success', text: response.message || 'Signup successful! Please login.' });
      setIsSignup(false);
      setSignupData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await adminLogin(adminLoginData);
      await refresh();
      router.push('/app');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Typing Animation Header - Top of Page (Fixed Position) */}
      <div className={`fixed ${!isSignup ? 'top-20' : 'top-5'} left-0 right-0 flex justify-center z-20`}>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center px-4">
          {typedText}
          {typedText && typedText !== finalText && (
            <span className="animate-pulse inline-block ml-1">|</span>
          )}
        </h2>
      </div>

      {/* Sign In Page - Decorative Background Images */}
      {!isSignup && (
        <>
          {/* Top Left - Large green/yellow decorative shape */}
          <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 opacity-30 z-0">
            <Image
              src="/click_7756322.png"
              alt=""
              width={500}
              height={500}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Top Right - Decorative shape */}
          <div className="absolute top-10 right-10 translate-x-1/4 -translate-y-1/4 opacity-25 z-0">
            <Image
              src="/random_7756321.png"
              alt=""
              width={320}
              height={320}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Bottom Left - Decorative shape */}
          <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-30 z-0">
            <Image
              src="/sync_7756318.png"
              alt=""
              width={350}
              height={350}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Bottom Right - Pink/Red decorative shape */}
          <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-35 z-0">
            <Image
              src="/ejecting_7756324.png"
              alt=""
              width={450}
              height={450}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Center Left - Decorative element */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 -translate-x-1/4 opacity-20 z-0">
            <Image
              src="/up-down_7756199.png"
              alt=""
              width={200}
              height={200}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Center Right - Decorative element */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-20 z-0">
            <Image
              src="/back_7756323.png"
              alt=""
              width={220}
              height={220}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Additional decorative elements for depth */}
          <div className="absolute top-1/3 left-1/4 opacity-15 z-0">
            <Image
              src="/eject_7756326.png"
              alt=""
              width={180}
              height={180}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          <div className="absolute bottom-1/3 right-1/4 opacity-15 z-0">
            <Image
              src="/maximize_7756320.png"
              alt=""
              width={160}
              height={160}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>
        </>
      )}

      {/* Sign Up Page - Different Decorative Background Images */}
      {isSignup && (
        <>
          {/* Top Left - Different image and position for signup */}
          <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 opacity-30 z-0">
            <Image
              src="/sync_7756318.png"
              alt=""
              width={450}
              height={450}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Top Right - Different image for signup */}
          <div className="absolute top-10 right-10 translate-x-1/3 -translate-y-1/3 opacity-25 z-0">
            <Image
              src="/up-down_7756199.png"
              alt=""
              width={380}
              height={380}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Bottom Left - Different image for signup */}
          <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 opacity-35 z-0">
            <Image
              src="/click_7756322.png"
              alt=""
              width={400}
              height={400}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Bottom Right - Different image for signup */}
          <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 opacity-30 z-0">
            <Image
              src="/random_7756321.png"
              alt=""
              width={420}
              height={420}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Center Left - Different image for signup */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 -translate-x-1/3 opacity-20 z-0">
            <Image
              src="/eject_7756326.png"
              alt=""
              width={250}
              height={250}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Center Right - Different image for signup */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-20 z-0">
            <Image
              src="/maximize_7756320.png"
              alt=""
              width={280}
              height={280}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          {/* Additional decorative elements for signup */}
          <div className="absolute top-1/4 right-1/3 opacity-15 z-0">
            <Image
              src="/back_7756323.png"
              alt=""
              width={180}
              height={180}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          <div className="absolute bottom-1/4 left-1/3 opacity-15 z-0">
            <Image
              src="/ejecting_7756324.png"
              alt=""
              width={200}
              height={200}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 opacity-12 z-0">
            <Image
              src="/minimize_7756301.png"
              alt=""
              width={150}
              height={150}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>

          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-12 z-0">
            <Image
              src="/minimize_7756319.png"
              alt=""
              width={170}
              height={170}
              className="object-contain mix-blend-multiply"
              priority
              unoptimized
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isSignup ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            {isSignup
              ? 'to continue to Trademark Search System'
              : 'to continue to your Trademark Search account'}
          </p>
        </div>

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Admin Login Form */}
        {!isSignup && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={adminLoginData.email}
                onChange={(e) =>
                  setAdminLoginData({ ...adminLoginData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                placeholder="Email address or Username"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={adminLoginData.password}
                onChange={(e) =>
                  setAdminLoginData({ ...adminLoginData, password: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                placeholder="Password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !adminLoginData.email || !adminLoginData.password}
                className="w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {isSignup && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  required
                  value={signupData.first_name}
                  onChange={(e) => setSignupData({ ...signupData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                  placeholder="First name"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  value={signupData.last_name}
                  onChange={(e) => setSignupData({ ...signupData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <input
                type="email"
                required
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                placeholder="Email address"
              />
            </div>

            <div>
              <input
                type="password"
                required
                minLength={6}
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                placeholder="Password"
              />
            </div>

            <div>
              <input
                type="password"
                required
                minLength={6}
                value={signupData.password_confirmation}
                onChange={(e) =>
                  setSignupData({ ...signupData, password_confirmation: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                placeholder="Confirm password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  !signupData.first_name ||
                  !signupData.last_name ||
                  !signupData.email ||
                  !signupData.password ||
                  !signupData.password_confirmation
                }
                className="w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Sign up / Sign in toggle link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignup(false);
                    setMessage(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignup(true);
                    setMessage(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p className="mb-3">© 2024 Trademark Search System. All rights reserved.</p>
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="hover:text-gray-700 transition-colors">Security</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Legal</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
