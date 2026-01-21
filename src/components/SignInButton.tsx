'use client';

import { signIn } from 'next-auth/react';

export default function SignInButton() {
  return (
    <button
      className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
      onClick={() => signIn('google', { callbackUrl: '/' })}
    >
      Sign in with Google
    </button>
  );
}
