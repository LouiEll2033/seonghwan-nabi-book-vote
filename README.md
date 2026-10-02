# 성환나비 내년 추천도서 투표

회원이 링크로 접속해 지정도서 1권 + 나머지도서 5권, 총 6권을 추천하는 웹앱. 마감: 2026-11-20(한국시간). 운영진은 공유 비밀번호로 `/admin` 결과 페이지에서 실시간 득표 순위를 보고 CSV로 내보낼 수 있다.

## 1. 도서 목록 확인 (배포 전 꼭 확인)

`data/seed-books.json`에 사진에서 옮겨 적은 도서 목록이 들어있다. `note` 필드가 있는 항목은 사진 글자가 작아 확신도가 낮으니, 원본 사진과 대조해서 `title`/`author`/`publisher`를 고친 뒤 `note` 필드는 지워도 된다 (seed 스크립트는 `note`를 무시하고 DB에는 넣지 않는다).

- 지정도서 `7/18`, `9/26`, `10/17`, `11/28`, `12/12`, `8/29` 항목: 제목/저자/출판사 확신도 낮음
- "싯다르타"가 지정도서(10/3)와 나머지도서 풀 양쪽에 들어있음: 의도한 것이 맞는지 확인 필요 (아니라면 한쪽에서 삭제)

수정은 배포(시드 실행) **전에** 해야 한다. 이미 시드를 실행한 뒤 고치려면 Supabase 대시보드의 테이블 편집기에서 직접 고치거나, 테이블을 비우고(`TRUNCATE designated_books, other_books CASCADE;`) `npm run db:setup`을 다시 실행한다.

## 2. 무료 DB 만들기 (Supabase)

1. https://supabase.com 에서 무료 계정 생성 (카드 등록 불필요), 새 프로젝트 생성.
2. 프로젝트 생성 후 **Project Settings → Database → Connection string** 에서 **Transaction pooler** (포트 6543) 문자열을 복사.
3. 프로젝트 루트에 `.env.local` 파일을 만들고 `.env.example`을 참고해 값을 채운다:
   - `DATABASE_URL`: 위에서 복사한 연결 문자열 (비밀번호 부분을 Supabase 프로젝트 생성 시 설정한 DB 비밀번호로 교체)
   - `ADMIN_PASSWORD`: 운영진이 결과 페이지 로그인할 때 쓸 비밀번호
   - `SESSION_SECRET`: 아무 긴 임의 문자열 (예: `openssl rand -hex 32` 결과 등)

## 3. 로컬에서 실행/테스트

```bash
npm install
npm run db:setup   # 테이블 생성 + 도서 목록 시드 (최초 1회)
npm run dev         # http://localhost:3000
```

- `/` : 회원 투표 화면
- `/admin` : 운영진 로그인 → `/admin/results` 결과 화면

## 4. 무료 배포 (Vercel)

1. 이 프로젝트를 GitHub 저장소에 올린다 (`git init && git add . && git commit -m "init"`, GitHub에 새 저장소 만들고 push).
2. https://vercel.com 에서 무료 계정 생성 (카드 등록 불필요), "Add New Project"로 방금 만든 GitHub 저장소를 import.
3. Vercel 프로젝트의 **Environment Variables**에 `.env.local`과 동일한 3개 값(`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`)을 등록 후 배포.
4. 배포된 도메인이 회원들에게 공유할 링크가 된다. 링크 공유 전에 로컬에서 `npm run db:setup`을 이미 실행해 두었는지 확인 (Supabase DB는 로컬/배포 환경이 동일하게 공유하므로 한 번만 실행하면 된다).

## 5. 마감일/규칙 바꾸고 싶을 때

- 마감일: `src/lib/deadline.ts`의 `VOTING_DEADLINE_LABEL`과 `VOTING_CLOSES_AT` 수정.
- 도서 목록: `data/seed-books.json` 수정 후 위 "이미 시드를 실행한 뒤 고치려면" 절차대로 재시드.
