import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePlanText } from '@/lib/parsePlan';

async function createPlan(formData: FormData) {
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

  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim();
  const manualText = String(formData.get('manualText') ?? '').trim();
  const file = formData.get('flyer') as File | null;

  const ocrText = file && file.size > 0 ? 'OCR pending - replace with real OCR implementation.' : null;
  const combinedText = [manualText, ocrText].filter(Boolean).join('\n');
  const parsed = combinedText ? parsePlanText(combinedText) : null;

  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      sourceUrl: sourceUrl || null,
      rawText: manualText || null,
      ocrText,
      title: parsed?.title ?? (sourceUrl ? 'Instagram plan' : 'New plan'),
      startDt: parsed?.startDt ?? null,
      isFree: parsed?.isFree ?? null,
      price: parsed?.price ?? null,
      status: 'DRAFT'
    }
  });

  redirect(`/confirm/${plan.id}`);
}

export default async function NewPlanPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Add a new plan</h2>
        <p className="text-sm text-slate-600">Paste an Instagram link, add text, or upload a flyer.</p>
        <form action={createPlan} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-700">
            Instagram link
            <input
              name="sourceUrl"
              type="url"
              placeholder="https://www.instagram.com/..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Paste text
            <textarea
              name="manualText"
              rows={5}
              placeholder="Describe the plan, date, time, and location"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Upload screenshot or flyer
            <input
              name="flyer"
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            OCR is a stub in this MVP. Uploaded images will be stored as placeholders until OCR is
            wired.
          </div>
          <button type="submit" className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
            Extract plan details
          </button>
        </form>
      </section>
    </div>
  );
}
