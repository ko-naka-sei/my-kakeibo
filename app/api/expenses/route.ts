import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ⚠️ 注意: 本来はリクエストヘッダーから認証トークンを取得し、
//          Supabase経由で正しいユーザーIDを取得する必要があります。

// GET: 全データの取得 (現在はユーザーIDによる絞り込みなし)
export async function GET(request: Request) {
  try {
    // ユーザーIDによる絞り込みを省略し、全データを取得（開発用）
    const items = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST: 新しいデータの登録
export async function POST(req: Request) {
  try {
    // クライアントから送られてくる JSON データを受け取る
    const { amount, category, type, year, month, day, userId } = await req.json();

    // 日付オブジェクトを生成
    const createdAtDate = new Date(Date.UTC(
      Number(year),
      Number(month) - 1, // 月は0から始まるため -1
      Number(day),
      0, 0, 0
    ));

    // 💡 Security Hole: 認証をスキップし、固定値を使用しています
    const USER_ID = userId || 'test-user-id'; 

    const newItem = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category: category || '未分類',
        type,
        createdAt: createdAtDate,
        user_id: USER_ID, // 必須項目なので固定値を設定
      },
    });

    return NextResponse.json(newItem);
  } catch (err) {
    // データベースエラー（例：型が合わない、外部キー制約など）
    console.error("POST Error:", err); 
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

// DELETE: データの削除
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    // 💡 Security Hole: 本来は削除前に user_id の一致を確認すべきです
    await prisma.expense.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}