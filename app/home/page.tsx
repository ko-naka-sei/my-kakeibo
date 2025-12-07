'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

type Expense = {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  createdAt: string;
  user_id: string;
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // 入力フォーム用
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState(['食費','日用品','交通費','娯楽','固定費','給料','その他']);
  const [newCategory, setNewCategory] = useState('');
  
  // 日付
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());

  // 集計用
  const [monthlyList, setMonthlyList] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // 1. ユーザーチェック
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchData(session.user.id);
      } else {
        window.location.href = '/';
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // 2. データ取得
  const fetchData = async (userId: string) => {
    const { data, error } = await supabase
      .from('expense')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    if (error) console.error(error);
    setItems((data as Expense[]) || []);
  };

  // 3. ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // 4. 集計処理
  useEffect(() => {
    const filtered = items?.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }) || [];

    setMonthlyList(filtered);

    const total = filtered.reduce((sum, v) => {
      const val = Number(v.amount);
      return sum + (v.type === 'income' ? val : -val);
    }, 0);
    setMonthlyTotal(total);
  }, [items, year, month]);

  // 5. 追加処理
  const addExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !user) return;

    const targetDate = new Date(year, month - 1, day);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes());

    const { error } = await supabase.from('expense').insert([{
      amount: Number(amount),
      category: category || '食費',
      type,
      user_id: user.id,
      createdAt: targetDate.toISOString()
    }]);

    if (error) {
      alert('エラー: ' + error.message);
    } else {
      setAmount('');
      fetchData(user.id);
    }
  };

  // 6. 削除処理
  const deleteItem = async (id: number) => {
    await supabase.from('expense').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const addNewCategory = () => {
    if(!newCategory) return;
    setCategories([...categories, newCategory]);
    setCategory(newCategory);
    setNewCategory('');
  };

  if (loading) return <div style={{padding:20}}>読み込み中...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin:0, fontSize:'24px' }}>💰 家計簿アプリ</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor:'pointer' }}>
          ログアウト
        </button>
      </div>

      {/* 入力フォーム */}
      <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
        <form onSubmit={addExpense}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
            <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: 10, flex:1 }}>
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="金額" style={{ padding: 10, flex:2 }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 10, flex:2 }}>
              <option value="">カテゴリ選択</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div style={{ marginBottom: 15 }}>
             <input type="text" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="カテゴリ追加" style={{padding:5, fontSize:12}} />
             <button type="button" onClick={addNewCategory} style={{fontSize:12, marginLeft:5}}>追加</button>
          </div>

          <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent:'flex-end' }}>
            <span style={{fontSize:14}}>日付:</span>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}</select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m}月</option>)}</select>
            <select value={day} onChange={e => setDay(Number(e.target.value))}>{Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={d}>{d}日</option>)}</select>
            
            <button type="submit" style={{ marginLeft: 10, padding: '10px 25px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor:'pointer' }}>登録</button>
          </div>
        </form>
      </div>

      {/* 集計とリスト */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom: '2px solid #ddd', paddingBottom: 10, marginBottom:10 }}>
           <h2>{year}年{month}月の収支</h2>
           <span style={{ fontSize:'24px', fontWeight:'bold', color: monthlyTotal >= 0 ? 'green' : 'red' }}>
             {monthlyTotal > 0 ? '+' : ''}{monthlyTotal.toLocaleString()}円
           </span>
        </div>
        
        {monthlyList.length === 0 && <p style={{color:'#999'}}>データがありません</p>}
        
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {monthlyList.map(item => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 5px', borderBottom: '1px solid #eee' }}>
              <div>
                <span style={{ marginRight: 10, padding: '3px 8px', borderRadius: 4, background: item.type === 'income' ? '#d4edda' : '#f8d7da', color: item.type === 'income' ? '#155724' : '#721c24', fontSize: '12px' }}>
                  {item.type === 'income' ? '収入' : '支出'}
                </span>
                <strong>{item.category}</strong>
                <span style={{ marginLeft: 10, color: '#666', fontSize: '12px' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: 15 }}>{item.amount.toLocaleString()}円</span>
                <button onClick={() => deleteItem(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link href="/chart" style={{ display:'inline-block', padding:'10px 20px', background:'#17a2b8', color:'white', textDecoration:'none', borderRadius:20 }}>
           📊 グラフで分析する
        </Link>
      </div>
    </div>
  );
}