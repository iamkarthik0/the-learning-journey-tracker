'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, CheckCircle2, Clock, Search, X } from 'lucide-react';

export type ChapterRow = {
  chapter_id: string;
  chapter_name: string;
  subject_name: string | null;
  section: string | null;
  order_index: number | null;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  questions: Array<{ is_completed: boolean }>;
};

type SubjectOption = {
  subject_id: string;
  subject_name: string;
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function ChaptersTable({
  chapters,
  subjects,
}: {
  chapters: ChapterRow[];
  subjects: SubjectOption[];
}) {
  const [search,        setSearch]        = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');

  const sections = useMemo(() => {
    const s = new Set<string>();
    chapters.forEach((c) => { if (c.section) s.add(c.section); });
    return Array.from(s).sort();
  }, [chapters]);

  const filtered = useMemo(() =>
    chapters
      .filter((c) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !c.chapter_name.toLowerCase().includes(q) &&
            !(c.subject_name ?? '').toLowerCase().includes(q)
          ) return false;
        }
        if (subjectFilter !== 'all' && c.subject_name !== subjectFilter) return false;
        if (sectionFilter !== 'all' && c.section       !== sectionFilter) return false;
        if (statusFilter  === 'completed'   && !c.is_completed) return false;
        if (statusFilter  === 'in-progress' &&  c.is_completed) return false;
        return true;
      })
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [chapters, search, subjectFilter, sectionFilter, statusFilter]
  );

  const hasFilters =
    search.trim() || subjectFilter !== 'all' ||
    sectionFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chapter or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.subject_id} value={s.subject_name}>
                {s.subject_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="h-9 w-[130px] text-sm">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((s) => (
              <SelectItem key={s} value={s}>Section {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[130px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setSubjectFilter('all');
              setSectionFilter('all');
              setStatusFilter('all');
            }}
            className="h-9 gap-1.5 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground">{filtered.length}</span>
        {' of '}
        <span className="font-medium text-foreground">{chapters.length}</span>
        {' '}chapters
      </p>

      {/* Table / empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">
            {chapters.length === 0 ? 'No chapters yet' : 'No matches found'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {chapters.length === 0
              ? 'Create your first chapter using the form'
              : 'Try adjusting the filters'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[48px] pl-4">#</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[80px]">Section</TableHead>
                <TableHead className="w-[110px]">Progress</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[110px]">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ch) => {
                const total = ch.questions.length;
                const done  = ch.questions.filter((q) => q.is_completed).length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <TableRow key={ch.chapter_id}>
                    <TableCell className="pl-4 text-sm text-muted-foreground">
                      {ch.order_index ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ch.is_completed
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          : <Clock        className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
                        <span className="font-medium text-sm">{ch.chapter_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ch.subject_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {ch.section
                        ? <Badge variant="outline" className="text-xs">Sec {ch.section}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{done}/{total}</span>
                          <span className="text-xs font-medium">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${ch.is_completed ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ch.is_completed ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmt(ch.start_date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
