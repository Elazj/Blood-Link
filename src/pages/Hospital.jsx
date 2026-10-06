import { useState } from 'react'
import { G, TH } from '../lib/config'
import { fmt, mask, hosp } from '../lib/util'
import { rank, sortRows, status, donated, rrTxt, stockSt } from '../lib/matching'
import { useStore, user, donor, createReq, notifyDonors, schedule, apptSet, cancelReq, stock } from '../lib/store'
import { Opts, B } from '../components/ui'

function NewReq({ hid, pre, go }) {
  const d = new Date(Date.now() + 4 * 36e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
  const [f, setF] = useState({ g: pre, units: 2, urg: 'Critical', by: d, msg: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  return <div className="card"><h2>Create blood request</h2><div className="grid">
    <label>Blood group<select value={f.g} onChange={set('g')}><Opts a={G} /></select></label>
    <label>Units required<input type="number" min="1" max="20" value={f.units} onChange={set('units')} /></label>
    <label>Urgency<select value={f.urg} onChange={set('urg')}><Opts a={['Routine', 'Urgent', 'Critical']} /></select></label>
    <label>Required by<input type="datetime-local" value={f.by} onChange={set('by')} /></label></div>
    <label>Additional message<input maxLength={140} placeholder="Optional, e.g. Emergency blood requirement" value={f.msg} onChange={set('msg')} /></label>
    <button className="btn" onClick={() => { const id = createReq(hid, f); if (id) go(id) }}>Create request and find donors</button></div>
}

function Act({ r, x }) {
  const S = useStore(), [t, setT] = useState('')
  const a = S.appts.find(a => a.rid === r.id && a.did === x.d.id && a.st !== 'Cancelled')
  if (x.st === 'accepted' && !a) return <><input type="datetime-local" value={t} onChange={e => setT(e.target.value)} style={{ width: 'auto', display: 'inline-block' }} /> <button className="btn sm" onClick={() => schedule(r.id, x.d.id, t)}>Schedule</button></>
  if (!a) return null
  return <><B>{a.st} {fmt(a.at)}</B> {a.st === 'Pending' && <button className="btn alt sm" onClick={() => apptSet(a.id, 'Confirmed')}>Mark confirmed</button>}
    {a.st === 'Confirmed' && <><button className="btn sm" onClick={() => apptSet(a.id, 'Completed')}>Record donation</button> <button className="btn alt sm" onClick={() => apptSet(a.id, 'No Show')}>No show</button></>}</>
}

function Requests({ reqs, sel, setSel }) {
  const S = useStore(), [sort, setSort] = useState('score'), [pick, setPick] = useState([])
  const r = reqs.find(x => x.id === sel) || reqs[0]
  if (!r) return <div className="card"><h2>No requests yet</h2><p>Create a blood request to see ranked potential donors.</p></div>
  const st = status(r), shown = sortRows(rank(r), sort).slice(0, 25), free = shown.filter(x => !x.st).map(x => x.d.id), ids = pick.filter(i => free.includes(i))
  const acc = S.matches.filter(m => m.rid === r.id && m.st === 'accepted').length
  const tog = id => setPick(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  return <>
    <div className="card"><div className="row" style={{ justifyContent: 'space-between' }}>
      <label style={{ margin: 0 }}>Request<select value={r.id} onChange={e => { setSel(e.target.value); setPick([]) }}>{reqs.map(q => <option key={q.id} value={q.id}>{q.id} | {q.g} | {status(q)}</option>)}</select></label>
      <B c={r.urg === 'Critical' ? 'red' : r.urg === 'Urgent' ? 'amber' : ''}>{r.urg}</B></div>
      <div className="row" style={{ marginTop: 12 }}><div className="big">{r.g}</div><div><b>{r.units} unit(s)</b> at {hosp(r.hid).name}<br /><span className="mut">Needed by {fmt(r.by)}{r.msg && ' | ' + r.msg}</span></div></div>
      <p className="row"><B c={st === 'Fulfilled' ? 'green' : st === 'Cancelled' || st === 'Expired' ? 'red' : 'amber'}>{st}</B><B c="green">{acc} donor(s) accepted</B><B>{donated(r)}/{r.units} donated</B>
        {(st === 'Open' || st === 'Recruiting') && <button className="btn alt sm" onClick={() => cancelReq(r.id)}>Cancel request</button>}</p></div>
    <div className="card"><div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>Potential donors ({shown.length})</h2>
      <label style={{ margin: 0 }}>Sort by<select value={sort} onChange={e => setSort(e.target.value)}>{[['score', 'Highest match score'], ['dist', 'Nearest donor'], ['avail', 'Available donors'], ['rr', 'Best response history']].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
      {shown.length ? <>
        <div className="tw"><table><thead><tr><th><input type="checkbox" style={{ width: 'auto' }} aria-label="Select all volunteers" checked={free.length > 0 && ids.length === free.length} onChange={e => setPick(e.target.checked ? free : [])} /></th><th>Donor</th><th>Area</th><th>Availability</th><th>Distance</th><th>Score</th><th>Response rate</th><th>Status</th></tr></thead><tbody>
          {shown.map(x => <tr key={x.d.id}><td><input type="checkbox" style={{ width: 'auto' }} disabled={!!x.st} checked={ids.includes(x.d.id)} onChange={() => tog(x.d.id)} aria-label={'Select ' + x.d.name} /></td>
            <td>{x.d.name}</td><td>{x.d.loc}</td><td>{x.d.av}</td><td>{x.dist.toFixed(0)} km{x.live ? ' (live)' : ''}</td><td><b>{x.score}</b></td><td>{rrTxt(x.d)}</td>
            <td>{x.st ? <B c={x.st === 'accepted' ? 'green' : x.st === 'declined' ? '' : 'amber'}>{x.st}</B> : <span className="mut">Not contacted</span>} <Act r={r} x={x} /></td></tr>)}</tbody></table></div>
        <p className="mut">Tick the volunteers you want to contact, then press the button. Nobody is notified unless ticked.</p>
        <p className="row"><button className="btn" disabled={!ids.length} onClick={() => { notifyDonors(r.id, ids); setPick([]) }}>Notify volunteers ({ids.length} selected)</button>
          <button className="btn alt" onClick={() => setPick(free.slice(0, 5))}>Tick top 5</button></p></>
        : <p>No registered donors with this blood group yet. Donors appear here after they sign up as volunteers.</p>}</div></>
}

function Inventory({ hid, recruit }) {
  const S = useStore()
  return <div className="card"><h2>Blood inventory</h2><div className="tw"><table><thead><tr><th>Group</th><th>Units</th><th>Status</th><th>Adjust</th><th></th></tr></thead><tbody>
    {G.map(g => { const n = S.inv[hid][g], [l, c] = stockSt(n)
      return <tr key={g}><td><b>{g}</b></td><td>{n}</td><td><B c={c}>{l}</B></td>
        <td><button className="btn alt sm" onClick={() => stock(hid, g, -1)} aria-label={'Remove one unit of ' + g}>-1</button> <button className="btn alt sm" onClick={() => stock(hid, g, 1)} aria-label={'Add one unit of ' + g}>+1</button></td>
        <td>{n < TH.normal && <button className="btn sm" onClick={() => recruit(g)}>Create donor recruitment request</button>}</td></tr> })}</tbody></table></div>
    <p className="mut">Thresholds (Normal {TH.normal}+, Low {TH.low}-{TH.normal - 1}, Critical below {TH.low}) are configurable examples, not medical standards.</p></div>
}

function Log({ hid }) {
  const S = useStore(), lg = S.outbox.filter(m => m.hid === hid && m.rid)
  return <div className="card"><h2>Delivery log</h2>
    {lg.length ? <div className="tw"><table><thead><tr><th>Time</th><th>Request</th><th>Donor</th><th>Channel</th><th>To</th><th>Status</th></tr></thead><tbody>
      {lg.map(m => <tr key={m.id}><td>{fmt(m.at)}</td><td>{m.rid}</td><td>{donor(m.did)?.name}</td><td>{m.ch === 'sms' ? 'SMS' : 'Email'}</td><td>{mask(m.ch, m.to)}</td><td><B c="amber">{m.st}</B></td></tr>)}</tbody></table></div>
      : <p className="mut">No messages yet. They appear here when you notify donors.</p>}
    <p className="mut">Contact details are masked. Prototype: messages are queued, not delivered. Real email and SMS need a server and a provider.</p></div>
}

export default function Hospital() {
  const S = useStore(), u = user(), reqs = S.reqs.filter(r => r.hid === u.hid)
  const [tab, setTab] = useState('new'), [sel, setSel] = useState(null), [pre, setPre] = useState('O+')
  const low = G.filter(g => stockSt(S.inv[u.hid][g])[0] === 'Critical')
  const recruit = g => { setPre(g); setTab('new') }
  return <><h2>{hosp(u.hid).name}</h2>
    {low.length > 0 && <div className="notice" style={{ background: 'var(--redbg)', color: 'var(--red)' }}><b>Low blood stock:</b> {low.join(', ')} critically low. <button className="btn sm" onClick={() => recruit(low[0])}>Create donor recruitment request</button></div>}
    <div className="tabs">{[['new', 'Create request'], ['req', `Requests (${reqs.length})`], ['inv', 'Inventory'], ['log', 'Delivery log']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'new' && <NewReq key={pre} hid={u.hid} pre={pre} go={id => { setSel(id); setTab('req') }} />}
    {tab === 'req' && <Requests reqs={reqs} sel={sel} setSel={setSel} />}
    {tab === 'inv' && <Inventory hid={u.hid} recruit={recruit} />}
    {tab === 'log' && <Log hid={u.hid} />}</>
}
