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
          control="props"
          animate={reduced ? "off" : "on"}
          axesHelper="off"
          brightness={0.9}
          cAzimuthAngle={130}
          cDistance={4.2}
          cPolarAngle={101}
          cameraZoom={1}
          color1="#380000"
          color2="#8cba8d"
          color3="#59714d"
          envPreset="city"
          frameRate={10}
          gizmoHelper="hide"
          grain="on"
          lightType="3d"
          positionX={-1.4}
          positionY={-1.4}
          positionZ={0.9}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={10}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="waterPlane"
          uAmplitude={1}
          uDensity={1.2}
          uFrequency={5.5}
          uSpeed={0}
          uStrength={8.8}
          uTime={0}
          wireframe={false}
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
