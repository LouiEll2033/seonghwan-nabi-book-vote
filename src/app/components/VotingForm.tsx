'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Book, DesignatedBook } from '@/lib/books';

type Props = {
  designatedBooks: DesignatedBook[];
  otherBooks: Book[];
};

const OTHER_BOOKS_REQUIRED = 5;

export default function VotingForm({ designatedBooks, otherBooks }: Props) {
  const [memberName, setMemberName] = useState('');
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [designatedId, setDesignatedId] = useState<number | null>(null);
  const [otherIds, setOtherIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/responses/names')
      .then((res) => (res.ok ? res.json() : { names: [] }))
      .then((data) => setExistingNames(data.names ?? []))
      .catch(() => setExistingNames([]));
  }, []);

  const otherCount = otherIds.length;
  const canSubmit = useMemo(
    () => memberName.trim().length > 0 && designatedId !== null && otherCount === OTHER_BOOKS_REQUIRED && !submitting,
    [memberName, designatedId, otherCount, submitting]
  );

  function toggleOtherBook(id: number) {
    setResult(null);
    setOtherIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= OTHER_BOOKS_REQUIRED) {
        return prev;
      }
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_name: memberName.trim(),
          designated_book_id: designatedId,
          other_book_ids: otherIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', message: data.error ?? '제출 중 오류가 발생했습니다.' });
        return;
      }
      setResult({ type: 'success', message: '제출이 완료되었습니다. 감사합니다!' });
      if (!existingNames.includes(memberName.trim())) {
        setExistingNames((prev) => [...prev, memberName.trim()]);
      }
    } catch {
      setResult({ type: 'error', message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      <section className="space-y-2">
        <label htmlFor="member_name" className="block text-sm font-semibold">
          이름
        </label>
        <input
          id="member_name"
          list="existing-names"
          value={memberName}
          onChange={(e) => {
            setMemberName(e.target.value);
            setResult(null);
          }}
          placeholder="이름을 입력하세요"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
          autoComplete="off"
        />
        <datalist id="existing-names">
          {existingNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-xs text-slate-500">이미 제출한 이름과 똑같이 입력하면 이전 선택을 덮어씁니다.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">지정도서 중 1권 선택</h2>
        <ul className="space-y-2">
          {designatedBooks.map((book) => (
            <li key={book.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="designated_book"
                  className="mt-1"
                  checked={designatedId === book.id}
                  onChange={() => {
                    setDesignatedId(book.id);
                    setResult(null);
                  }}
                />
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">나머지도서 중 5권 선택</h2>
          <span
            className={`text-sm font-semibold ${otherCount === OTHER_BOOKS_REQUIRED ? 'text-blue-600' : 'text-slate-500'}`}
          >
            {otherCount} / {OTHER_BOOKS_REQUIRED} 선택됨
          </span>
        </div>
        <ul className="space-y-2">
          {otherBooks.map((book) => {
            const checked = otherIds.includes(book.id);
            const disabled = !checked && otherCount >= OTHER_BOOKS_REQUIRED;
            return (
              <li key={book.id}>
                <label
                  className={`flex items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 ${
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

      {result && (
        <p className={`rounded-lg p-3 text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? '제출 중...' : '제출하기'}
      </button>
    </form>
  );
}
