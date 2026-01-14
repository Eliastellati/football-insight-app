import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Competitions from "./pages/Competitions.jsx";
import Standings from "./pages/Standings.jsx";
import Matches from "./pages/Matches.jsx";
import Team from "./pages/Team.jsx";


export default function App() {
  return (
    <div className="wrap">
      <header className="topbar">
        <Link to="/" className="brand">
          PitchLens
        </Link>
        <div className="hint">Live data • Cached • Demo</div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leagues" element={<Competitions />} />
          <Route path="/competition/:code" element={<Standings />} />
          <Route path="/competition/:code/matches" element={<Matches />} />
          <Route path="/team/:id" element={<Team />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Data: football-data.org</span>
      </footer>
    </div>
  );
}
