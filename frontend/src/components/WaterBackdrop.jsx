/**
 * Fixed water gradient, drifting caustic light and a few rising motes.
 * Purely decorative; no layout impact.
 */
export default function WaterBackdrop({ lightX = '50%', motes = 3 }) {
  const seeds = [
    { left: '18%', size: 2.5, dur: 27, delay: 0 },
    { left: '58%', size: 1.5, dur: 35, delay: 9 },
    { left: '86%', size: 3, dur: 30, delay: 16 },
    { left: '34%', size: 2, dur: 32, delay: 22 },
  ].slice(0, motes);

  return (
    <>
      <div className="pm-backdrop" aria-hidden="true" style={{ '--pm-light-x': lightX }}>
        <span className="pm-grad" />
        <span className="pm-caustic" />
        <span className="pm-vignette" />
      </div>
      {seeds.map((m, i) => (
        <span
          key={i}
          className="pm-mote"
          aria-hidden="true"
          style={{
            left: m.left,
            width: m.size + 'px',
            height: m.size + 'px',
            animationDuration: m.dur + 's',
            animationDelay: m.delay + 's',
          }}
        />
      ))}
    </>
  );
}
