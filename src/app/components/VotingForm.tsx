'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Book, DesignatedBook } from '@/lib/books';

type Props = {
  designatedBooks: DesignatedBook[];
  otherBooks: Book[];
};

type Step = 1 | 2 | 3;

const OTHER_BOOKS_REQUIRED = 5;

function Cover({ url, title, small = false }: { url: string | null; title: string; small?: boolean }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${title} 표지`}
      loading="lazy"
      className={`${small ? 'h-14 w-10' : 'h-28 w-20'} shrink-0 rounded border border-slate-200 bg-slate-100 object-contain`}
    />
  );
}

function Progress({ step }: { step: Step }) {
  const items = [
    { n: 1, label: '기본 선택' },
    { n: 2, label: '추가 선택' },
  ] as const;
  return (
    <ol className="mb-6 flex gap-2">
      {items.map(({ n, label }) => {
        const active = step === n;
        const done = step > n;
        return (
          <li
            key={n}
            className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold ${
              active ? 'bg-blue-600 text-white' : done ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {n}단계 · {label}
          </li>
        );
      })}
    </ol>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">{children}</div>
    </div>
  );
}

export default function VotingForm({ designatedBooks, otherBooks }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [memberName, setMemberName] = useState('');
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [designatedId, setDesignatedId] = useState<number | null>(null);
  const [otherIds, setOtherIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/responses/names')
      .then((res) => (res.ok ? res.json() : { names: [] }))
      .then((data) => setExistingNames(data.names ?? []))
      .catch(() => setExistingNames([]));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const designatedBook = useMemo(
    () => designatedBooks.find((b) => b.id === designatedId) ?? null,
    [designatedBooks, designatedId]
  );
  const selectedOtherBooks = useMemo(
    () => otherIds.map((id) => otherBooks.find((b) => b.id === id)).filter((b): b is Book => Boolean(b)),
    [otherBooks, otherIds]
  );

  const name = memberName.trim();
  const canGoNext = name.length > 0 && designatedId !== null;
  const otherCount = otherIds.length;
  const canSubmit = otherCount === OTHER_BOOKS_REQUIRED && !submitting;

  function toggleOtherBook(id: number) {
    setError(null);
    setOtherIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= OTHER_BOOKS_REQUIRED) return prev;
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (!canSubmit || designatedId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_name: name, designated_book_id: designatedId, other_book_ids: otherIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '제출 중 오류가 발생했습니다.');
        return;
      }
      if (!existingNames.includes(name)) setExistingNames((prev) => [...prev, name]);
      setStep(3);
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 3) {
    return (
      <div className="space-y-5 pb-10">
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          <p className="font-semibold">{name}님, 제출이 완료되었습니다. 감사합니다!</p>
          <p className="mt-1 text-sm">같은 이름으로 다시 제출하면 선택이 수정됩니다.</p>
        </div>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">내가 추천한 책</h2>
          <ul className="space-y-2 text-sm">
            {designatedBook && (
              <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                <Cover url={designatedBook.cover_url} title={designatedBook.title} small />
                <span>
                  <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">기본</span>
                  {designatedBook.title}
                </span>
              </li>
            )}
            {selectedOtherBooks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                <Cover url={b.cover_url} title={b.title} small />
                <span>
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">추가</span>
                  {b.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full rounded-lg border border-slate-300 bg-white py-3 text-base font-semibold"
        >
          선택 수정하기
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <Progress step={step} />

      {step === 1 && (
        <div className="space-y-8">
          <section className="space-y-2">
            <label htmlFor="member_name" className="block text-sm font-semibold">
              이름
            </label>
            <input
              id="member_name"
              list="existing-names"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
              autoComplete="off"
            />
            <datalist id="existing-names">
              {existingNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500">이미 제출한 이름과 똑같이 입력하면 이전 선택을 덮어씁니다.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold">지정도서 중 1권을 선택하세요</h2>
            <ul className="space-y-2">
              {designatedBooks.map((book) => (
                <li key={book.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="designated_book"
                      className="mt-1"
                      checked={designatedId === book.id}
                      onChange={() => setDesignatedId(book.id)}
                    />
                    <Cover url={book.cover_url} title={book.title} />
                    <span>
                      <span className="block font-medium">{book.title}</span>
                      <span className="block text-xs text-slate-500">
                        {[book.author, book.publisher].filter(Boolean).join(' · ')}
                        {book.date_label ? ` · ${book.date_label}` : ''}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <BottomBar>
            <p className="flex-1 text-xs text-slate-500">
              {name.length === 0 ? '이름을 입력해주세요.' : designatedId === null ? '지정도서를 1권 골라주세요.' : '선택 완료'}
            </p>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setStep(2)}
              className="rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              다음 단계로
            </button>
          </BottomBar>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {designatedBook && (
            <section className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Cover url={designatedBook.cover_url} title={designatedBook.title} small />
              <div className="flex-1 text-sm">
                <p className="text-xs font-semibold text-blue-700">{name}님의 기본 선택</p>
                <p className="font-medium">{designatedBook.title}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-blue-700 underline">
                변경
              </button>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-base font-bold">나머지 도서 중 5권을 선택하세요</h2>
            <ul className="space-y-2">
              {otherBooks.map((book) => {
                const checked = otherIds.includes(book.id);
                const disabled = !checked && otherCount >= OTHER_BOOKS_REQUIRED;
                return (
                  <li key={book.id}>
                    <label
                      className={`flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 ${
                        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleOtherBook(book.id)}
                      />
                      <Cover url={book.cover_url} title={book.title} />
                      <span>
                        <span className="block font-medium">{book.title}</span>
                        <span className="block text-xs text-slate-500">
                          {[book.author, book.publisher].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <BottomBar>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-semibold"
            >
              이전
            </button>
            <span
              className={`flex-1 text-center text-sm font-semibold ${
                otherCount === OTHER_BOOKS_REQUIRED ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              {otherCount} / {OTHER_BOOKS_REQUIRED} 선택됨
            </span>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? '제출 중...' : '제출하기'}
            </button>
          </BottomBar>
        </div>
      )}
    </div>
  );
}
