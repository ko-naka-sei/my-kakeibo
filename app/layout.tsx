import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
