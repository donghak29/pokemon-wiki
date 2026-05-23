import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Pokedex from "./pages/Pokedex";
import TypeChart from "./pages/TypeChart";
import TypeCalculator from "./pages/TypeCalculator";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">POKÉWIKI</span>
          </div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              도감
            </NavLink>
            <NavLink to="/type-chart" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              타입 상성표
            </NavLink>
            <NavLink to="/type-calculator" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              포켓몬 퀴즈 
            </NavLink>
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Pokedex />} />
            <Route path="/type-chart" element={<TypeChart />} />
            <Route path="/type-calculator" element={<TypeCalculator />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Data provided by <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a> &nbsp;|&nbsp; Made by 탁동학 &nbsp;<a href="https://instagram.com/donghak_t" target="_blank" rel="noreferrer">@donghak_t</a></p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;