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

function formatDateHeader(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function scoreLabel(m) {
  const ft = m?.score?.fullTime;
  const ht = m?.score?.halfTime;
  if (m.status === "FINISHED" || m.status === "IN_PLAY" || m.status === "PAUSED") {
    const a = ft?.home ?? "-";
    const b = ft?.away ?? "-";
    // se IN_PLAY e ft null, prova ht
    if ((a === "-" || b === "-") && (ht?.home != null || ht?.away != null)) {
      return `${ht.home ?? "-"} – ${ht.away ?? "-"}`;
    }
    return `${a} – ${b}`;
  }
  return "–";
}

export default function Matches() {
  const { code } = useParams();

  const [range, setRange] = useState("7d"); // today, 7d, 30d
  const [status, setStatus] = useState("ALL"); // ALL, SCHEDULED, LIVE, FINISHED
  const [state, setState] = useState({ loading: true, error: null, payload: null });

  const params = useMemo(() => {
    const today = new Date();
    const from = yyyyMmDd(today);
    const to =
      range === "today" ? yyyyMmDd(today)
      : range === "30d" ? yyyyMmDd(addDays(today, 30))
      : yyyyMmDd(addDays(today, 7));

    let statusParam = null;
    if (status === "SCHEDULED") statusParam = "SCHEDULED,TIMED";
    if (status === "LIVE") statusParam = "IN_PLAY,PAUSED";
    if (status === "FINISHED") statusParam = "FINISHED";

    return { from, to, status: statusParam, limit: 120 };
  }, [range, status]);

  useEffect(() => {
    let mounted = true;
    setState({ loading: true, error: null, payload: null });

    api.competitionMatches(code, params)
      .then((res) => mounted && setState({ loading: false, error: null, payload: res }))
      .catch((e) => mounted && setState({ loading: false, error: e.message, payload: null }));

    return () => { mounted = false; };
  }, [code, params]);

  const data = state.payload?.data;
  const source = state.payload?.source;

  const grouped = useMemo(() => {
    const matches = data?.matches ?? [];
    const map = new Map();
    for (const m of matches) {
      const day = (m.utcDate || "").slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(m);
    }
    const days = Array.from(map.keys()).sort();
    return days.map((d) => ({ day: d, matches: map.get(d) }));
  }, [data]);

  return (
    <div className="stack">
      <div className="row space">
        <div className="subnav">
          <Link className="chip" to={`/competition/${code}`}>Standings</Link>
          <span className="chip chipActive">Matches</span>
        </div>
        {source ? <span className="pill">{source}</span> : null}
      </div>

      <div className="hero">
        <div>
          <h1 className="h1">{data?.competition?.name ?? code} <span className="muted">({code})</span></h1>
          <div className="muted">Fixtures & results in the selected range.</div>
        </div>
      </div>

      <div className="filters">
        <div className="subnav">
          <button className={`chip ${range==="today"?"chipActive":""}`} onClick={() => setRange("today")}>Today</button>
          <button className={`chip ${range==="7d"?"chipActive":""}`} onClick={() => setRange("7d")}>Next 7 days</button>
          <button className={`chip ${range==="30d"?"chipActive":""}`} onClick={() => setRange("30d")}>Next 30 days</button>
        </div>

        <div className="subnav">
          <button className={`chip ${status==="ALL"?"chipActive":""}`} onClick={() => setStatus("ALL")}>All</button>
          <button className={`chip ${status==="SCHEDULED"?"chipActive":""}`} onClick={() => setStatus("SCHEDULED")}>Scheduled</button>
          <button className={`chip ${status==="LIVE"?"chipActive":""}`} onClick={() => setStatus("LIVE")}>Live</button>
          <button className={`chip ${status==="FINISHED"?"chipActive":""}`} onClick={() => setStatus("FINISHED")}>Finished</button>
        </div>
      </div>

      {state.loading && (
        <div className="card">
          <div className="sk skLine" />
          <div className="sk skLine short" style={{ marginTop: 10 }} />
        </div>
      )}

      {state.error && (
        <div className="card error">
          <div className="title">Couldn’t load matches</div>
          <div className="muted">{state.error}</div>
        </div>
      )}

      {!state.loading && !state.error && (
        <div className="stack">
          {grouped.length === 0 ? (
            <div className="card">
              <div className="title">No matches in this range</div>
              <div className="muted">Try another range or filter.</div>
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.day} className="dayBlock">
                <div className="dayHeader">{formatDateHeader(g.day)}</div>
                <div className="matchList">
                  {g.matches.map((m) => (
                    <div key={m.id} className="matchRow">
                      <div className="matchTime">{formatTime(m.utcDate)}</div>

                      <div className="matchTeams">
                        <Link className="teamLink" to={`/team/${m.homeTeam?.id}`}>{m.homeTeam?.shortName ?? m.homeTeam?.name}</Link>
                        <span className="vs">vs</span>
                        <Link className="teamLink" to={`/team/${m.awayTeam?.id}`}>{m.awayTeam?.shortName ?? m.awayTeam?.name}</Link>
                      </div>

                      <div className="matchScore">{scoreLabel(m)}</div>
                      <div className={`statusBadge status-${m.status || "UNK"}`}>{m.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
