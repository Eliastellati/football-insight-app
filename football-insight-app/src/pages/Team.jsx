import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

function yyyyMmDd(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatDT(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}
function score(m) {
  const ft = m?.score?.fullTime;
  if (ft?.home == null || ft?.away == null) return "–";
  return `${ft.home} – ${ft.away}`;
}

export default function Team() {
  const { id } = useParams();

  const [state, setState] = useState({
    loading: true,
    error: null,
    team: null,
    upcoming: null,
    recent: null,
    source: null,
  });

  useEffect(() => {
    let mounted = true;

    const now = new Date();
    const fromUpcoming = yyyyMmDd(now);
    const toUpcoming = yyyyMmDd(addDays(now, 30)); // ✅ prossimi 30 giorni

    const fromRecent = yyyyMmDd(addDays(now, -60)); // ✅ ultimi 60 giorni
    const toRecent = yyyyMmDd(now);

    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      api.team(id),
      // chiedo più match (es. 50) e poi scelgo i 5 più vicini lato client
      api.teamMatches(id, { status: "SCHEDULED,TIMED", from: fromUpcoming, to: toUpcoming, limit: 50 }),
      api.teamMatches(id, { status: "FINISHED", from: fromRecent, to: toRecent, limit: 50 }),
    ])
      .then(([teamRes, upRes, recRes]) => {
        if (!mounted) return;
        setState({
          loading: false,
          error: null,
          team: teamRes.data,
          upcoming: upRes.data,
          recent: recRes.data,
          source: teamRes.source,
        });
      })
      .catch((e) => {
        if (!mounted) return;
        setState((s) => ({ ...s, loading: false, error: e.message }));
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const t = state.team;

  // ✅ Ordino e scelgo solo i match che iniziano da "adesso" in avanti
  const upcoming = useMemo(() => {
    const list = state.upcoming?.matches ?? [];
    const nowTs = Date.now();
    return list
      .filter((m) => m.utcDate && new Date(m.utcDate).getTime() >= nowTs)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 5);
  }, [state.upcoming]);

  // ✅ Ordino i recent dal più nuovo al più vecchio e ne prendo 5
  const recent = useMemo(() => {
    const list = state.recent?.matches ?? [];
    return list
      .filter((m) => m.utcDate)
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5);
  }, [state.recent]);

  return (
    <div className="stack">
      <div className="row space">
        <Link className="link" to="/">← Back</Link>
        {state.source ? <span className="pill">{state.source}</span> : null}
      </div>

      {state.loading && (
        <div className="card">
          <div className="sk skLine" />
          <div className="sk skLine short" style={{ marginTop: 10 }} />
        </div>
      )}

      {state.error && (
        <div className="card error">
          <div className="title">Couldn’t load team</div>
          <div className="muted">{state.error}</div>
        </div>
      )}

      {!state.loading && !state.error && t && (
        <>
          <div className="card teamHero">
            <div className="teamHeroTop">
              <div className="teamBadge">
                {t.crest ? <img src={t.crest} alt="" /> : <div className="logoPh" />}
              </div>
              <div className="grow">
                <div className="teamName">{t.shortName ?? t.name}</div>
                <div className="muted">
                  {t.area?.name ?? "—"} • {t.tla ?? "—"} {t.venue ? `• ${t.venue}` : ""}
                </div>
              </div>
            </div>
          </div>

          <div className="grid2">
            <div className="card">
              <div className="row space">
                <div className="title">Upcoming</div>
                <div className="muted small">Next 30 days • 5 closest</div>
              </div>

              {upcoming.length === 0 ? (
                <div className="muted" style={{ marginTop: 10 }}>No upcoming matches in the next 30 days.</div>
              ) : (
                <div className="matchList compact">
                  {upcoming.map((m) => (
                    <div key={m.id} className="matchRow">
                      <div className="matchTime">{formatDT(m.utcDate)}</div>
                      <div className="matchTeams">
                        <span className="teamText">{m.homeTeam?.shortName ?? m.homeTeam?.name}</span>
                        <span className="vs">vs</span>
                        <span className="teamText">{m.awayTeam?.shortName ?? m.awayTeam?.name}</span>
                      </div>
                      <div className={`statusBadge status-${m.status}`}>{m.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="row space">
                <div className="title">Recent</div>
                <div className="muted small">Last 60 days • 5 latest</div>
              </div>

              {recent.length === 0 ? (
                <div className="muted" style={{ marginTop: 10 }}>No recent matches.</div>
              ) : (
                <div className="matchList compact">
                  {recent.map((m) => (
                    <div key={m.id} className="matchRow">
                      <div className="matchTime">{formatDT(m.utcDate)}</div>
                      <div className="matchTeams">
                        <span className="teamText">{m.homeTeam?.shortName ?? m.homeTeam?.name}</span>
                        <span className="vs">vs</span>
                        <span className="teamText">{m.awayTeam?.shortName ?? m.awayTeam?.name}</span>
                      </div>
                      <div className="matchScore">{score(m)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
