import { AV } from '../lib/config'
import { fmt, hosp } from '../lib/util'
import { status } from '../lib/matching'
import { useStore, user, donor, respond, apptSet, setAv, updLoc, clrLoc, setCh } from '../lib/store'
import { Opts, B } from '../components/ui'

export default function Donor() {
  const S = useStore(), d = donor(user().did), ch = d.ch || { email: 1, sms: 1 }
  const ms = S.matches.filter(m => m.did === d.id).map(m => ({ m, r: S.reqs.find(r => r.id === m.rid) })).filter(x => x.r && !x.r.cancel)
  const ap = S.appts.filter(a => a.did === d.id), ds = S.dons.filter(x => x.did === d.id), ns = S.notifs.filter(n => n.did === d.id).slice(0, 5)
  return <>
    <h2>Welcome, {d.name}</h2>
    <div className="grid"><div className="card"><div className="mut">Blood group</div><div className="big">{d.g}</div><div className="mut">{d.loc}</div></div>
      <div className="card"><div className="mut">Availability</div><label style={{ margin: '6px 0 0' }}><select value={d.av} onChange={e => setAv(d.id, e.target.value)} aria-label="Availability"><Opts a={AV} /></select></label></div></div>
    <div className="card"><h3>Live location</h3>
      <p className="mut">{d.ll ? 'Shared, updated ' + fmt(new Date(d.llAt).toISOString()) + '. Hospitals only see an approximate distance, never your coordinates.' : 'Not shared. Your selected area (' + d.loc + ') is used instead.'}</p>
      <button className="btn alt sm" onClick={() => updLoc(d.id)}>{d.ll ? 'Update' : 'Share'} my live location</button> {d.ll && <button className="btn alt sm" onClick={() => clrLoc(d.id)}>Stop sharing</button>}
      <h3 style={{ marginTop: 16 }}>Notify me by</h3>
      {[['email', 'Email'], ['sms', 'SMS']].map(([k, l]) => <label key={k} style={{ display: 'inline-block', margin: '0 16px 0 0' }}><input type="checkbox" style={{ width: 'auto', display: 'inline' }} checked={!!ch[k]} onChange={e => setCh(d.id, k, e.target.checked)} /> {l}</label>)}</div>
    <h2>Blood requests</h2>
    {ms.length ? ms.map(({ m, r }) => <div className="card req" key={r.id}>
      <div className="row" style={{ justifyContent: 'space-between' }}><B c={r.urg === 'Critical' ? 'red' : 'amber'}>{r.urg.toUpperCase()} REQUEST</B><span className="mut">{status(r)}</span></div>
      <div className="row" style={{ margin: '8px 0' }}><div className="big">{r.g}</div><div><b>{r.units} unit(s) needed</b><br />{hosp(r.hid).name}, {hosp(r.hid).loc}<br /><span className="mut">Needed by {fmt(r.by)}</span></div></div>
      {m.st === 'notified' ? <><button className="btn" onClick={() => respond(r.id, d.id, 'accepted')}>I can donate</button> <button className="btn alt" onClick={() => respond(r.id, d.id, 'declined')}>I'm not available</button></>
        : m.st === 'accepted' ? <p className="mut">Your response indicates that you are willing to donate. Final eligibility and suitability for donation will be determined by qualified blood-service personnel at the donation centre.</p>
        : <p className="mut">You declined this request.</p>}</div>)
      : <div className="card mut">No requests right now. Hospitals contact you here when your blood group is needed.</div>}
    <h2>Appointments</h2>
    {ap.length ? <div className="card tw"><table><thead><tr><th>Hospital</th><th>When</th><th>Status</th><th></th></tr></thead><tbody>
      {ap.map(a => <tr key={a.id}><td>{hosp(S.reqs.find(r => r.id === a.rid).hid).name}</td><td>{fmt(a.at)}</td><td><B>{a.st}</B></td>
        <td>{a.st === 'Pending' && <button className="btn sm" onClick={() => apptSet(a.id, 'Confirmed')}>Confirm</button>} {(a.st === 'Pending' || a.st === 'Confirmed') && <button className="btn alt sm" onClick={() => apptSet(a.id, 'Cancelled')}>Cancel</button>}</td></tr>)}</tbody></table></div>
      : <div className="card mut">No appointments yet. Accept a request and the hospital will propose a time.</div>}
    <h2>Donation history</h2>
    {ds.length ? <div className="card tw"><table><thead><tr><th>Date</th><th>Hospital</th><th>Blood group</th><th>Status</th></tr></thead><tbody>
      {ds.map(x => <tr key={x.id}><td>{fmt(x.at)}</td><td>{hosp(x.hid).name}</td><td>{x.g}</td><td>Completed</td></tr>)}</tbody></table>
      <p className="mut">Your next donation eligibility will be determined by qualified blood-service staff.</p></div>
      : <div className="card mut">No recorded donations yet.</div>}
    <h2>Notifications</h2>
    <div className="card">{ns.length ? ns.map((n, i) => <p key={i} style={{ margin: '0 0 8px' }}><B c={n.type === 'Critical' ? 'red' : n.type === 'Urgent' ? 'amber' : ''}>{n.type}</B> {n.text}<br /><span className="mut">{fmt(n.at)}</span></p>) : <span className="mut">No notifications yet.</span>}</div></>
}
