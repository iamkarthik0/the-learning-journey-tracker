import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Users,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  CalendarCheck,
  Shield,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  BookMarked,
  UserCheck,
  Bell,
} from 'lucide-react';

/* ── Data ── */
const problems = [
  {
    icon: AlertTriangle,
    title: 'No Chapter-wise Tracking',
    desc: 'Teachers have no way to know which students missed specific lessons. A student absent during the Sine Rule class has no record of it.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance is Just a Number',
    desc: 'Traditional attendance systems mark present or absent — but never tell you what a student missed while they were away.',
  },
  {
    icon: BookMarked,
    title: 'Progress is Invisible',
    desc: 'Principals and teachers cannot see which chapters are completed, how many questions are taught, or which sections are falling behind.',
  },
  {
    icon: Bell,
    title: 'No Catch-up System',
    desc: 'When a student returns after absence, there is no structured way to track whether they caught up on missed content.',
  },
];

const features = [
  {
    icon: BookOpen,
    title: 'Chapter & Question Tracking',
    desc: 'Create chapters with individual questions. Mark each question as taught with an automatic date stamp. Track progress question by question.',
    badge: 'Core',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Attendance',
    desc: 'Mark daily attendance per student. When a question is taught, instantly see which students were present and who was absent that exact day.',
    badge: 'Core',
  },
  {
    icon: UserCheck,
    title: 'Catch-up Management',
    desc: 'Mark absent students as "Caught Up" after they review missed content. Track mastery separately for present students who demonstrate understanding.',
    badge: 'Smart',
  },
  {
    icon: BarChart3,
    title: 'Principal Dashboard',
    desc: 'School-wide analytics — total students, chapter completion %, 7-day attendance trend, grade-wise distribution, and section-level insights.',
    badge: 'Analytics',
  },
  {
    icon: TrendingUp,
    title: 'Student History',
    desc: 'View any student\'s complete attendance history, which questions they missed, and their catch-up status — filtered by date range.',
    badge: 'History',
  },
  {
    icon: CalendarCheck,
    title: 'Daily Log',
    desc: 'Teachers get a focused daily view — see exactly what to teach today, mark questions as done, and auto-complete chapters on finish.',
    badge: 'Daily',
  },
];

const roles = [
  {
    icon: Shield,
    role: 'Principal',
    color: 'bg-primary text-primary-foreground',
    can: [
      'View school-wide analytics dashboard',
      'Add teachers and manage period sessions',
      'Track chapter completion across all subjects',
      'Monitor section-wise attendance rates',
    ],
  },
  {
    icon: GraduationCap,
    role: 'Teacher',
    color: 'bg-emerald-600 text-white',
    can: [
      'Create subjects and chapters with questions',
      'Mark daily student attendance',
      'Log taught questions in the Daily Log',
      'Mark students as caught up on missed content',
    ],
  },
  {
    icon: Users,
    role: 'Analyst',
    color: 'bg-chart-1 text-white',
    can: [
      'View question-level attendance per chapter',
      'Track student learning history over time',
      'Identify students at risk of falling behind',
      'Analyse chapter completion rates by subject',
    ],
  },
];

/* ── Page ── */
export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-background">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            For Schools · Teachers · Principals
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The Learning Journey
            <span className="block text-primary mt-1">Tracker</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Know exactly what every student learned — and what they missed.
            Track attendance at the <strong>question level</strong>, not just the class level.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 h-12 px-8">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="/dashboard/teacher">
                Teacher Dashboard
              </Link>
            </Button>
          </div>

          {/* Quick stats row */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6 text-center">
            {[
              { n: '100%', label: 'Question-level tracking' },
              { n: '3',    label: 'Role-based dashboards' },
              { n: '∞',   label: 'Catch-up history' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-primary">{s.n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">The Problem</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Traditional systems miss what matters most
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-xl mx-auto">
              Schools track attendance. But no one tracks what a student missed — and whether they ever caught up.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p) => (
              <Card key={p.title} className="border-destructive/20 bg-destructive/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <p.icon className="h-4 w-4 text-destructive" />
                    </div>
                    <CardTitle className="text-sm leading-snug">{p.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION / FEATURES ──────────────────────────────────── */}
      <section className="border-b py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">What We Solve</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Every feature is built around learning continuity
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-xl mx-auto">
              From the moment a teacher marks a question as taught, the system knows which students were there —
              and tracks whether absent students ever caught up.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{f.badge}</Badge>
                  </div>
                  <CardTitle className="mt-3 text-sm">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Simple 4-step workflow
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 h-full w-px bg-border sm:left-1/2" />

            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Set up subjects & chapters',
                  desc: 'Principal or teacher creates subjects for each grade. Teachers add chapters with all questions/topics to be covered.',
                  icon: BookOpen,
                },
                {
                  step: '02',
                  title: 'Mark attendance daily',
                  desc: 'Teachers take attendance every class. The system records who was present or absent on each specific day.',
                  icon: ClipboardCheck,
                },
                {
                  step: '03',
                  title: 'Log taught questions',
                  desc: 'In the Daily Log, teachers check off each question as it is taught. The system stamps the date automatically.',
                  icon: CheckCircle2,
                },
                {
                  step: '04',
                  title: 'Track & catch up',
                  desc: 'Analytics instantly show who was absent when each question was taught. Teachers mark catch-ups as they happen.',
                  icon: TrendingUp,
                },
              ].map((item, i) => (
                <div key={item.step} className={`flex gap-6 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  <div className="flex shrink-0 flex-col items-center sm:w-1/2">
                    {i % 2 === 0 ? (
                      <div className="ml-auto pr-8 text-right hidden sm:block">
                        <div className="text-4xl font-bold text-muted-foreground/30">{item.step}</div>
                        <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{item.desc}</p>
                      </div>
                    ) : null}
                    <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground ${i % 2 === 0 ? 'sm:mx-0' : ''}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {i % 2 === 1 ? (
                      <div className="pl-8 hidden sm:block sm:w-1/2">
                        <div className="text-4xl font-bold text-muted-foreground/30">{item.step}</div>
                        <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{item.desc}</p>
                      </div>
                    ) : null}
                  </div>
                  {/* Mobile-only text */}
                  <div className="sm:hidden">
                    <div className="text-3xl font-bold text-muted-foreground/30">{item.step}</div>
                    <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────────── */}
      <section className="border-b py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Who Uses It</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Built for every role in your school
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.role} className="overflow-hidden">
                <div className={`flex items-center gap-3 px-5 py-4 ${r.color}`}>
                  <r.icon className="h-5 w-5" />
                  <span className="font-semibold">{r.role}</span>
                </div>
                <CardContent className="pt-4">
                  <ul className="space-y-2.5">
                    {r.can.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to track every learning moment?
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Start using The Learning Journey Tracker today.
            No student should fall behind because of a missed class.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 h-12 px-8">
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="/dashboard/create">
                Principal Setup
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">The Learning Journey Tracker</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              Bridging the gap between attendance and learning outcomes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
