# 성환나비 내년 추천도서 투표

회원이 링크로 접속해 지정도서 1권 + 나머지도서 5권, 총 6권을 추천하는 웹앱. 마감: 2026-11-20(한국시간). 운영진은 공유 비밀번호로 `/admin` 결과 페이지에서 실시간 득표 순위를 보고 CSV로 내보낼 수 있다.

## 1. 도서 목록 확인 (배포 전 꼭 확인)

`data/seed-books.json`에 도서 목록이 들어있다 (지정도서 12권, 나머지도서 50권). 업로드된 사진과 온라인 서점 정보로 대조했고, `note` 필드가 있는 항목은 확인이 필요한 항목이다 (seed 스크립트는 `note`를 DB에 넣지 않는다).

표지 이미지는 `public/covers/`에 있고, `d01.jpg`~(지정도서), `o01.jpg`~(나머지도서)가 각각 목록 순서(1부터)에 대응한다. 목록 순서를 바꾸거나 책을 빼면 표지 파일 번호도 같이 맞춰야 한다.

목록을 고친 뒤 DB에 다시 반영하려면 `npm run db:setup -- --reset`을 실행한다. 이미 제출된 응답이 하나라도 있으면 안전을 위해 실행이 거부된다. 그 경우에는 Supabase 대시보드의 Table Editor에서 해당 행을 직접 고친다.

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
