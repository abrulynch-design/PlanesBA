import { redirect, notFound } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, TAGS, TIMEZONE } from '@/lib/constants';
import { getCalendarClient, buildEventDescription, normalizeEventTimes } from '@/lib/google';
import { z } from 'zod';

const planSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isFree: z.string().optional(),
  price: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  targetCalendarId: z.string().min(1),
  sourceUrl: z.string().optional()
});

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function listCalendars(accessToken: string) {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();
  return response.data.items ?? [];
}

async function updatePlan(formData: FormData) {
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

  const id = String(formData.get('id'));
  const intent = String(formData.get('intent'));

  const raw = {
    title: String(formData.get('title') ?? ''),
    date: String(formData.get('date') ?? ''),
    time: String(formData.get('time') ?? ''),
    endTime: String(formData.get('endTime') ?? ''),
    location: String(formData.get('location') ?? ''),
    isFree: String(formData.get('isFree') ?? ''),
    price: String(formData.get('price') ?? ''),
    category: String(formData.get('category') ?? ''),
    tags: formData.getAll('tags').map(String),
    notes: String(formData.get('notes') ?? ''),
    targetCalendarId: String(formData.get('targetCalendarId') ?? ''),
    sourceUrl: String(formData.get('sourceUrl') ?? '')
  };

  const parsed = planSchema.safeParse({
    ...raw,
    tags: raw.tags.length ? raw.tags : undefined
  });

  if (!parsed.success) {
    throw new Error('Invalid input');
  }

  const startDt = combineDateTime(parsed.data.date, parsed.data.time);
  const endDt = parsed.data.endTime ? combineDateTime(parsed.data.date, parsed.data.endTime) : null;

  const plan = await prisma.plan.update({
    where: { id, userId: user.id },
    data: {
      title: parsed.data.title,
      startDt,
      endDt,
      location: parsed.data.location || null,
      isFree: parsed.data.isFree === 'true',
      price: parsed.data.price || null,
      category: parsed.data.category || null,
      tags: parsed.data.tags ?? [],
      notes: parsed.data.notes || null,
      targetCalendarId: parsed.data.targetCalendarId,
      status: intent === 'create' ? 'CREATED' : 'DRAFT'
    }
  });

  if (intent === 'create') {
    if (!session.accessToken) {
      throw new Error('Missing Google access token');
    }
    const calendar = getCalendarClient(session.accessToken);
    const eventTimes = normalizeEventTimes({
      start: startDt,
      end: endDt
    });
    const event = await calendar.events.insert({
      calendarId: parsed.data.targetCalendarId,
      requestBody: {
        summary: parsed.data.title,
        start: eventTimes.start,
        end: eventTimes.end,
        location: parsed.data.location || undefined,
        description: buildEventDescription({
          sourceUrl: parsed.data.sourceUrl,
          isFree: parsed.data.isFree === 'true',
          price: parsed.data.price,
          notes: parsed.data.notes
        })
      }
    });

    await prisma.plan.update({
      where: { id: plan.id },
      data: {
        googleEventId: event.data.id ?? null,
        status: 'CREATED'
      }
    });
  }

  redirect('/');
}

export default async function ConfirmPage({ params }: { params: { id: string } }) {
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

  const plan = await prisma.plan.findUnique({
    where: { id: params.id, userId: user.id }
  });
  if (!plan) {
    notFound();
  }

  const calendars = session.accessToken ? await listCalendars(session.accessToken) : [];
  const defaultCalendarId = plan.targetCalendarId || user.defaultCalendarId || calendars[0]?.id || '';

  const startDt = plan.startDt ?? new Date();
  const endDt = plan.endDt ?? new Date(startDt.getTime() + 2 * 60 * 60 * 1000);

  const dateValue = startDt.toISOString().slice(0, 10);
  const timeValue = startDt.toISOString().slice(11, 16);
  const endTimeValue = endDt.toISOString().slice(11, 16);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-ink">Confirm plan details</h2>
          <p className="text-sm text-slate-600">Review and edit before creating the calendar event.</p>
        </div>
        <form action={updatePlan} className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={plan.id} />
          <input type="hidden" name="sourceUrl" value={plan.sourceUrl ?? ''} />
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Title *
            <input
              name="title"
              required
              defaultValue={plan.title ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Date *
            <input
              name="date"
              type="date"
              required
              defaultValue={dateValue}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Start time * ({TIMEZONE})
            <input
              name="time"
              type="time"
              required
              defaultValue={timeValue}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            End time
            <input
              name="endTime"
              type="time"
              defaultValue={endTimeValue}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Location
            <input
              name="location"
              defaultValue={plan.location ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Free?
            <select
              name="isFree"
              defaultValue={plan.isFree ? 'true' : 'false'}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="true">Free</option>
              <option value="false">Paid</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Price
            <input
              name="price"
              defaultValue={plan.price ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              name="category"
              defaultValue={plan.category ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-sm font-medium text-slate-700 md:col-span-2">
            <legend className="mb-2">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    defaultChecked={Array.isArray(plan.tags) ? plan.tags.includes(tag) : false}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Notes
            <textarea
              name="notes"
              rows={3}
              defaultValue={plan.notes ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Target calendar
            <select
              name="targetCalendarId"
              defaultValue={defaultCalendarId}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id ?? ''}>
                  {calendar.summary}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Source link
            <input
              name="sourceLink"
              value={plan.sourceUrl ?? ''}
              readOnly
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2 flex flex-col gap-3 md:flex-row">
            <button
              name="intent"
              value="create"
              type="submit"
              className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
            >
              Add to Calendar
            </button>
            <button
              name="intent"
              value="draft"
              type="submit"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Save Draft
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
