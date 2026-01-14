import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

class ShaderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("ShaderGradient crashed:", err);
  }
  render() {
    if (this.state.failed) return null; // se crasha, niente shader ma UI ok
    return this.props.children;
  }
}

function HomeShader() {
  // evita qualunque roba “window” che può crashare
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mobile =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 720px)").matches;

  const pixelDensity = mobile ? 1.0 : 1.4; // più leggero, free-friendly

  return (
    <div className="homeShader" aria-hidden="true">
      <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }} pixelDensity={pixelDensity} fov={20}>
       <ShaderGradient
  animate="off"
  axesHelper="on"
  bgColor1="#000000"
  bgColor2="#000000"
  brightness={0.8}
  cAzimuthAngle={180}
  cDistance={2.9}
  cPolarAngle={115}
  cameraZoom={1}
  color1="#33256b"
  color2="#9589fe"
  color3="#000000"
  destination="onCanvas"
  embedMode="off"
  envPreset="city"
  format="gif"
  fov={45}
  frameRate={10}
  gizmoHelper="hide"
  grain="on"
  lightType="3d"
  pixelDensity={1}
  positionX={-0.5}
  positionY={0.1}
  positionZ={0}
  range="disabled"
  rangeEnd={40}
  rangeStart={0}
  reflection={0.1}
  rotationX={0}
  rotationY={0}
  rotationZ={235}
  shader="defaults"
  type="waterPlane"
  uAmplitude={0}
  uDensity={1.1}
  uFrequency={5.5}
  uSpeed={0.1}
  uStrength={2.4}
  uTime={0.2}
  wireframe={false}
  zoomOut={false}
/>
      </ShaderGradientCanvas>

      <div className="homeShaderVignette" />
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    document.body.classList.add("is-home");
    return () => document.body.classList.remove("is-home");
  }, []);

  return (
    <div className="home">
      {/* se shader crasha, non blocca la pagina */}
      <ShaderErrorBoundary>
        <HomeShader />
      </ShaderErrorBoundary>

      <div className="homeCard">
        <div className="homeBadge">Demo • Cached • Football-data</div>

        <h1 className="homeTitle">
          PitchLens
          <span className="homeTitleSub">Standings & matches, always available.</span>
        </h1>

        <p className="homeText">
          A clean, fast football dashboard with caching and rate limiting — built as a portfolio demo.
        </p>

        <div className="homeActions">
          <Link to="/leagues" className="btnPrimary">
            Check Main Leagues
          </Link>

          <a className="btnGhost" href="https://www.football-data.org/" target="_blank" rel="noreferrer">
            Data source
          </a>
        </div>

        <div className="homeMeta">
          <div className="homeMetaItem"><span className="dotMini" /> Aggressive caching</div>
          <div className="homeMetaItem"><span className="dotMini" /> Rate limited API</div>
          <div className="homeMetaItem"><span className="dotMini" /> Mobile friendly</div>
        </div>
      </div>
    </div>
  );
}
