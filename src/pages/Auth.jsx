import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { G, LOC, AV, HOS } from '../lib/config'
import { carrier, mask } from '../lib/util'
import { signup, login, verify, resend, cancelSignup, pending, getLoc, useStore, toast } from '../lib/store'
import { Opts, Box } from '../components/ui'

const Tabs = ({ on }) => { const nav = useNavigate()
  return <div className="tabs"><button className={on === 'l' ? 'on' : ''} onClick={() => nav('/login')}>Log in</button><button className={on === 's' ? 'on' : ''} onClick={() => nav('/signup')}>Sign up</button></div> }

export function Login() {
  const nav = useNavigate(), [e, setE] = useState(''), [p, setP] = useState('')
  return <Box><Tabs on="l" /><h2>Welcome back</h2>
    <label>Email<input type="email" autoComplete="email" autoCapitalize="off" value={e} onChange={x => setE(x.target.value)} /></label>
    <label>Password<input type="password" autoComplete="current-password" value={p} onChange={x => setP(x.target.value)} /></label>
    <button className="btn" onClick={async () => { if (await login(e, p)) nav('/') }}>Log in</button></Box>
}

export function Signup() {
  const nav = useNavigate(), [ll, setLl] = useState(null)
  const [f, setF] = useState({ role:'donor', name:'', email:'', pw:'', pw2:'', ph:'', g:'O+', loc:'Banjul', av:'Available', ce:true, cs:true, consent:false, hos:HOS[0].id })
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const donor = f.role === 'donor'
  return <Box><Tabs on="s" /><h2>Create your account</h2>
    <label>I am a<select value={f.role} onChange={set('role')}><option value="donor">Volunteer blood donor</option><option value="hospital">Hospital staff</option></select></label>
    <label>Full name<input autoComplete="name" value={f.name} onChange={set('name')} /></label>
    <label>Email (we send a confirmation code)<input type="email" autoComplete="email" autoCapitalize="off" value={f.email} onChange={set('email')} /></label>
    <label>Password (8+ characters)<input type="password" autoComplete="new-password" value={f.pw} onChange={set('pw')} /></label>
    <label>Confirm password<input type="password" autoComplete="new-password" value={f.pw2} onChange={set('pw2')} /></label>
    {donor ? <>
      <label>Phone number (9 digits: 87 Africell, 83 QCell, 86 Comium)<input type="tel" inputMode="numeric" maxLength={11} value={f.ph} onChange={set('ph')} /><span className="mut">{carrier(f.ph)}</span></label>
      <label>Blood group<select value={f.g} onChange={set('g')}><Opts a={G} /></select></label>
      <label>City or area<select value={f.loc} onChange={set('loc')}><Opts a={Object.keys(LOC)} /></select></label>
      <p><button type="button" className="btn alt sm" onClick={() => getLoc(c => { setLl(c); setF(x => ({ ...x, ll: c })); toast('Live location captured.') })}>Use my live location (optional)</button> <span className="mut">{ll && 'Captured. Hospitals only see an approximate distance.'}</span></p>
      <label>Availability<select value={f.av} onChange={set('av')}><Opts a={AV.slice(0, 3)} /></select></label>
      <p className="mut" style={{ marginBottom: 4 }}>Notify me by</p>
      <label style={{ display:'inline-block', marginRight:16 }}><input type="checkbox" checked={f.ce} onChange={set('ce')} style={{ width:'auto', display:'inline' }} /> Email</label>
      <label style={{ display:'inline-block' }}><input type="checkbox" checked={f.cs} onChange={set('cs')} style={{ width:'auto', display:'inline' }} /> SMS</label>
      <label style={{ display:'flex', gap:8, alignItems:'flex-start' }}><input type="checkbox" checked={f.consent} onChange={set('consent')} style={{ width:'auto', marginTop:4 }} /> I agree to be contacted about blood donation requests. Final eligibility is decided by qualified blood-service staff.</label>
    </> : <label>Your hospital<select value={f.hos} onChange={set('hos')}>{HOS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
    <button className="btn" onClick={async () => { if (await signup(f)) nav('/verify') }}>Send confirmation code</button></Box>
}

export function Verify() {
  useStore(); const nav = useNavigate(), p = pending(), [c, setC] = useState('')
  if (!p) return <Navigate to="/signup" replace />
  return <Box><h2>Confirm your email</h2>
    <p>We sent a 6-digit code to <b>{mask('email', p.email)}</b>. Enter it to finish creating your account.</p>
    <label>Verification code<input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={c} onChange={e => setC(e.target.value)} /></label>
    <div className="row"><button className="btn" onClick={() => verify(c) && nav('/')}>Confirm and create account</button>
      <button className="btn alt" onClick={resend}>Resend code</button>
      <button className="btn alt" onClick={() => { cancelSignup(); nav('/signup') }}>Back</button></div>
    <div className="notice" style={{ marginTop: 14 }}><b>Demo mode:</b> this prototype cannot send real email. Your code is <b>{p.code}</b>. A live version emails the code and never shows it here.</div></Box>
}
