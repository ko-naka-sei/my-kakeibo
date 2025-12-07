import './globals.css';
import { Analytics } from '@vercel/analytics/react'; // ← 1. これを追加

export const metadata = {
  title: '家計簿アプリ',
  description: 'Supabase認証付きの家計簿アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics /> {/* ← 2. bodyタグの閉じる直前に配置 */}
      </body>
    </html>
  );
}