import { LOC, W, TH, compat } from './config'
import { S } from './store'
import { hosp } from './util'

export function haversine(a, b) { const R = 6371, t = x => x * Math.PI / 180, dl = t(b[0]-a[0]), dn = t(b[1]-a[1])
  const h = Math.sin(dl/2)**2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dn/2)**2; return 2 * R * Math.asin(Math.sqrt(h)) }
export const pos = d => d.ll && Date.now() - d.llAt < 864e5 ? d.ll : LOC[d.loc] // live location only if under 24h old
const answered = d => S.matches.filter(m => m.did === d.id && (m.st === 'accepted' || m.st === 'declined'))
export const rr = d => { const a = answered(d); return a.length ? a.filter(m => m.st === 'accepted').length / a.length : .5 }
export const rrTxt = d => answered(d).length ? Math.round(rr(d) * 100) + '%' : 'New'

// Donor-contact prioritization score: blood group 40, availability 30, proximity 20, response history 10.
export function rank(req) {
  const hl = LOC[hosp(req.hid).loc]
  return S.donors.filter(d => compat(req.g).includes(d.g) && d.av !== 'Do Not Contact').map(d => {
    const p = pos(d), dist = haversine(p, hl)
    const av = d.av === 'Available' ? 1 : d.av === 'Emergency Only' ? (req.urg === 'Routine' ? .3 : .8) : .1
    const score = Math.round(100 * (W.bg + W.av * av + W.px * Math.max(0, 1 - dist/50) + W.rr * rr(d)))
    const m = S.matches.find(m => m.rid === req.id && m.did === d.id)
    return { d, dist, score, live: p === d.ll, st: m?.st || '' }
  })
}
export const sortRows = (rows, s) => rows.sort((a, b) => s === 'dist' ? a.dist - b.dist : s === 'rr' ? rr(b.d) - rr(a.d)
  : s === 'avail' ? (a.d.av === 'Available' ? 0 : 1) - (b.d.av === 'Available' ? 0 : 1) || b.score - a.score : b.score - a.score)
export const donated = r => S.dons.filter(x => x.rid === r.id).length
export function status(r) { if (r.cancel) return 'Cancelled'; const n = donated(r); if (n >= r.units) return 'Fulfilled'; if (n > 0) return 'Partially Fulfilled'
  if (new Date(r.by) < new Date()) return 'Expired'; return S.matches.some(m => m.rid === r.id) ? 'Recruiting' : 'Open' }
export const stockSt = n => n >= TH.normal ? ['Normal','green'] : n >= TH.low ? ['Low','amber'] : ['Critical','red']
