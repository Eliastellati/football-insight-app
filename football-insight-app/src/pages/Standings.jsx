import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

function getTierConfig(tableLength) {
  // Heuristic “portfolio”: buona per leghe 18–20 e gironi da 4
  if (tableLength === 4) return { qualify: 2, europa: 0, releg: 0 };
  if (tableLength >= 18) return { qualify: 4, europa: 2, releg: 3 };
  if (tableLength >= 10) return { qualify: 2, europa: 1, releg: 2 };
  return { qualify: 1, europa: 0, releg: 1 };
}

function getRowTier(position, tableLength) {
  const cfg = getTierConfig(tableLength);
  if (cfg.qualify > 0 && position <= cfg.qualify) return "qualify";
  if (cfg.europa > 0 && position <= cfg.qualify + cfg.europa) return "europa";
  if (cfg.releg > 0 && position > tableLength - cfg.releg) return "releg";
  return null;
}

export default function Standings() {
  const { code } = useParams();

  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  const [tab, setTab] = useState("TOTAL");

  // Density toggle persistente
  const [density, setDensity] = useState(() => {
    return localStorage.getItem("fi_density") || "comfortable";
  });

  useEffect(() => {
    localStorage.setItem("fi_density", density);
  }, [density]);

  useEffect(() => {
    let mounted = true;

    setState({ loading: true, error: null, data: null });

    api
      .standings(code)
      .then((res) => {
        if (!mounted) return;
        setState({ loading: false, error: null, data: res });
      })
      .catch((e) => {
        if (!mounted) return;
        setState({ loading: false, error: e.message, data: null });
      });

    return () => {
      mounted = false;
    };
  }, [code]);

  const view = useMemo(() => {
    const payload = state.data; // { source, data }
    const data = payload?.data;

    const standingsArr = data?.standings ?? [];

    const availableTabs = ["TOTAL", "HOME", "AWAY"].filter((t) =>
      standingsArr.some((s) => s.type === t)
    );

    const chosenTab = availableTabs.includes(tab)
      ? tab
      : availableTabs[0] ?? standingsArr[0]?.type ?? "TOTAL";

    const block = standingsArr.find((s) => s.type === chosenTab) ?? standingsArr[0];
    const table = block?.table ?? [];

    return {
      source: payload?.source ?? null,
      competitionName: data?.competition?.name ?? String(code || "").toUpperCase(),
      season:
        data?.season?.startDate && data?.season?.endDate
          ? `${data.season.startDate.slice(0, 4)}/${data.season.endDate.slice(0, 4)}`
          : null,
      availableTabs,
      chosenTab,
      table,
      cfg: getTierConfig(table.length),
    };
  }, [state.data, tab, code]);

  const densityClass = density === "compact" ? "density-compact" : "density-comfy";

  return (
    <div className={`stack ${densityClass}`}>
      {/* Back + pills */}
      <div className="row space">
        <Link className="link" to="/">
          ← Back
        </Link>

        <div className="pills">
          {view.source ? <span className="pill">{view.source}</span> : null}

          <button
            type="button"
            className="pill pillBtn"
            onClick={() =>
              setDensity((d) => (d === "compact" ? "comfortable" : "compact"))
            }
            title="Toggle density"
          >
            {density === "compact" ? "Compact" : "Comfortable"}
          </button>
        </div>
      </div>

      {/* Subnav Standings / Matches */}
      <div className="row space">
        <div className="subnav">
          <span className="chip chipActive">Standings</span>
          <Link className="chip" to={`/competition/${code}/matches`}>
            Matches
          </Link>
        </div>
      </div>

      {/* Loading / Error */}
      {state.loading && (
        <div className="card">
          <div className="sk skLine" />
          <div className="sk skLine short" style={{ marginTop: 10 }} />
        </div>
      )}

      {state.error && (
        <div className="card error">
          <div className="title">Couldn’t load standings</div>
          <div className="muted">{state.error}</div>
        </div>
      )}

      {!state.loading && !state.error && (
        <>
          {/* Header */}
          <div className="hero">
            <div>
              <h1 className="h1">
                {view.competitionName} <span className="muted">({code})</span>
              </h1>

              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                {view.season ? <div className="muted">Season {view.season}</div> : null}

                <div className="legend">
                  {view.cfg.qualify > 0 ? (
                    <span className="legendItem">
                      <span className="dot qualify" /> Qualify
                    </span>
                  ) : null}
                  {view.cfg.europa > 0 ? (
                    <span className="legendItem">
                      <span className="dot europa" /> Europe
                    </span>
                  ) : null}
                  {view.cfg.releg > 0 ? (
                    <span className="legendItem">
                      <span className="dot releg" /> Relegation
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {view.availableTabs.length > 1 ? (
              <div className="tabs">
                {view.availableTabs.map((t) => (
                  <button
                    key={t}
                    className={`tab ${view.chosenTab === t ? "active" : ""}`}
                    onClick={() => setTab(t)}
                    type="button"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Empty state */}
          {view.table.length === 0 ? (
            <div className="card">
              <div className="title">No standings available</div>
              <div className="muted">Try another competition.</div>
            </div>
          ) : (
            <div className="card">
              <div className="tableWrap">
                <table className="table">
                  {/* ✅ colgroup = header/body sempre allineati */}
                  <colgroup>
                    <col className="col-pos" />
                    <col className="col-team" />
                    <col className="col-num" />
                    <col className="col-num" />
                    <col className="col-num" />
                    <col className="col-num" />
                    <col className="col-num" />
                    <col className="col-pts" />
                  </colgroup>

                  <thead>
                    <tr>
                      <th className="pos">#</th>
                      <th>Team</th>
                      <th className="num">P</th>
                      <th className="num">W</th>
                      <th className="num">D</th>
                      <th className="num">L</th>
                      <th className="num">GD</th>
                      <th className="num">Pts</th>
                    </tr>
                  </thead>

                  <tbody>
                    {view.table.map((r) => {
                      const tier = getRowTier(r.position, view.table.length);
                      const rowClass = tier ? `hl-${tier}` : "";

                      return (
                        <tr
                          key={r.team?.id ?? `${r.position}-${r.team?.name}`}
                          className={rowClass}
                        >
                          <td className="pos muted">{r.position}</td>

                          <td>
                            <div className="team">
                            {r.team?.crest ? (
                              <img className="crest" src={r.team.crest} alt="" />
                            ) : null}

                            {r.team?.id ? (
                              <Link className="teamLink" to={`/team/${r.team.id}`}>
                                {r.team?.shortName ?? r.team?.name ?? "—"}
                              </Link>
                            ) : (
                              <span>{r.team?.shortName ?? r.team?.name ?? "—"}</span>
                            )}
                            </div>
                          </td>

                          <td className="num">{r.playedGames}</td>
                          <td className="num">{r.won}</td>
                          <td className="num">{r.draw}</td>
                          <td className="num">{r.lost}</td>
                          <td className="num">{r.goalDifference}</td>
                          <td className="num strong">{r.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
