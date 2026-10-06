// @vitest-environment jsdom
import { test, expect } from 'vitest'
import * as st from '../src/lib/store'
import { rank, status } from '../src/lib/matching'
const base = { role:'donor', name:'Awa', email:'awa@x.com', pw:'password1', pw2:'password1', ph:'871234567', g:'O+', loc:'Brikama', av:'Available', ce:true, cs:true, consent:true, hos:'h1', ll:null }
test('signup, verify, request, notify, accept, appointment, donation, fulfilled', async () => {
  expect(await st.signup({ ...base, ph:'123456789' })).toBe(false)
  expect(await st.signup(base)).toBe(true)
  expect(st.verify('000000')).toBe(false)
  expect(st.verify(st.pending().code)).toBe(true)
  const did = st.user().did; st.logout()
  expect(await st.signup({ ...base, role:'hospital', name:'Staff', email:'h@x.com' })).toBe(true)
  st.verify(st.pending().code)
  const rid = st.createReq('h1', { g:'O+', units:1, urg:'Critical', by:'2099-01-01T10:00', msg:'' })
  expect(rank(st.S.reqs[0]).length).toBe(1)
  st.notifyDonors(rid, [did]); st.notifyDonors(rid, [did])
  expect(st.S.outbox.filter(m => m.rid).length).toBe(2)
  st.respond(rid, did, 'accepted'); st.schedule(rid, did, '2099-01-01T09:00')
  const a = st.S.appts[0]; st.apptSet(a.id, 'Confirmed'); st.apptSet(a.id, 'Completed')
  expect(status(st.S.reqs[0])).toBe('Fulfilled')
})
