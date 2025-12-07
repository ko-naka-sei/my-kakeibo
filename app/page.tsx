'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    else window.location.href = '/home';
  };

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setErrorMsg(error.message);
    else setSuccessMsg('登録完了。メールを確認してください');
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: 'auto' }}>
      <h1>ログイン / 新規登録</h1>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <input type="email" placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <button onClick={handleLogin} style={{ width: '48%', padding: 10, marginRight: '4%' }}>ログイン</button>
      <button onClick={handleSignUp} style={{ width: '48%', padding: 10 }}>新規登録</button>
    </div>
  );
}
