// Everything configurable lives here.
export const G = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
export const LOC = { Banjul:[13.4549,-16.579], Serrekunda:[13.4383,-16.6781], Bakau:[13.4784,-16.6819], Brikama:[13.2714,-16.6494], Gunjur:[13.2,-16.7333], Farafenni:[13.5667,-15.6] }
export const HOS = [
  { id:'h1', name:'Edward Francis Small Teaching Hospital', loc:'Banjul' },
  { id:'h2', name:'Kanifing General Hospital', loc:'Serrekunda' },
  { id:'h3', name:'Bundung Maternal and Child Hospital', loc:'Serrekunda' },
]
export const AV = ['Available','Emergency Only','Temporarily Unavailable','Do Not Contact']
export const W = { bg:.4, av:.3, px:.2, rr:.1 }      // donor-contact prioritization weights (not medical eligibility)
export const TH = { normal:10, low:3 }                // example stock thresholds, not medical standards
export const compat = g => [g]                        // blood-group rule: set by the blood service
export const CARRIERS = { '87':'Africell', '83':'QCell', '86':'Comium' } // 9-digit phone rule: confirm with operators
