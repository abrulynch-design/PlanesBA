import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCalendarClient } from '@/lib/google';

async function updateDefaultCalendar(formData: FormData) {
  'use server';
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
  const defaultCalendarId = String(formData.get('defaultCalendarId') ?? '');
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultCalendarId }
  });
  redirect('/settings');
}

async function listCalendars(accessToken: string) {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();
  return response.data.items ?? [];
}

export default async function SettingsPage() {
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

  const calendars = session.accessToken ? await listCalendars(session.accessToken) : [];

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Settings</h2>
        <p className="text-sm text-slate-600">
          Choose your default calendar for new events and drafts.
        </p>
        <form action={updateDefaultCalendar} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-700">
            Default calendar
            <select
              name="defaultCalendarId"
              defaultValue={user.defaultCalendarId ?? calendars[0]?.id ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id ?? ''}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
            Save default calendar
          </button>
        </form>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          This list includes shared calendars you have permission to create events on.
        </div>
      </section>
    </div>
  );
}
