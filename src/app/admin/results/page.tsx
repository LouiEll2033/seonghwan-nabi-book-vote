import { getAllResponses, getDesignatedCounts, getOtherCounts } from '@/lib/results';

export const dynamic = 'force-dynamic';

function CountTable({ title, rows }: { title: string; rows: { title: string; date_label: string | null; votes: number }[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-slate-500">
            <th className="py-1 pr-2">도서</th>
            <th className="py-1 pr-2 text-right">득표</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.title + (r.date_label ?? '')} className="border-b border-slate-100">
              <td className="py-1 pr-2">
                {r.title}
                {r.date_label ? <span className="ml-1 text-xs text-slate-400">({r.date_label})</span> : null}
              </td>
              <td className="py-1 pr-2 text-right font-semibold">{r.votes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function AdminResultsPage() {
  const [designated, other, responses] = await Promise.all([getDesignatedCounts(), getOtherCounts(), getAllResponses()]);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">추천도서 투표 결과</h1>
        <a
          href="/api/admin/export"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          CSV 다운로드
        </a>
      </header>

      <p className="text-sm text-slate-600">총 제출 인원: {responses.length}명</p>

      <CountTable title="지정도서 득표 순위" rows={designated} />
      <CountTable title="나머지도서 득표 순위" rows={other} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">전체 응답 목록</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="py-1 pr-2">이름</th>
                <th className="py-1 pr-2">지정도서</th>
                <th className="py-1 pr-2">나머지도서</th>
                <th className="py-1 pr-2">제출/수정</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.member_name} className="border-b border-slate-100 align-top">
                  <td className="py-1 pr-2 font-medium">{r.member_name}</td>
                  <td className="py-1 pr-2">{r.designated_title}</td>
                  <td className="py-1 pr-2">{r.other_titles.join(', ')}</td>
                  <td className="py-1 pr-2 whitespace-nowrap text-xs text-slate-500">
                    {new Date(r.updated_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
