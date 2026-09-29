'use client'
import { FormEvent,useState } from 'react'
import { createClient } from '@/lib/supabase/client'
export default function ForgotPassword(){
 const [email,setEmail]=useState(''); const [msg,setMsg]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMsg('');setError('');const s=createClient();const redirectTo=`${location.origin}/reset-password`;const {error}=await s.auth.resetPasswordForEmail(email,{redirectTo});setLoading(false);if(error){setError(error.message);return}setMsg('If that email is registered, a password reset link has been sent.')}
 return <main className="shell"><div className="topbar"><a className="brand" href="/">Mira Play</a></div><form className="card stack" onSubmit={submit} style={{maxWidth:560,margin:'40px auto'}}><h2>Reset your password</h2><p className="muted">Enter your registered email address and we’ll send you a secure reset link.</p><div className="field"><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>{msg&&<div className="notice">{msg}</div>}{error&&<div className="error">{error}</div>}<button className="btn" disabled={loading}>{loading?'Sending…':'Send reset link'}</button><a className="btn secondary" href="/">Back to sign in</a></form></main>
}