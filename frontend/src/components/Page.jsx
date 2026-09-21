export default function Page({ number, title, children, wide = false }) {
  return <section className={`content-page${wide ? ' content-page-wide' : ''}`}><p className="eyebrow">{number} / Portfolio</p><h1>{title}</h1><div className="page-body">{children}</div></section>;
}
