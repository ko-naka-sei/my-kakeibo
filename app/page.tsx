'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    else window.location.href = '/home';
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErrorMsg(error.message);
    else setSuccessMsg('登録完了。メールを確認してください');
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '50px auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>家計簿アプリ</h1>
      <p>ログインまたは新規登録してください
        確認メールを開いてもサーバとつながりませんが、無視して大丈夫です。
      </p>
      
      {errorMsg && <p style={{ color: 'red', background:'#ffe6e6', padding:10 }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green', background:'#e6ffe6', padding:10 }}>{successMsg}</p>}
      
      <input 
        type="email" placeholder="メールアドレス" 
        value={email} onChange={e => setEmail(e.target.value)} 
        style={{ width: '100%', padding: 12, marginBottom: 10, boxSizing: 'border-box' }} 
      />
      <input 
        type="password" placeholder="パスワード" 
        value={password} onChange={e => setPassword(e.target.value)} 
        style={{ width: '100%', padding: 12, marginBottom: 20, boxSizing: 'border-box' }} 
      />
      
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleLogin} style={{ flex: 1, padding: 12, background: '#0070f3', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>ログイン</button>
        <button onClick={handleSignUp} style={{ flex: 1, padding: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>新規登録</button>
      </div>
    </div>
  );
}