// 한국(Asia/Seoul)은 서머타임이 없어 고정 오프셋(+09:00)으로 충분하다.
// 2026-11-20이 다 지나갈 때까지(자정 직전까지) 투표를 받고, 11/21 00:00 KST에 마감한다.
export const VOTING_DEADLINE_LABEL = '2026년 11월 20일';
const VOTING_CLOSES_AT = new Date('2026-11-21T00:00:00+09:00').getTime();

export function isVotingOpen(now: number = Date.now()): boolean {
  return now < VOTING_CLOSES_AT;
}
