import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_KO = {
  normal: "노말", fire: "불꽃", water: "물", electric: "전기",
  grass: "풀", ice: "얼음", fighting: "격투", poison: "독",
  ground: "땅", flying: "비행", psychic: "에스퍼", bug: "벌레",
  rock: "바위", ghost: "고스트", dragon: "드래곤", dark: "악",
  steel: "강철", fairy: "페어리"
};

const STAT_KO = {
  hp: "HP", attack: "공격", defense: "방어",
  "special-attack": "특공", "special-defense": "특방", speed: "스피드"
};

const STAT_COLOR = {
  hp: "#ff5959", attack: "#ff7c44", defense: "#ffa544",
  "special-attack": "#6cb4ff", "special-defense": "#7cff9e", speed: "#ff6cb4"
};

var KO_CACHE = {};

function TypeBadge({ type }) {
  return <span className={"type-badge type-" + type}>{TYPE_KO[type] || type}</span>;
}

function StatBar({ name, value }) {
  var color = STAT_COLOR[name] || "#888";
  var pct = Math.min((value / 255) * 100, 100);
  return (
    <div className="stat-row">
      <span className="stat-name">{STAT_KO[name] || name}</span>
      <span className="stat-value">{value}</span>
      <div className="stat-bar-bg">
        <div className="stat-bar-fill" style={{ width: pct + "%", background: color }} />
      </div>
    </div>
  );
}

function MegaAbilities({ abilities }) {
  var [abilityInfos, setAbilityInfos] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    async function load() {
      setLoading(true);
      var results = await Promise.all(abilities.map(async function(a) {
        var info = await fetchAbilityKo(a.ability.name);
        return { nameKo: info.nameKo, desc: info.desc, isHidden: a.is_hidden };
      }));
      setAbilityInfos(results);
      setLoading(false);
    }
    load();
  }, [abilities]);

  if (loading) return <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>특성 불러오는 중...</p>;

  return (
    <div className="ability-inline-list" style={{ marginBottom: "0" }}>
      {abilityInfos.map(function(a, i) {
        return (
          <div key={i} className="ability-inline-item" style={{ cursor: "default" }}>
            <div className="ability-inline-header">
              <span className={"ability-inline-name" + (a.isHidden ? " ability-hidden" : "")}>
                {a.nameKo}{a.isHidden ? " *" : ""}
              </span>
            </div>
            {a.desc && <p className="ability-inline-desc">{a.desc.length > 60 ? a.desc.slice(0, 60) + "..." : a.desc}</p>}
          </div>
        );
      })}
    </div>
  );
}

function MegaPanel({ baseName }) {
  var [megas, setMegas] = useState([]);
  var [loading, setLoading] = useState(true);
  useEffect(function() {
    async function fetchMegas() {
      setLoading(true);
      var variants = [baseName + "-mega", baseName + "-mega-x", baseName + "-mega-y"];
      var results = [];
      for (var i = 0; i < variants.length; i++) {
        try {
          var res = await fetch("https://pokeapi.co/api/v2/pokemon/" + variants[i]);
          if (res.ok) results.push(await res.json());
        } catch(e) {}
      }
      setMegas(results);
      setLoading(false);
    }
    fetchMegas();
  }, [baseName]);

  if (loading) return <div className="loading" style={{ padding: "24px 0" }}><div className="loading-ball" /><p>메가 진화 불러오는 중...</p></div>;
  if (megas.length === 0) return <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontFamily: "var(--pixel-font)", fontSize: "9px" }}>메가 진화 없음</div>;

  return (
    <div className="mega-list">
      {megas.map(function(mega) {
        var imgSrc = (mega.sprites && mega.sprites.other && mega.sprites.other["official-artwork"] && mega.sprites.other["official-artwork"].front_default) || (mega.sprites && mega.sprites.front_default);
        var megaLabel = mega.name.includes("-mega-x") ? "메가 진화 X" : mega.name.includes("-mega-y") ? "메가 진화 Y" : "메가 진화";
        return (
          <div key={mega.name} className="mega-item">
            <div className="mega-header">
              <img src={imgSrc} alt={mega.name} className="mega-img" />
              <div>
                <p className="mega-label">{megaLabel}</p>
                <div className="modal-types" style={{ marginBottom: "8px" }}>
                  {mega.types.map(function(t) { return <TypeBadge key={t.type.name} type={t.type.name} />; })}
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
              <p className="stats-title">특성</p>
              <MegaAbilities abilities={mega.abilities} />
            </div>
            <div className="modal-stats" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
              <p className="stats-title">메가 진화 종족치</p>
              {mega.stats.map(function(s) { return <StatBar key={s.stat.name} name={s.stat.name} value={s.base_stat} />; })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 특성 한글 설명 가져오기
async function fetchAbilityKo(abilityName) {
  try {
    var res = await fetch("https://pokeapi.co/api/v2/ability/" + abilityName);
    var data = await res.json();
    var nameKoObj = data.names.find(function(n) { return n.language.name === "ko"; });
    var descKoObj = data.flavor_text_entries.find(function(f) { return f.language.name === "ko"; });
    return {
      nameKo: nameKoObj ? nameKoObj.name : abilityName,
      desc: descKoObj ? descKoObj.flavor_text.replace(/\n|\f/g, " ") : ""
    };
  } catch(e) { return { nameKo: abilityName, desc: "" }; }
}

function AbilityTab({ pokemon }) {
  var [abilities, setAbilities] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    async function load() {
      setLoading(true);
      var results = await Promise.all(pokemon.abilities.map(async function(a) {
        var info = await fetchAbilityKo(a.ability.name);
        return { nameKo: info.nameKo, desc: info.desc, isHidden: a.is_hidden };
      }));
      setAbilities(results);
      setLoading(false);
    }
    load();
  }, [pokemon]);

  if (loading) return <div className="loading" style={{ padding: "24px 0" }}><div className="loading-ball" /><p>특성 불러오는 중...</p></div>;

  return (
    <div className="ability-tab">
      <p className="stats-title">특성 목록</p>
      {abilities.map(function(a, i) {
        return (
          <div key={i} className={"ability-card" + (a.isHidden ? " ability-card-hidden" : "")}>
            <div className="ability-card-header">
              <span className="ability-card-name">{a.nameKo}{a.isHidden ? " *" : ""}</span>
              {a.isHidden && <span className="ability-hidden-badge">숨겨진 특성</span>}
            </div>
            <p className="ability-card-desc">{a.desc || "설명 없음"}</p>
          </div>
        );
      })}
      <p className="ability-hint">* 숨겨진 특성</p>
    </div>
  );
}

function BasicTab({ pokemon, onClose }) {
  var [abilities, setAbilities] = useState([]);
  var [loading, setLoading] = useState(true);
  var navigate = useNavigate();

  useEffect(function() {
    async function load() {
      setLoading(true);
      var results = await Promise.all(pokemon.abilities.map(async function(a) {
        var info = await fetchAbilityKo(a.ability.name);
        return { nameKo: info.nameKo, desc: info.desc, isHidden: a.is_hidden, enName: a.ability.name };
      }));
      setAbilities(results);
      setLoading(false);
    }
    load();
  }, [pokemon]);

  function handleAbilityClick(abilityName) {
    onClose();
    navigate("/ability?search=" + encodeURIComponent(abilityName));
  }

  return (
    <div className="modal-stats">
      <p className="stats-title">특성</p>
      {loading ? (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>불러오는 중...</p>
      ) : (
        <div className="ability-inline-list">
          {abilities.map(function(a, i) {
            return (
              <div key={i} className="ability-inline-item" onClick={function() { handleAbilityClick(a.nameKo); }}>
                <div className="ability-inline-header">
                  <span className={"ability-inline-name" + (a.isHidden ? " ability-hidden" : "")}>
                    {a.nameKo}{a.isHidden ? " *" : ""}
                  </span>
                  <span className="ability-inline-go">특성 →</span>
                </div>
                {a.desc && <p className="ability-inline-desc">{a.desc.length > 60 ? a.desc.slice(0, 60) + "..." : a.desc}</p>}
              </div>
            );
          })}
        </div>
      )}
      <p className="stats-title" style={{ marginTop: "16px" }}>기본 능력치</p>
      {pokemon.stats.map(function(s) { return <StatBar key={s.stat.name} name={s.stat.name} value={s.base_stat} />; })}
    </div>
  );
}

function PokemonModal({ pokemon, onClose }) {
  var [tab, setTab] = useState("basic");
  if (!pokemon) return null;
  var imgSrc = (pokemon.sprites && pokemon.sprites.other && pokemon.sprites.other["official-artwork"] && pokemon.sprites.other["official-artwork"].front_default) || (pokemon.sprites && pokemon.sprites.front_default);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={function(e) { e.stopPropagation(); }}>
        <button className="modal-close" onClick={onClose}>X</button>
        <div className="modal-header">
          <img src={imgSrc} alt={pokemon.nameKo} className="modal-img" />
          <div className="modal-info">
            <p className="modal-number">No.{String(pokemon.id).padStart(4, "0")}</p>
            <h2 className="modal-name">{pokemon.nameKo}</h2>
            <p className="modal-name-en">{pokemon.name}</p>
            <div className="modal-types">{pokemon.types.map(function(t) { return <TypeBadge key={t.type.name} type={t.type.name} />; })}</div>
            <p className="modal-flavor">{pokemon.flavorText}</p>
            <div className="modal-meta">
              <div className="meta-item"><span className="meta-label">키</span><span className="meta-val">{(pokemon.height / 10).toFixed(1)}m</span></div>
              <div className="meta-item"><span className="meta-label">몸무게</span><span className="meta-val">{(pokemon.weight / 10).toFixed(1)}kg</span></div>
            </div>
          </div>
        </div>
        <div className="modal-tabs">
          <button className={"modal-tab" + (tab === "basic" ? " active" : "")} onClick={function() { setTab("basic"); }}>기본 정보</button>
          <button className={"modal-tab" + (tab === "ability" ? " active" : "")} onClick={function() { setTab("ability"); }}>특성</button>
          <button className={"modal-tab" + (tab === "mega" ? " active" : "")} onClick={function() { setTab("mega"); }}>⚡ 메가 진화</button>
        </div>
        {tab === "basic" && <BasicTab pokemon={pokemon} onClose={onClose} />}
        {tab === "ability" && <AbilityTab pokemon={pokemon} />}
        {tab === "mega" && <MegaPanel baseName={pokemon.name} />}
      </div>
    </div>
  );
}


const CHART = {
  normal:   { rock:0.5, ghost:0, steel:0.5 },
  fire:     { fire:0.5, water:0.5, grass:2, ice:2, bug:2, rock:0.5, dragon:0.5, steel:2 },
  water:    { fire:2, water:0.5, grass:0.5, ground:2, rock:2, dragon:0.5 },
  electric: { water:2, electric:0.5, grass:0.5, ground:0, flying:2, dragon:0.5 },
  grass:    { fire:0.5, water:2, grass:0.5, poison:0.5, ground:2, flying:0.5, bug:0.5, rock:2, dragon:0.5, steel:0.5 },
  ice:      { fire:0.5, water:0.5, grass:2, ice:0.5, ground:2, flying:2, dragon:2, steel:0.5 },
  fighting: { normal:2, ice:2, poison:0.5, flying:0.5, psychic:0.5, bug:0.5, rock:2, ghost:0, dark:2, steel:2, fairy:0.5 },
  poison:   { grass:2, poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, fairy:2 },
  ground:   { fire:2, electric:2, grass:0.5, poison:2, flying:0, bug:0.5, rock:2, steel:2 },
  flying:   { electric:0.5, grass:2, fighting:2, bug:2, rock:0.5, steel:0.5 },
  psychic:  { fighting:2, poison:2, psychic:0.5, dark:0, steel:0.5 },
  bug:      { fire:0.5, grass:2, fighting:0.5, poison:0.5, flying:0.5, psychic:2, ghost:0.5, dark:2, steel:0.5, fairy:0.5 },
  rock:     { fire:2, ice:2, fighting:0.5, ground:0.5, flying:2, bug:2, steel:0.5 },
  ghost:    { normal:0, fighting:0, psychic:2, ghost:2, dark:0.5 },
  dragon:   { dragon:2, steel:0.5, fairy:0 },
  dark:     { fighting:0.5, psychic:2, ghost:2, dark:0.5, fairy:0.5 },
  steel:    { fire:0.5, water:0.5, electric:0.5, ice:2, rock:2, steel:0.5, fairy:2 },
  fairy:    { fire:0.5, fighting:2, poison:0.5, dragon:2, dark:2, steel:0.5 }
};

const ALL_TYPES = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];

function getDefMatchup(types) {
  var result = {};
  ALL_TYPES.forEach(function(atk) {
    var mult = 1;
    types.forEach(function(def) {
      mult *= (CHART[atk] && CHART[atk][def] !== undefined) ? CHART[atk][def] : 1;
    });
    result[atk] = mult;
  });
  return result;
}

const STAT_KO_CMP = { hp:"HP", attack:"공격", defense:"방어", "special-attack":"특공", "special-defense":"특방", speed:"스피드" };
const STAT_COLOR_CMP = { hp:"#ff5959", attack:"#ff7c44", defense:"#ffa544", "special-attack":"#6cb4ff", "special-defense":"#7cff9e", speed:"#ff6cb4" };

function CompareStatRow({ name, valA, valB }) {
  var max = Math.max(valA, valB, 255);
  var pctA = (valA / max) * 100;
  var pctB = (valB / max) * 100;
  var color = STAT_COLOR_CMP[name] || "#888";
  var aWins = valA > valB;
  var bWins = valB > valA;
  return (
    <div className="cmp-stat-row">
      <span className="cmp-stat-name">{STAT_KO_CMP[name] || name}</span>
      <div className="cmp-stat-bars">
        <div className="cmp-bar-wrap cmp-bar-left">
          <span className={"cmp-val" + (aWins ? " cmp-win" : "")}>{valA}</span>
          <div className="cmp-bar-bg">
            <div className="cmp-bar-fill" style={{ width: pctA + "%", background: color, opacity: aWins ? 1 : 0.45 }} />
          </div>
        </div>
        <span className="cmp-stat-label">{STAT_KO_CMP[name] || name}</span>
        <div className="cmp-bar-wrap cmp-bar-right">
          <div className="cmp-bar-bg">
            <div className="cmp-bar-fill cmp-bar-fill-right" style={{ width: pctB + "%", background: color, opacity: bWins ? 1 : 0.45 }} />
          </div>
          <span className={"cmp-val" + (bWins ? " cmp-win" : "")}>{valB}</span>
        </div>
      </div>
    </div>
  );
}

function CompareAbilities({ pokemon }) {
  var [abilities, setAbilities] = useState([]);
  useEffect(function() {
    Promise.all(pokemon.abilities.map(async function(a) {
      var info = await fetchAbilityKo(a.ability.name);
      return { nameKo: info.nameKo, isHidden: a.is_hidden };
    })).then(setAbilities);
  }, [pokemon]);
  return (
    <div className="cmp-abilities">
      {abilities.map(function(a, i) {
        return (
          <span key={i} className={"cmp-ability-badge" + (a.isHidden ? " hidden" : "")}>
            {a.nameKo}{a.isHidden ? " *" : ""}
          </span>
        );
      })}
    </div>
  );
}

function useMegaForms(baseName) {
  var [megas, setMegas] = useState([]);
  useEffect(function() {
    async function fetch_megas() {
      var variants = [baseName + "-mega", baseName + "-mega-x", baseName + "-mega-y"];
      var results = [];
      for (var i = 0; i < variants.length; i++) {
        try {
          var res = await fetch("https://pokeapi.co/api/v2/pokemon/" + variants[i]);
          if (res.ok) {
            var data = await res.json();
            var label = variants[i].includes("-mega-x") ? "메가X" : variants[i].includes("-mega-y") ? "메가Y" : "메가";
            results.push({ label: label, data: data });
          }
        } catch(e) {}
      }
      setMegas(results);
    }
    fetch_megas();
  }, [baseName]);
  return megas;
}

function CompareSide({ base, label }) {
  var megas = useMegaForms(base.name);
  var [selected, setSelected] = useState("base");

  var currentMega = megas.find(function(m) { return m.label === selected; });
  var isBase = selected === "base";
  var currentPokemon = isBase ? base : (currentMega ? currentMega.data : base);

  // 한글 이름: 기본 이름 + 메가 라벨 조합
  var displayName = isBase
    ? (base.nameKo || base.name)
    : (base.nameKo || base.name) + " (" + selected + ")";

  var imgSrc = (currentPokemon.sprites && currentPokemon.sprites.other && currentPokemon.sprites.other["official-artwork"] && currentPokemon.sprites.other["official-artwork"].front_default) || (currentPokemon.sprites && currentPokemon.sprites.front_default);

  return { pokemon: currentPokemon, imgSrc: imgSrc, megas: megas, selected: selected, setSelected: setSelected, label: label, displayName: displayName };
}

function CompareModal({ pokemonA, pokemonB, onClose, onExit }) {
  var sideA = CompareSide({ base: pokemonA, label: "A" });
  var sideB = CompareSide({ base: pokemonB, label: "B" });

  var pA = sideA.pokemon;
  var pB = sideB.pokemon;

  var matchupA = getDefMatchup(pA.types.map(function(t) { return t.type.name; }));
  var matchupB = getDefMatchup(pB.types.map(function(t) { return t.type.name; }));
  var totalA = pA.stats.reduce(function(s, x) { return s + x.base_stat; }, 0);
  var totalB = pB.stats.reduce(function(s, x) { return s + x.base_stat; }, 0);

  function MegaToggle({ side }) {
    if (side.megas.length === 0) return null;
    var options = [{ label: "기본" }].concat(side.megas.map(function(m) { return { label: m.label }; }));
    return (
      <div className="cmp-mega-toggle">
        {options.map(function(opt) {
          var val = opt.label === "기본" ? "base" : opt.label;
          return (
            <button
              key={val}
              className={"cmp-mega-btn" + (side.selected === val ? " active" : "")}
              onClick={function() { side.setSelected(val); }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cmp-modal" onClick={function(e) { e.stopPropagation(); }}>
        <button className="modal-close" onClick={onClose}>X</button>

        {/* 포켓몬 헤더 */}
        <div className="cmp-header">
          <div className="cmp-pokemon-info">
            <img src={sideA.imgSrc} alt={sideA.displayName} className="cmp-img" />
            <p className="cmp-name">{sideA.displayName}</p>
            <div className="cmp-types">
              {pA.types.map(function(t) { return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name]}</span>; })}
            </div>
            <MegaToggle side={sideA} />
          </div>
          <div className="cmp-vs">VS</div>
          <div className="cmp-pokemon-info">
            <img src={sideB.imgSrc} alt={sideB.displayName} className="cmp-img" />
            <p className="cmp-name">{sideB.displayName}</p>
            <div className="cmp-types">
              {pB.types.map(function(t) { return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name]}</span>; })}
            </div>
            <MegaToggle side={sideB} />
          </div>
        </div>

        {/* 특성 */}
        <div className="cmp-section">
          <p className="cmp-section-title">특성</p>
          <div className="cmp-row-2col">
            <CompareAbilities pokemon={pA} />
            <CompareAbilities pokemon={pB} />
          </div>
        </div>

        {/* 능력치 비교 */}
        <div className="cmp-section">
          <p className="cmp-section-title">기본 능력치</p>
          {pA.stats.map(function(s) {
            var sB = pB.stats.find(function(x) { return x.stat.name === s.stat.name; });
            return <CompareStatRow key={s.stat.name} name={s.stat.name} valA={s.base_stat} valB={sB ? sB.base_stat : 0} />;
          })}
          <div className="cmp-total-row">
            <span className={"cmp-total" + (totalA > totalB ? " cmp-win" : "")}>합계 {totalA}</span>
            <span className="cmp-total-label">총합</span>
            <span className={"cmp-total" + (totalB > totalA ? " cmp-win" : "")}>합계 {totalB}</span>
          </div>
        </div>

        {/* 타입 상성 비교 */}
        <div className="cmp-section">
          <p className="cmp-section-title">방어 타입 상성</p>
          <div className="cmp-matchup-grid">
            {ALL_TYPES.map(function(atk) {
              var vA = matchupA[atk];
              var vB = matchupB[atk];
              if (vA === 1 && vB === 1) return null;
              return (
                <div key={atk} className="cmp-matchup-row">
                  <span className={"type-badge type-" + atk} style={{ fontSize: "7px", minWidth: "44px", textAlign: "center" }}>{TYPE_KO[atk]}</span>
                  <span className={"cmp-mult" + (vA > vB ? " cmp-worse" : vA < vB ? " cmp-better" : "")}>{vA}x</span>
                  <span className={"cmp-mult" + (vB > vA ? " cmp-worse" : vB < vA ? " cmp-better" : "")}>{vB}x</span>
                </div>
              );
            })}
          </div>
        </div>

        <button className="pixel-btn" style={{ width: "100%", marginTop: "8px" }} onClick={onExit}>비교 종료</button>
      </div>
    </div>
  );
}

function PokemonCard({ pokemon, onClick }) {
  var imgSrc = (pokemon.sprites && pokemon.sprites.other && pokemon.sprites.other["official-artwork"] && pokemon.sprites.other["official-artwork"].front_default) || (pokemon.sprites && pokemon.sprites.front_default);
  return (
    <div className="poke-card pixel-card" onClick={function() { onClick(pokemon); }}>
      <p className="poke-number">No.{String(pokemon.id).padStart(4, "0")}</p>
      <img src={imgSrc} alt={pokemon.nameKo} className="poke-img" loading="lazy" />
      <p className="poke-name">{pokemon.nameKo}</p>
      <div className="poke-types">{pokemon.types.map(function(t) { return <TypeBadge key={t.type.name} type={t.type.name} />; })}</div>
    </div>
  );
}

const PAGE_SIZE = 20;
const TOTAL = 1025;

async function getKoName(id) {
  if (KO_CACHE[id]) return KO_CACHE[id];
  try {
    var res = await fetch("https://pokeapi.co/api/v2/pokemon-species/" + id);
    var species = await res.json();
    var nameKoObj = species.names.find(function(n) { return n.language.name === "ko"; });
    var flavorArr = species.flavor_text_entries.filter(function(f) { return f.language.name === "ko"; });
    var flavorText = flavorArr.length > 0 ? flavorArr[flavorArr.length - 1].flavor_text.replace(/\f|\n/g, " ") : "";
    var ko = nameKoObj ? nameKoObj.name : "";
    KO_CACHE[id] = { ko: ko, flavorText: flavorText };
    return KO_CACHE[id];
  } catch(e) { return { ko: "", flavorText: "" }; }
}

const GENERATIONS = [
  { label: "전체", min: 1,   max: 1025 },
  { label: "1세대", min: 1,   max: 151  },
  { label: "2세대", min: 152, max: 251  },
  { label: "3세대", min: 252, max: 386  },
  { label: "4세대", min: 387, max: 493  },
  { label: "5세대", min: 494, max: 649  },
  { label: "6세대", min: 650, max: 721  },
  { label: "7세대", min: 722, max: 809  },
  { label: "8세대", min: 810, max: 905  },
  { label: "9세대", min: 906, max: 1025 },
];

export default function Pokedex() {
  var [allList, setAllList] = useState([]);
  var [koProgress, setKoProgress] = useState(0);
  var [koReady, setKoReady] = useState(false);
  var [loadedPokemon, setLoadedPokemon] = useState([]);
  var [search, setSearch] = useState("");
  var [searchResults, setSearchResults] = useState([]);
  var [isSearching, setIsSearching] = useState(false);
  var [initialLoading, setInitialLoading] = useState(true);
  var [loadingMore, setLoadingMore] = useState(false);
  var [hasMore, setHasMore] = useState(true);
  var [selected, setSelected] = useState(null);
  var [searchLoading, setSearchLoading] = useState(false);
  var [suggestions, setSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [genFilter, setGenFilter] = useState(0);

  var offsetRef = useRef(0);
  var hasMoreRef = useRef(true);
  var loadingMoreRef = useRef(false);
  var allListRef = useRef([]);
  var filteredListRef = useRef([]);
  var searchWrapRef = useRef(null);

  var fetchBatch = useCallback(async function(list) {
    var fetched = await Promise.all(list.map(async function(entry) {
      try {
        var urlParts = entry.url.split("/").filter(Boolean);
        var id = urlParts[urlParts.length - 1];
        var basic = await fetch("https://pokeapi.co/api/v2/pokemon/" + id).then(function(r) { return r.json(); });
        var cached = await getKoName(id);
        return Object.assign({}, basic, { nameKo: cached.ko || basic.name, flavorText: cached.flavorText });
      } catch(e) { return null; }
    }));
    return fetched.filter(Boolean);
  }, []);

  var loadMore = useCallback(async function() {
    if (loadingMoreRef.current || !hasMoreRef.current || filteredListRef.current.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    var currentOffset = offsetRef.current;
    var chunk = filteredListRef.current.slice(currentOffset, currentOffset + PAGE_SIZE);
    if (chunk.length === 0) {
      hasMoreRef.current = false;
      setHasMore(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
      return;
    }
    var results = await fetchBatch(chunk);
    setLoadedPokemon(function(prev) { return prev.concat(results); });
    var newOffset = currentOffset + PAGE_SIZE;
    offsetRef.current = newOffset;
    setHasMore(newOffset < filteredListRef.current.length);
    hasMoreRef.current = newOffset < filteredListRef.current.length;
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [fetchBatch]);

  // 스크롤 이벤트로 무한스크롤
  useEffect(function() {
    function handleScroll() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var windowHeight = window.innerHeight;
      var docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollTop - windowHeight < 300) {
        loadMore();
      }
    }
    window.addEventListener("scroll", handleScroll);
    return function() { window.removeEventListener("scroll", handleScroll); };
  }, [loadMore]);

  // 전체 목록 + 한글 캐싱
  useEffect(function() {
    async function fetchList() {
      try {
        var res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=" + TOTAL + "&offset=0");
        var data = await res.json();
        setAllList(data.results);
        allListRef.current = data.results;
        filteredListRef.current = data.results;
        preloadKoNames(data.results);
      } catch(e) { console.error(e); }
    }

    async function preloadKoNames(list) {
      var batchSize = 30;
      for (var i = 0; i < list.length; i += batchSize) {
        var chunk = list.slice(i, i + batchSize);
        await Promise.all(chunk.map(async function(entry) {
          var urlParts = entry.url.split("/").filter(Boolean);
          var id = urlParts[urlParts.length - 1];
          await getKoName(id);
        }));
        setKoProgress(Math.min(i + batchSize, list.length));
      }
      setKoReady(true);
    }

    fetchList();
  }, []);

  // 첫 20마리 로드 (allList 변경 시)
  useEffect(function() {
    if (allList.length === 0) return;
    filteredListRef.current = allList;
    async function loadFirst() {
      setInitialLoading(true);
      var chunk = allList.slice(0, PAGE_SIZE);
      var results = await fetchBatch(chunk);
      setLoadedPokemon(results);
      offsetRef.current = PAGE_SIZE;
      hasMoreRef.current = PAGE_SIZE < allList.length;
      setHasMore(PAGE_SIZE < allList.length);
      setInitialLoading(false);
    }
    loadFirst();
  }, [allList, fetchBatch]);

  // 세대 필터 변경 시 리셋
  useEffect(function() {
    if (allList.length === 0) return;
    var gen = GENERATIONS[genFilter];
    var filtered = allList.filter(function(entry) {
      var urlParts = entry.url.split("/").filter(Boolean);
      var id = parseInt(urlParts[urlParts.length - 1], 10);
      return id >= gen.min && id <= gen.max;
    });
    filteredListRef.current = filtered;
    setSearch("");
    setIsSearching(false);
    setSearchResults([]);
    loadingMoreRef.current = false;
    async function loadFiltered() {
      setInitialLoading(true);
      var chunk = filtered.slice(0, PAGE_SIZE);
      var results = await fetchBatch(chunk);
      setLoadedPokemon(results);
      offsetRef.current = PAGE_SIZE;
      hasMoreRef.current = PAGE_SIZE < filtered.length;
      setHasMore(PAGE_SIZE < filtered.length);
      setInitialLoading(false);
    }
    loadFiltered();
  }, [genFilter, allList, fetchBatch]);

  // 연관검색어
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    var list = allListRef.current;
    var matched = [];
    list.forEach(function(entry) {
      var urlParts = entry.url.split("/").filter(Boolean);
      var id = urlParts[urlParts.length - 1];
      var cached = KO_CACHE[id];
      var koName = cached ? cached.ko : "";
      if (koName.includes(q) || entry.name.includes(q)) {
        matched.push({ id: id, ko: koName || entry.name, en: entry.name });
      }
    });
    if (!isNaN(q)) {
      var numId = String(parseInt(q, 10));
      if (!matched.find(function(m) { return m.id === numId; }) && KO_CACHE[numId]) {
        matched.unshift({ id: numId, ko: KO_CACHE[numId].ko, en: "" });
      }
    }
    matched.sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });
    setSuggestions(matched.slice(0, 8));
    setShowSuggestions(matched.length > 0);
  }, [search, koProgress]);

  // 검색 실행
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    async function doSearch() {
      setSearchLoading(true);
      var list = allListRef.current;
      var matched = list.filter(function(entry) {
        var urlParts = entry.url.split("/").filter(Boolean);
        var id = urlParts[urlParts.length - 1];
        var cached = KO_CACHE[id];
        var koName = cached ? cached.ko.toLowerCase() : "";
        return koName.includes(q) || entry.name.includes(q) || id === q;
      });
      var results = await fetchBatch(matched.slice(0, 40));
      setSearchResults(results);
      setSearchLoading(false);
    }
    var timer = setTimeout(doSearch, 300);
    return function() { clearTimeout(timer); };
  }, [search, fetchBatch, koProgress]);

  // 바깥 클릭시 드롭다운 닫기
  useEffect(function() {
    function handleClick(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); };
  }, []);

  var displayList = isSearching ? searchResults : loadedPokemon;

  // 비교 모드
  var [compareMode, setCompareMode] = useState(false);
  var [compareList, setCompareList] = useState([]);
  var [showCompare, setShowCompare] = useState(false);

  function handleCardClick(pokemon) {
    if (compareMode) {
      if (compareList.find(function(p) { return p.id === pokemon.id; })) return;
      var next = compareList.concat(pokemon);
      setCompareList(next);
      if (next.length === 2) setShowCompare(true);
    } else {
      setSelected(pokemon);
    }
  }

  function exitCompare() {
    setCompareMode(false);
    setCompareList([]);
    setShowCompare(false);
  }

  return (
    <div>
      <h1 className="page-title">POKEMON <span>POKEDEX</span></h1>
      <p className="page-subtitle">전국 도감 — 이름, 번호로 검색해보세요</p>

      {!koReady && (
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "4px", background: "var(--border)", borderRadius: "2px" }}>
            <div style={{ height: "100%", background: "var(--accent)", borderRadius: "2px", width: (koProgress / TOTAL * 100) + "%", transition: "width 0.3s" }} />
          </div>
          <span style={{ fontFamily: "var(--pixel-font)", fontSize: "7px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            한글 로딩 {koProgress}/{TOTAL}
          </span>
        </div>
      )}

      <div className="compare-toolbar">
        {!compareMode ? (
          <button className="pixel-btn compare-btn" onClick={function() { setCompareMode(true); setCompareList([]); }}>
            ⚔ 비교 모드
          </button>
        ) : (
          <div className="compare-active">
            <span className="compare-status">
              {compareList.length === 0 && "포켓몬을 2마리 선택하세요"}
              {compareList.length === 1 && (
                <span>{compareList[0].nameKo} 선택됨 — 1마리 더 선택하세요</span>
              )}
              {compareList.length === 2 && "비교 준비 완료!"}
            </span>
            <div className="compare-selected">
              {compareList.map(function(p) {
                var img = (p.sprites && p.sprites.other && p.sprites.other["official-artwork"] && p.sprites.other["official-artwork"].front_default) || (p.sprites && p.sprites.front_default);
                return (
                  <div key={p.id} className="compare-chip">
                    <img src={img} alt={p.nameKo} className="compare-chip-img" />
                    <span className="compare-chip-name">{p.nameKo}</span>
                    <span className="compare-chip-remove" onClick={function() { setCompareList(compareList.filter(function(x) { return x.id !== p.id; })); }}>✕</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {compareList.length === 2 && (
                <button className="pixel-btn" onClick={function() { setShowCompare(true); }}>비교하기</button>
              )}
              <button className="pixel-btn" style={{ borderColor: "var(--text-muted)", color: "var(--text-muted)" }} onClick={exitCompare}>취소</button>
            </div>
          </div>
        )}
      </div>

      <div className="search-wrap" ref={searchWrapRef}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="예) 피카츄, pikachu, 25"
          value={search}
          onChange={function(e) { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={function() { if (suggestions.length > 0) setShowSuggestions(true); }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestion-box">
            {suggestions.map(function(s) {
              return (
                <div key={s.id} className="suggestion-item" onMouseDown={function() { setSearch(s.ko); setShowSuggestions(false); }}>
                  <span className="suggestion-num">No.{String(s.id).padStart(4, "0")}</span>
                  <span className="suggestion-ko">{s.ko}</span>
                  <span className="suggestion-en">{s.en}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="gen-filter-row">
        <p className="result-count" style={{ margin: 0 }}>
          {isSearching
            ? searchResults.length + "마리 검색됨"
            : offsetRef.current + " / " + filteredListRef.current.length + "마리"}
        </p>
        <div className="gen-btns">
          {GENERATIONS.map(function(g, i) {
            return (
              <button
                key={i}
                className={"gen-btn" + (genFilter === i ? " active" : "")}
                onClick={function() { setGenFilter(i); }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {initialLoading ? (
        <div className="loading"><div className="loading-ball" /><p>포켓몬 불러오는 중...</p></div>
      ) : (
        <div>
          {searchLoading ? (
            <div className="loading"><div className="loading-ball" /><p>검색 중...</p></div>
          ) : (
            <div className="poke-grid">
              {displayList.map(function(p) {
                var isSelected = compareList.find(function(x) { return x.id === p.id; });
                return (
                  <div key={p.id} style={{ position: "relative" }}>
                    {compareMode && isSelected && (
                      <div className="compare-overlay">✓</div>
                    )}
                    <PokemonCard pokemon={p} onClick={handleCardClick} />
                  </div>
                );
              })}
            </div>
          )}
          {!isSearching && loadingMore && (
            <div className="loading" style={{ padding: "16px 0" }}>
              <div className="loading-ball" /><p>더 불러오는 중...</p>
            </div>
          )}
          {!isSearching && !hasMore && (
            <p className="result-count" style={{ textAlign: "center", padding: "16px 0" }}>전국도감 완료! 🎉</p>
          )}
        </div>
      )}

      {selected && <PokemonModal pokemon={selected} onClose={function() { setSelected(null); }} />}
      {showCompare && compareList.length === 2 && (
        <CompareModal
          pokemonA={compareList[0]}
          pokemonB={compareList[1]}
          onClose={function() { setShowCompare(false); }}
          onExit={exitCompare}
        />
      )}
    </div>
  );
}