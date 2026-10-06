import { useSyncExternalStore } from 'react'
import { G, HOS } from './config'
import { EMAIL_RE, cleanPh, phoneOk, fmt, hosp } from './util'

const K = 'bloodlink-react-v1'
const fresh = () => { const inv = {}; HOS.forEach(h => { inv[h.id] = {}; G.forEach(g => inv[h.id][g] = 0) })
  return { donors:[], users:[], session:null, reqs:[], matches:[], appts:[], dons:[], notifs:[], outbox:[], inv, pending:null, seq:1000 } }
const load = () => { for (const get of [() => localStorage.getItem(K), () => window.name]) { try { const s = JSON.parse(get()); if (s?.users) return s } catch {} } return fresh() }
export const S = load()

let v = 0; const subs = new Set()
export const commit = () => { const j = JSON.stringify(S); try { localStorage.setItem(K, j) } catch { try { window.name = j } catch {} } v++; subs.forEach(f => f()) }
export const useStore = () => { useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => v); return S }
let T = { msg:'', n:0 }; const ts = new Set()
export const toast = msg => { T = { msg, n: T.n + 1 }; ts.forEach(f => f()) }
export const useToast = () => useSyncExternalStore(f => { ts.add(f); return () => ts.delete(f) }, () => T)

export const donor = id => S.donors.find(d => d.id === id)
export const user = () => S.users.find(u => u.id === S.session)
export const pending = () => S.pending
const bad = m => { toast(m); return false }
const push = (did, type, text) => S.notifs.unshift({ did, type, text, at:new Date().toISOString() })
async function hash(p, salt) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + p)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('') }
// Replace with a call to your server/email/SMS provider. The prototype only queues messages.
export const deliver = () => 'Queued (demo: not delivered)'

/* ---- accounts ---- */
function sendCode() { const p = S.pending; p.code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6,'0'); p.exp = Date.now() + 6e5; p.tries = 0
  S.outbox.unshift({ id:'M'+(++S.seq), ch:'email', to:p.email, text:`Your BloodLink Gambia verification code is ${p.code}. It expires in 10 minutes.`, at:new Date().toISOString(), st:deliver() }) }
export async function signup(f) {
  const email = f.email.trim().toLowerCase(), name = f.name.trim()
  if (!name) return bad('Enter your full name.')
  if (!EMAIL_RE.test(email)) return bad('Enter a valid email address.')
  if (f.pw.length < 8) return bad('Password must be at least 8 characters.')
  if (f.pw !== f.pw2) return bad('Passwords do not match.')
  if (S.users.some(u => u.email === email)) return bad('An account with this email already exists. Log in instead.')
  let don = null
  if (f.role === 'donor') {
    const ph = cleanPh(f.ph)
    if (!phoneOk(ph)) return bad('Enter a valid 9-digit number starting with 87 (Africell), 83 (QCell) or 86 (Comium).')
    if (S.donors.some(d => d.ph === ph)) return bad('This phone number is already registered.')
    if (!f.ce && !f.cs) return bad('Choose at least one way to be notified.')
    if (!f.consent) return bad('Please agree to be contacted about blood donation requests.')
    don = { name, email, ph, g:f.g, loc:f.loc, av:f.av, ch:{ email:+f.ce, sms:+f.cs }, ll:f.ll, llAt:f.ll ? Date.now() : 0 }
  }
  const salt = crypto.randomUUID()
  S.pending = { role:f.role, name, email, salt, hash:await hash(f.pw, salt), donor:don, hid:f.hos }
  sendCode(); commit(); return true
}
export const resend = () => { sendCode(); commit(); toast('A new code was sent.') }
export const cancelSignup = () => { S.pending = null; commit() }
export function verify(code) {
  const p = S.pending; if (!p) return false
  if (Date.now() > p.exp) return bad('That code has expired. Request a new one.')
  if (p.tries >= 5) return bad('Too many attempts. Request a new code.')
  if (code.trim() !== p.code) { p.tries++; commit(); return bad('Incorrect code. Check your email and try again.') }
  const u = { id:'u'+(++S.seq), email:p.email, name:p.name, role:p.role, salt:p.salt, hash:p.hash, verified:true }
  if (p.donor) { const d = { ...p.donor, id:'d'+(++S.seq), uid:u.id }; S.donors.push(d); u.did = d.id } else u.hid = p.hid
  S.users.push(u); S.pending = null; S.session = u.id; commit(); toast('Email confirmed. Welcome, ' + u.name + '.'); return true
}
export async function login(email, pw) {
  const u = S.users.find(x => x.email === email.trim().toLowerCase())
  if (!u) return bad('No account found for this email on this browser. Please sign up first.')
  if (await hash(pw, u.salt) !== u.hash) return bad('Incorrect password. Please try again.')
  S.session = u.id; commit(); return true
}
export const logout = () => { S.session = null; commit() }

/* ---- hospital ---- */
export function createReq(hid, f) {
  if (!f.by) { bad('Choose a required-by time.'); return null }
  const r = { id:'BR'+(++S.seq), hid, g:f.g, units:+f.units || 1, urg:f.urg, by:new Date(f.by).toISOString(), msg:f.msg, at:new Date().toISOString() }
  S.reqs.unshift(r); commit(); toast('Request ' + r.id + ' created. Potential donors ranked below.'); return r.id
}
function queue(d, r, text) { const c = d.ch || { email:1, sms:1 }, em = d.email || S.users.find(u => u.id === d.uid)?.email
  ;[['email', c.email && em], ['sms', c.sms && d.ph]].forEach(([ch, to]) => { if (to) S.outbox.unshift({ id:'M'+(++S.seq), did:d.id, hid:r.hid, rid:r.id, ch, to, text, at:new Date().toISOString(), st:deliver(ch, to, text) }) }) }
export function notifyDonors(rid, ids) {
  const r = S.reqs.find(x => x.id === rid); let n = 0
  ids.forEach(did => {
    if (S.matches.some(m => m.rid === rid && m.did === did)) return // never notify the same donor twice
    S.matches.push({ rid, did, st:'notified', count:1, last:new Date().toISOString() }); n++
    const msg = `${r.urg.toUpperCase()} BLOOD REQUEST: ${r.g}, ${r.units} unit(s) at ${hosp(r.hid).name}, needed by ${fmt(r.by)}. Open BloodLink Gambia to respond.`
    push(did, r.urg, msg); queue(donor(did), r, msg)
  })
  commit(); toast(n ? n + ' donor(s) notified (in-app, plus email/SMS queued).' : 'Select donors who have not been contacted yet.')
}
export function respond(rid, did, ans) {
  const m = S.matches.find(m => m.rid === rid && m.did === did)
  if (!m || m.st !== 'notified') return toast('You have already responded to this request.')
  if (new Date(S.reqs.find(x => x.id === rid).by) < new Date()) return toast('This blood request has expired.')
  m.st = ans; commit(); toast(ans === 'accepted' ? 'Thank you. Final eligibility is decided by qualified blood-service staff.' : 'Response saved. You stay on the donor list.')
}
export function schedule(rid, did, t) {
  if (!t) return toast('Pick an appointment time.')
  S.appts.push({ id:'A'+(++S.seq), rid, did, at:new Date(t).toISOString(), st:'Pending' })
  push(did, 'Normal', 'Appointment proposed at ' + hosp(S.reqs.find(r => r.id === rid).hid).name + ' on ' + fmt(new Date(t).toISOString()) + '. Please confirm.')
  commit(); toast('Appointment created.')
}
export function apptSet(id, st) {
  const a = S.appts.find(x => x.id === id); a.st = st
  if (st === 'Completed') { const r = S.reqs.find(x => x.id === a.rid)
    S.dons.push({ id:'DN'+(++S.seq), rid:a.rid, did:a.did, hid:r.hid, g:donor(a.did).g, at:new Date().toISOString() }); S.inv[r.hid][r.g]++
    push(a.did, 'Normal', 'Your donation was recorded. Next-donation eligibility is determined by qualified blood-service staff.') }
  commit(); toast('Appointment ' + st.toLowerCase() + '.')
}
export const cancelReq = id => { S.reqs.find(r => r.id === id).cancel = true; commit(); toast('Request cancelled.') }
export const stock = (hid, g, n) => { S.inv[hid][g] = Math.max(0, S.inv[hid][g] + n); commit() }

/* ---- donor ---- */
export const setAv = (did, val) => { donor(did).av = val; commit(); toast('Availability updated.') }
export function getLoc(cb) {
  if (!navigator.geolocation) return toast('Live location is not supported on this device.')
  navigator.geolocation.getCurrentPosition(p => cb([p.coords.latitude, p.coords.longitude]),
    e => toast(e.code === 1 ? 'Location permission denied. Your selected area will be used instead.' : 'Could not get your location. Your selected area will be used instead.'), { enableHighAccuracy:true, timeout:10000 })
}
export const updLoc = did => getLoc(c => { const d = donor(did); d.ll = c; d.llAt = Date.now(); commit(); toast('Live location updated.') })
export const clrLoc = did => { donor(did).ll = null; commit(); toast('Live location sharing stopped.') }
export function setCh(did, k, on) { const d = donor(did); d.ch = d.ch || { email:1, sms:1 }; d.ch[k] = on ? 1 : 0
  if (!d.ch.email && !d.ch.sms) { d.ch[k] = 1; toast('Keep at least one notification method.') } commit() }
