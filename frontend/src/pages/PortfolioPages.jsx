import { Link } from 'react-router-dom';
import { useState } from 'react';
import Page from '../components/Page.jsx';
import IcebergHero from '../features/iceberg/IcebergHero.jsx';
import JourneyContent from '../features/iceberg/JourneyContent.jsx';
import DepthGauge from '../features/iceberg/DepthGauge.jsx';
import { SCENE_TIERS } from '../features/iceberg/scene-policy.js';
export function Home() {
  const [sceneTier, setSceneTier] = useState(SCENE_TIERS.STATIC);
  return <section className="iceberg-journey" id="journey-intro"><div className="hero"><div className="hero-copy">
    <p className="eyebrow"><span className="surface-dot" aria-hidden="true" /> A little above. More beneath.</p>
    <h1><span>PAWAN</span> <span className="hero-surname">MENUKA</span></h1>
    <p className="credential-line"><strong><span>Software Engineering Undergraduate</span><span className="role-separator" aria-hidden="true">◆</span><span className="sr-only"> · </span><span>FULL-STACK</span><span className="role-separator" aria-hidden="true">◆</span><span className="sr-only"> · </span><span>SLIIT '27</span></strong></p>
    <p className="intro">Above the line: full-stack products you can click through. Below it: blockchain, then a CNC machine, then me. Scroll if you want the rest.</p>
    <div className="hero-entry"><a href="#journey-full-stack" className="descent-link"><span className="descent-arrow" aria-hidden="true">↓</span> Explore beneath the surface</a><Link to="/projects" className="all-work-link">All projects <span aria-hidden="true">↗</span></Link></div>
  </div><IcebergHero onTierChange={setSceneTier} /><DepthGauge tier={sceneTier} /><div className="surface-caption" aria-hidden="true"><span>THE SURFACE</span><span>There’s more beneath.</span></div></div><JourneyContent tier={sceneTier} /></section>;
}
export function NotFound() {
  return <Page number="404" title="Page not found"><p className="lead">That page isn’t here.</p><Link className="button" to="/">Return home →</Link></Page>;
}
