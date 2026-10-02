import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '성환나비 내년 추천도서 투표',
  description: '성환나비 회원 추천도서 투표',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
