'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Chart.jsを使うための登録（おまじない）
ChartJS.register(ArcElement, Tooltip, Legend, Title);

type Expense = {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  createdAt: string;
};

export default function ChartPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 日付フィルタ用
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchData(session.user.id);
      } else {
        window.location.href = '/';
      }
    };
    checkUser();
  }, []);

  const fetchData = async (userId: string) => {
    // 全データを取得（クライアント側で月別フィルタするため）
    const { data, error } = await supabase
      .from('expense')
      .select('*')
      .eq('user_id', userId);

    if (error) console.error(error);
    setItems((data as Expense[]) || []);
    setLoading(false);
  };

  // ---------------------------------------------
  // データ集計ロジック
  // ---------------------------------------------
  
  // 1. 今月のデータだけに絞り込む
  const monthlyData = items.filter(item => {
    const d = new Date(item.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  // 2. カテゴリごとに集計する関数
  const aggregateByCategory = (data: Expense[]) => {
    const result: { [key: string]: number } = {};
    data.forEach(item => {
      // カテゴリが空なら「その他」にする
      const cat = item.category || 'その他';
      if (!result[cat]) result[cat] = 0;
      result[cat] += item.amount;
    });
    return result;
  };

  // 収入と支出に分ける
  const incomeData = monthlyData.filter(i => i.type === 'income');
  const expenseData = monthlyData.filter(i => i.type === 'expense' || i.type === 'payment'); // type='expense'または互換性のため

  // 集計実行
  const incomeAggregated = aggregateByCategory(incomeData);
  const expenseAggregated = aggregateByCategory(expenseData);

  // ---------------------------------------------
  // グラフ用のデータ作成関数
  // ---------------------------------------------
  const createChartData = (aggregatedData: { [key: string]: number }, label: string) => {
    const categories = Object.keys(aggregatedData);
    const amounts = Object.values(aggregatedData);

    // データがない場合
    if (categories.length === 0) {
      return null;
    }

    return {
      labels: categories,
      datasets: [
        {
          label: label,
          data: amounts,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#E7E9ED', '#76A346', '#D67D29', '#2E5090'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const incomeChartData = createChartData(incomeAggregated, '収入');
  const expenseChartData = createChartData(expenseAggregated, '支出');

  // 合計金額
  const totalIncome = Object.values(incomeAggregated).reduce((a, b) => a + b, 0);
  const totalExpense = Object.values(expenseAggregated).reduce((a, b) => a + b, 0);

  if (loading) return <div style={{padding:20}}>読み込み中...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📊 家計分析</h1>
        <Link href="/home" style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize:'14px' }}>
          ← 入力画面に戻る
        </Link>
      </div>

      {/* 年月選択 */}
      <div style={{ marginBottom: 30, textAlign: 'center', background: '#f8f9fa', padding: 15, borderRadius: 8 }}>
        <select 
          value={year} 
          onChange={e => setYear(Number(e.target.value))}
          style={{ fontSize: '18px', padding: 5, marginRight: 10 }}
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        <select 
          value={month} 
          onChange={e => setMonth(Number(e.target.value))}
          style={{ fontSize: '18px', padding: 5 }}
        >
          {Array.from({length:12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
        </select>
      </div>

      {/* 収支サマリー */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
        <div style={{ flex: 1, padding: 20, background: '#d4edda', borderRadius: 10, textAlign: 'center', color: '#155724' }}>
          <h3>💰 収入合計</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>+{totalIncome.toLocaleString()}円</p>
        </div>
        <div style={{ flex: 1, padding: 20, background: '#f8d7da', borderRadius: 10, textAlign: 'center', color: '#721c24' }}>
          <h3>💸 支出合計</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>-{totalExpense.toLocaleString()}円</p>
        </div>
        <div style={{ flex: 1, padding: 20, background: '#fff3cd', borderRadius: 10, textAlign: 'center', color: '#856404' }}>
          <h3>残高</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{(totalIncome - totalExpense).toLocaleString()}円</p>
        </div>
      </div>

      {/* グラフ表示エリア */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }}>
        
        {/* 支出のグラフ */}
        <div style={{ flex: '1 1 300px', maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ borderBottom: '2px solid #dc3545', display: 'inline-block', paddingBottom: 5, marginBottom: 20 }}>
            支出の内訳
          </h2>
          {expenseChartData ? (
            <Doughnut data={expenseChartData} />
          ) : (
            <p style={{ color: '#999', marginTop: 50 }}>データがありません</p>
          )}
        </div>

        {/* 収入のグラフ */}
        <div style={{ flex: '1 1 300px', maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ borderBottom: '2px solid #28a745', display: 'inline-block', paddingBottom: 5, marginBottom: 20 }}>
            収入の内訳
          </h2>
          {incomeChartData ? (
            <Doughnut data={incomeChartData} />
          ) : (
            <p style={{ color: '#999', marginTop: 50 }}>データがありません</p>
          )}
        </div>

      </div>
    </div>
  );
}