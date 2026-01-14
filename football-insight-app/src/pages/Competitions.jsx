import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Competitions() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    api.topCompetitions()
      .then((res) => mounted && setState({ loading: false, error: null, data: res }))
      .catch((e) => mounted && setState({ loading: false, error: e.message, data: null }));
    return () => { mounted = false; };
  }, []);

  const comps = state.data?.competitions ?? [];
  const source = state.data?.source;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return comps;
    return comps.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const area = (c.area ?? "").toLowerCase();
      const code = (c.code ?? "").toLowerCase();
      return name.includes(s) || area.includes(s) || code.includes(s);
    });
  }, [q, comps]);

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1 className="h1">Top competitions</h1>
          <div className="muted">Standings always available, cached for speed.</div>
        </div>
        <div className="pills">
          <span className="pill">{source ?? "—"}</span>
          <span className="pill subtle">Demo</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="searchIcon">⌕</span>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search competition, country or code…"
            aria-label="Search competitions"
          />
        </div>
        <div className="muted small">{filtered.length} results</div>
      </div>

      {state.loading && (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="row">
                <div className="sk skLogo" />
                <div className="grow">
                  <div className="sk skLine" />
                  <div className="sk skLine short" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.error && (
        <div className="card error">
          <div className="title">Couldn’t load competitions</div>
          <div className="muted">{state.error}</div>
        </div>
      )}

      {!state.loading && !state.error && (
        <div className="grid">
          {filtered.map((c) => (
            <Link key={c.code} to={`/competition/${c.code}`} className="card hover" onMouseEnter={() => {
  api.prefetchStandings(c.code);
  api.prefetchMatches7d(c.code);
}}
>
                
              <div className="row">
                <div className="logo">
                  {c.emblem ? <img src={c.emblem} alt="" /> : <div className="logoPh" />}
                </div>
                <div className="grow">
                  <div className="title">{c.name}</div>
                  <div className="sub">{c.area ?? "—"} • {c.code}</div>
                </div>
                <div className="chev">›</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
