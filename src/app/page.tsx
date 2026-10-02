import { isVotingOpen, VOTING_DEADLINE_LABEL } from '@/lib/deadline';
import { getDesignatedBooks, getOtherBooks } from '@/lib/books';
import VotingForm from '@/app/components/VotingForm';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const votingOpen = isVotingOpen();

  if (!votingOpen) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-bold">성환나비 내년 추천도서 투표</h1>
        <p className="text-slate-600">투표가 마감되었습니다. 참여해주셔서 감사합니다.</p>
      </main>
    );
  }

  const [designatedBooks, otherBooks] = await Promise.all([getDesignatedBooks(), getOtherBooks()]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-bold">성환나비 내년 추천도서 투표</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          <strong>지정도서 1권</strong>과 <strong>나머지도서 5권</strong>, 총 6권을 골라 추천해주세요.
          <br />
          마감: {VOTING_DEADLINE_LABEL}까지 (이미 제출했다면 같은 이름으로 다시 제출 시 이전 선택을 덮어씁니다)
        </p>
      </header>
      <VotingForm designatedBooks={designatedBooks} otherBooks={otherBooks} />
    </main>
  );
}
