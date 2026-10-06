export const Opts = ({ a }) => a.map(x => <option key={x}>{x}</option>)
export const B = ({ c = '', children }) => <span className={'b ' + c}>{children}</span>
export const Box = ({ children }) => <div className="card" style={{ maxWidth: 520, margin: '20px auto' }}>{children}</div>
