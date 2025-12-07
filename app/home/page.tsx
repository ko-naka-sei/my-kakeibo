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
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState(['食費','日用品','交通費','娯楽','固定費','その他']);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [monthlyList, setMonthlyList] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // 認証チェック
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        fetchData(data.user.id);
      } else {
        window.location.href = '/';
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // データ取得
  const fetchData = async (userId: string) => {
    const { data } = await supabase
      .from('expense')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });
    setItems(data as Expense[]);
  };

  // 月別抽出 & 収支計算
  useEffect(() => {
    const filtered = items.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    setMonthlyList(filtered);
    const total = filtered.reduce((sum, v) => sum + (v.type==='income'?Number(v.amount):-Number(v.amount)), 0);
    setMonthlyTotal(total);
  }, [items, year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOptions = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const addExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('expense').insert([{
      amount: Number(amount),
      category: category || '食費',
      type,
      createdAt: new Date(year, month-1, day).toISOString(),
      user_id: user.id
    }]);
    setAmount(''); setCategory('');
    fetchData(user.id);
  };

  const deleteItem = async (id: number) => {
    await supabase.from('expense').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const addNewCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory)) return;
    const updated = [...categories, newCategory];
    setCategories(updated);
    localStorage.setItem('categories', JSON.stringify(updated));
    setCategory(newCategory); setNewCategory('');
  };

  const deleteCategory = (c: string) => {
    const updated = categories.filter(x=>x!==c);
    setCategories(updated);
    localStorage.setItem('categories', JSON.stringify(updated));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 820, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>家計簿（収入・支出管理）</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          style={{ padding: '8px 12px', background: '#dc3545', color: '#fff', borderRadius: 6 }}
        >
          ログアウト
        </button>
      </div>

      <form onSubmit={addExpense} style={{ marginBottom: 20, padding:20, background:'#fff', borderRadius:10, border:'1px solid #ddd' }}>
        <div style={{ display:'flex', gap:12, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <label>種別</label>
            <select value={type} onChange={e=>setType(e.target.value as 'expense'|'income')} style={{ width:'100%', padding:10 }}>
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </div>
          <div style={{ flex:2 }}>
            <label>金額（円）</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ width:'100%', padding:10 }} />
          </div>
          <div style={{ flex:3 }}>
            <label>カテゴリ</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={{ width:'100%', padding:10 }}>
              <option value="">-- 選択 --</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="新カテゴリ" value={newCategory} onChange={e=>setNewCategory(e.target.value)} style={{ width:'100%', padding:8, marginTop:6 }} />
            <button type="button" onClick={addNewCategory}>カテゴリ追加</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select value={year} onChange={e=>setYear(Number(e.target.value))}>
            {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={month} onChange={e=>setMonth(Number(e.target.value))}>
            {Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}月</option>)}
          </select>
          <select value={day} onChange={e=>setDay(Number(e.target.value))}>
            {dayOptions.map(d=><option key={d} value={d}>{d}日</option>)}
          </select>
          <button type="submit" style={{ padding:10, background:'#007bff', color:'#fff' }}>追加</button>
        </div>
      </form>

      <button onClick={()=>setIsCategoryOpen(!isCategoryOpen)}>{isCategoryOpen?'▲ カテゴリ非表示':'▼ カテゴリ表示'}</button>
      {isCategoryOpen && <div>
        <ul>{categories.map(c=><li key={c}>{c}<button onClick={()=>deleteCategory(c)} style={{color:'red', marginLeft:8}}>削除</button></li>)}</ul>
      </div>}

      <h2>{year}年 {month}月の収支：{monthlyTotal.toLocaleString()}円</h2>
      <ul>
        {monthlyList.map(i=><li key={i.id}>[{i.type==='income'?'収入':'支出'}] {i.amount}円 / {i.category} / {new Date(i.createdAt).toLocaleDateString()} <button onClick={()=>deleteItem(i.id)} style={{marginLeft:10,color:'red'}}>削除</button></li>)}
      </ul>

      <Link href="/chart" style={{ padding:"10px 16px", background:"#28a745", color:"white", borderRadius:6, textDecoration:"none" }}>📊 グラフで見る</Link>
    </div>
  );
}
