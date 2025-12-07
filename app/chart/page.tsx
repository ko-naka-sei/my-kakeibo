'use client';

import { useEffect, useState, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type Expense = {
  id: number;
  amount: number;
  category: string;
  type: 'income'|'expense';
  createdAt: string;
  user_id: string;
};

const aggregateExpenses = (expenses: Expense[]) => {
  const agg: {[key:string]:number} = {};
  expenses.forEach(e=>agg[e.category]=(agg[e.category]||0)+Number(e.amount));
  return agg;
};

const generateColors = (count:number)=>Array.from({length:count},(_,i)=>`hsl(${(i*360/count)%360},70%,60%)`);

export default function ChartPage() {
  const [user,setUser] = useState<any>(null);
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [year,setYear] = useState(new Date().getFullYear());
  const [month,setMonth] = useState(new Date().getMonth()+1);

  useEffect(()=>{
    const checkUser = async()=>{
      const {data} = await supabase.auth.getUser();
      if(data.user){
        setUser(data.user);
        fetchData(data.user.id);
      } else window.location.href='/';
    };
    checkUser();
  },[]);

  const fetchData = async(userId:string)=>{
    const {data} = await supabase.from('expense').select('*').eq('user_id',userId).order('createdAt',{ascending:false});
    setExpenses(data as Expense[]);
  };

  const filteredExpenses = useMemo(()=>expenses.filter(e=>{
    const d=new Date(e.createdAt);
    return d.getFullYear()===year && d.getMonth()+1===month;
  }),[expenses,year,month]);

  const expenseItems = filteredExpenses.filter(e=>e.type==='expense');
  const incomeItems = filteredExpenses.filter(e=>e.type==='income');

  const expenseChartData = useMemo(()=>{
    const aggregated = aggregateExpenses(expenseItems);
    const labels = Object.keys(aggregated);
    const dataValues = Object.values(aggregated);
    return {labels,datasets:[{label:'支出',data:dataValues,backgroundColor:generateColors(labels.length),borderColor:'#fff',borderWidth:1}]};
  },[expenseItems]);

  const incomeChartData = useMemo(()=>{
    const aggregated = aggregateExpenses(incomeItems);
    const labels = Object.keys(aggregated);
    const dataValues = Object.values(aggregated);
    return {labels,datasets:[{label:'収入',data:dataValues,backgroundColor:generateColors(labels.length),borderColor:'#fff',borderWidth:1}]};
  },[incomeItems]);

  const totalExpense = expenseItems.reduce((s,e)=>s+Number(e.amount),0);
  const totalIncome = incomeItems.reduce((s,e)=>s+Number(e.amount),0);

  if(!user) return null;

  return (
    <div style={{padding:20,maxWidth:700,margin:'auto'}}>
      <h1>{year}年 {month}月 グラフ</h1>

      <div style={{marginBottom:20}}>
        <select value={year} onChange={e=>setYear(Number(e.target.value))}>
          {Array.from({length:3}).map((_,i)=><option key={i} value={2024+i}>{2024+i}年</option>)}
        </select>
        <select value={month} onChange={e=>setMonth(Number(e.target.value))}>
          {Array.from({length:12}).map((_,i)=><option key={i} value={i+1}>{i+1}月</option>)}
        </select>
      </div>

      <h2>支出: ¥{totalExpense.toLocaleString()}</h2>
      {expenseItems.length>0?<div style={{width:'40%',height:350,marginBottom:40}}><Pie data={expenseChartData}/></div>:<p>支出データがありません</p>}

      <h2>収入: ¥{totalIncome.toLocaleString()}</h2>
      {incomeItems.length>0?<div style={{width:'40%',height:350}}><Pie data={incomeChartData}/></div>:<p>収入データがありません</p>}

      <Link href="/home"><button style={{padding:'10px 15px',marginTop:20}}>🏠 メイン画面へ戻る</button></Link>
    </div>
  );
}
