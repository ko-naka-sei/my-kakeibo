//app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET
export async function GET() {
  try {
    const items = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST
export async function POST(req: Request) {
  try {
    const { amount, category, type, year, month, day } = await req.json();

    const createdAtDate = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      0, 0, 0
    ));

    const newItem = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category: category || '未分類',
        type,
        createdAt: createdAtDate,
      },
    });

    return NextResponse.json(newItem);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await prisma.expense.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
