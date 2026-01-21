import SignInButton from '@/components/SignInButton';

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Welcome to Planes BA</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with Google to connect your calendars and start turning Instagram plans into
          events.
        </p>
        <div className="mt-6">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
