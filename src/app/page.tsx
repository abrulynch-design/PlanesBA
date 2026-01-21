import { redirect } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, STATUS_OPTIONS } from '@/lib/constants';

const formatDate = (date?: Date | null) =>
  date ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '—';

export default async function InboxPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect('/login');
  }

  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  const status = typeof searchParams.status === 'string' ? searchParams.status : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const free = typeof searchParams.free === 'string' ? searchParams.free : '';
  const start = typeof searchParams.start === 'string' ? searchParams.start : '';
  const end = typeof searchParams.end === 'string' ? searchParams.end : '';

  const plans = await prisma.plan.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { location: { contains: query, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(free ? { isFree: free === 'true' } : {}),
      ...(start || end
        ? {
            startDt: {
              ...(start ? { gte: new Date(start) } : {}),
              ...(end ? { lte: new Date(end) } : {})
            }
          }
        : {})
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Inbox</h2>
            <p className="text-sm text-slate-600">Review, edit, and send plans to your calendar.</p>
          </div>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            href="/new"
          >
            Add plan
          </Link>
        </div>
        <form className="mt-6 grid gap-3 md:grid-cols-5">
          <input
            name="q"
            placeholder="Search title or location"
            defaultValue={query}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select name="status" defaultValue={status} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={category} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="free" defaultValue={free} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Free or Paid</option>
            <option value="true">Free</option>
            <option value="false">Paid</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              name="start"
              defaultValue={start}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              name="end"
              defaultValue={end}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white md:col-span-5"
          >
            Apply filters
          </button>
        </form>
        <div className="mt-6 grid gap-4">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600">
              No plans yet. Add your first Instagram plan!
            </div>
          ) : (
            plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/confirm/${plan.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{plan.title ?? 'Untitled plan'}</h3>
                    <p className="text-sm text-slate-600">{plan.location || 'No location yet'}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{formatDate(plan.startDt)}</p>
                    <p className="font-semibold text-ink">{plan.status}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
