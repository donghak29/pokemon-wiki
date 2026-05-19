import { useState, useEffect, useRef } from "react";

const TYPE_KO = {
  normal: "노말", fire: "불꽃", water: "물", electric: "전기",
  grass: "풀", ice: "얼음", fighting: "격투", poison: "독",
  ground: "땅", flying: "비행", psychic: "에스퍼", bug: "벌레",
  rock: "바위", ghost: "고스트", dragon: "드래곤", dark: "악",
  steel: "강철", fairy: "페어리"
};

const TYPES = [
  "normal","fire","water","electric","grass","ice",
  "fighting","poison","ground","flying","psychic","bug",
  "rock","ghost","dragon","dark","steel","fairy"
];

// 공격 타입 → 방어 타입 = 배율 (공식 9세대 기준)
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
  fairy:    { fire:0.5, fighting:2, poison:0.5, dragon:0, dark:2, steel:0.5 }
};

function getMultiplier(attackType, defType) {
  if (CHART[attackType] && CHART[attackType][defType] !== undefined) {
    return CHART[attackType][defType];
  }
  return 1;
}

function getDefenseMatchup(types) {
  var result = {};
  TYPES.forEach(function(atkType) {
    var mult = 1;
    types.forEach(function(defType) {
      mult *= getMultiplier(atkType, defType);
    });
    result[atkType] = mult;
  });
  return result;
}

function MultiplierCell({ value }) {
  if (value >= 2) return <span className="chart-cell chart-x2">●</span>;
  if (value === 0.5 || value === 0.25) return <span className="chart-cell chart-half">▲</span>;
  if (value === 0) return <span className="chart-cell chart-zero">✕</span>;
  return <span className="chart-cell chart-one"></span>;
}

// ── 전체 타입 상성표 ──
function FullTypeChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-scroll">
        <table className="type-table">
          <thead>
            <tr>
              <th className="chart-corner">
                <span className="corner-atk">공격 →</span>
                <span className="corner-def">↓ 방어</span>
              </th>
              {TYPES.map(function(t) {
                return (
                  <th key={t} className="chart-th">
                    <span className={"type-badge type-" + t}>{TYPE_KO[t]}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TYPES.map(function(defType) {
              return (
                <tr key={defType}>
                  <td className="chart-td-label">
                    <span className={"type-badge type-" + defType}>{TYPE_KO[defType]}</span>
                  </td>
                  {TYPES.map(function(atkType) {
                    var val = getMultiplier(atkType, defType);
                    return (
                      <td key={atkType} className="chart-td">
                        <MultiplierCell value={val} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="chart-legend">
        <div className="legend-item"><span className="chart-cell chart-x2">●</span><span>효과 굉장 x2</span></div>
        <div className="legend-item"><span className="chart-cell chart-one" style={{width:"24px",display:"inline-block"}}></span><span>보통 x1</span></div>
        <div className="legend-item"><span className="chart-cell chart-half">▲</span><span>반감 x0.5</span></div>
        <div className="legend-item"><span className="chart-cell chart-zero">✕</span><span>효과 없음</span></div>
      </div>
    </div>
  );
}

// ── 포켓몬별 방어 상성 ──
var PKM_CACHE = {};

function DefenseCard({ pokemon, onClick }) {
  var imgSrc = (pokemon.sprites && pokemon.sprites.other && pokemon.sprites.other["official-artwork"] && pokemon.sprites.other["official-artwork"].front_default) || (pokemon.sprites && pokemon.sprites.front_default);
  return (
    <div className="poke-card pixel-card" onClick={function() { onClick(pokemon); }}>
      <p className="poke-number">No.{String(pokemon.id).padStart(4, "0")}</p>
      <img src={imgSrc} alt={pokemon.nameKo} className="poke-img" loading="lazy" />
      <p className="poke-name">{pokemon.nameKo}</p>
      <div className="poke-types">
        {pokemon.types.map(function(t) {
          return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name] || t.type.name}</span>;
        })}
      </div>
    </div>
  );
}

var SECTIONS = [
  { key: 4,    label: "데미지 x4",    cls: "dmg-x4" },
  { key: 2,    label: "데미지 x2",    cls: "dmg-x2" },
  { key: 1,    label: "데미지 x1",    cls: "dmg-x1" },
  { key: 0.5,  label: "데미지 x0.5", cls: "dmg-half" },
  { key: 0.25, label: "데미지 x0.25",cls: "dmg-quarter" },
  { key: 0,    label: "데미지 없음",  cls: "dmg-zero" },
];

function DefenseView({ types }) {
  var matchup = getDefenseMatchup(types);
  var grouped = { 4: [], 2: [], 1: [], 0.5: [], 0.25: [], 0: [] };
  Object.keys(matchup).forEach(function(atkType) {
    var val = matchup[atkType];
    if (grouped[val] !== undefined) grouped[val].push(atkType);
  });
  return (
    <div className="defense-sections">
      {SECTIONS.map(function(sec) {
        var types2 = grouped[sec.key];
        if (types2.length === 0) return null;
        return (
          <div key={sec.key} className={"defense-section " + sec.cls}>
            <p className="defense-label">{sec.label}</p>
            <div className="defense-types">
              {types2.map(function(t) {
                return <span key={t} className={"type-badge type-" + t}>{TYPE_KO[t]}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MegaDefensePanel({ baseName }) {
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

  if (loading) return <div className="loading" style={{ padding: "24px 0" }}><div className="loading-ball" /><p>불러오는 중...</p></div>;
  if (megas.length === 0) return <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontFamily: "var(--pixel-font)", fontSize: "9px" }}>메가 진화 없음</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {megas.map(function(mega) {
        var imgSrc = (mega.sprites && mega.sprites.other && mega.sprites.other["official-artwork"] && mega.sprites.other["official-artwork"].front_default) || (mega.sprites && mega.sprites.front_default);
        var megaLabel = mega.name.includes("-mega-x") ? "메가 진화 X" : mega.name.includes("-mega-y") ? "메가 진화 Y" : "메가 진화";
        var megaTypes = mega.types.map(function(t) { return t.type.name; });
        return (
          <div key={mega.name}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <img src={imgSrc} alt={mega.name} style={{ width: "80px", height: "80px", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(255,61,110,0.3))" }} />
              <div>
                <p className="mega-label">{megaLabel}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {mega.types.map(function(t) { return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name]}</span>; })}
                </div>
              </div>
            </div>
            <DefenseView types={megaTypes} />
          </div>
        );
      })}
    </div>
  );
}

function DefenseModal({ pokemon, onClose }) {
  var [tab, setTab] = useState("basic");
  if (!pokemon) return null;

  var typeNames = pokemon.types.map(function(t) { return t.type.name; });
  var imgSrc = (pokemon.sprites && pokemon.sprites.other && pokemon.sprites.other["official-artwork"] && pokemon.sprites.other["official-artwork"].front_default) || (pokemon.sprites && pokemon.sprites.front_default);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={function(e) { e.stopPropagation(); }}>
        <button className="modal-close" onClick={onClose}>X</button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={imgSrc} alt={pokemon.nameKo} className="modal-img" style={{ margin: "0 auto" }} />
          <p className="modal-number">No.{String(pokemon.id).padStart(4, "0")}</p>
          <h2 className="modal-name" style={{ textAlign: "center" }}>{pokemon.nameKo}</h2>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "8px" }}>
            {pokemon.types.map(function(t) {
              return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name]}</span>;
            })}
          </div>
        </div>

        <div className="modal-tabs">
          <button className={"modal-tab" + (tab === "basic" ? " active" : "")} onClick={function() { setTab("basic"); }}>기본 방어 상성</button>
          <button className={"modal-tab" + (tab === "mega" ? " active" : "")} onClick={function() { setTab("mega"); }}>⚡ 메가 진화 상성</button>
        </div>

        {tab === "basic" && <DefenseView types={typeNames} />}
        {tab === "mega" && <MegaDefensePanel baseName={pokemon.name} />}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;
const TOTAL = 1025;
var KO_CACHE2 = {};

async function getKoName2(id) {
  if (KO_CACHE2[id]) return KO_CACHE2[id];
  try {
    var res = await fetch("https://pokeapi.co/api/v2/pokemon-species/" + id);
    var species = await res.json();
    var nameKoObj = species.names.find(function(n) { return n.language.name === "ko"; });
    var ko = nameKoObj ? nameKoObj.name : "";
    KO_CACHE2[id] = ko;
    return ko;
  } catch(e) { return ""; }
}

function PokemonDefenseTab() {
  var [allList, setAllList] = useState([]);
  var [loadedPokemon, setLoadedPokemon] = useState([]);
  var [search, setSearch] = useState("");
  var [suggestions, setSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [searchResults, setSearchResults] = useState([]);
  var [isSearching, setIsSearching] = useState(false);
  var [searchLoading, setSearchLoading] = useState(false);
  var [initialLoading, setInitialLoading] = useState(true);
  var [loadingMore, setLoadingMore] = useState(false);
  var [, setHasMore] = useState(true);
  var [selected, setSelected] = useState(null);
  var [koProgress, setKoProgress] = useState(0);

  var offsetRef = useRef(0);
  var hasMoreRef = useRef(true);
  var loadingMoreRef = useRef(false);
  var allListRef = useRef([]);
  var searchWrapRef = useRef(null);

  async function fetchBatch(list) {
    var fetched = await Promise.all(list.map(async function(entry) {
      try {
        var urlParts = entry.url.split("/").filter(Boolean);
        var id = urlParts[urlParts.length - 1];
        if (PKM_CACHE[id]) return PKM_CACHE[id];
        var basic = await fetch("https://pokeapi.co/api/v2/pokemon/" + id).then(function(r) { return r.json(); });
        var ko = await getKoName2(id);
        var result = Object.assign({}, basic, { nameKo: ko || basic.name });
        PKM_CACHE[id] = result;
        return result;
      } catch(e) { return null; }
    }));
    return fetched.filter(Boolean);
  }

  async function loadMore() {
    if (loadingMoreRef.current || !hasMoreRef.current || allListRef.current.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    var currentOffset = offsetRef.current;
    var chunk = allListRef.current.slice(currentOffset, currentOffset + PAGE_SIZE);
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
    hasMoreRef.current = newOffset < allListRef.current.length;
    setHasMore(newOffset < allListRef.current.length);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }

  useEffect(function() {
    function handleScroll() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var windowHeight = window.innerHeight;
      var docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollTop - windowHeight < 300 && !isSearching) {
        loadMore();
      }
    }
    window.addEventListener("scroll", handleScroll);
    return function() { window.removeEventListener("scroll", handleScroll); };
  });

  useEffect(function() {
    async function fetchList() {
      try {
        var res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=" + TOTAL + "&offset=0");
        var data = await res.json();
        setAllList(data.results);
        allListRef.current = data.results;
        preloadKo(data.results);
      } catch(e) {}
    }

    async function preloadKo(list) {
      var batchSize = 30;
      for (var i = 0; i < list.length; i += batchSize) {
        var chunk = list.slice(i, i + batchSize);
        await Promise.all(chunk.map(async function(entry) {
          var urlParts = entry.url.split("/").filter(Boolean);
          var id = urlParts[urlParts.length - 1];
          await getKoName2(id);
        }));
        setKoProgress(Math.min(i + batchSize, list.length));
      }
    }

    fetchList();
  }, []);

  useEffect(function() {
    if (allList.length === 0) return;
    async function loadFirst() {
      setInitialLoading(true);
      var chunk = allList.slice(0, PAGE_SIZE);
      var results = await fetchBatch(chunk);
      setLoadedPokemon(results);
      offsetRef.current = PAGE_SIZE;
      hasMoreRef.current = true;
      setHasMore(true);
      setInitialLoading(false);
    }
    loadFirst();
  }, [allList]);

  // 연관검색어
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    var list = allListRef.current;
    var matched = [];
    list.forEach(function(entry) {
      var urlParts = entry.url.split("/").filter(Boolean);
      var id = urlParts[urlParts.length - 1];
      var ko = KO_CACHE2[id] || "";
      if (ko.includes(q) || entry.name.includes(q)) {
        matched.push({ id: id, ko: ko || entry.name, en: entry.name });
      }
    });
    matched.sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });
    setSuggestions(matched.slice(0, 8));
    setShowSuggestions(matched.length > 0);
  }, [search, koProgress]);

  // 검색
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
        var ko = (KO_CACHE2[id] || "").toLowerCase();
        return ko.includes(q) || entry.name.includes(q) || id === q;
      });
      var results = await fetchBatch(matched.slice(0, 40));
      setSearchResults(results);
      setSearchLoading(false);
    }
    var timer = setTimeout(doSearch, 300);
    return function() { clearTimeout(timer); };
  }, [search, koProgress]);

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

  return (
    <div>
      <div className="search-wrap" ref={searchWrapRef} style={{ marginBottom: "24px" }}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="예) 이상, 피카츄, pikachu, 25"
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

      {initialLoading ? (
        <div className="loading"><div className="loading-ball" /><p>포켓몬 불러오는 중...</p></div>
      ) : (
        <div>
          <p className="result-count">
            {isSearching ? searchResults.length + "마리 검색됨" : offsetRef.current + " / " + allList.length + "마리"}
          </p>
          {searchLoading ? (
            <div className="loading"><div className="loading-ball" /><p>검색 중...</p></div>
          ) : (
            <div className="poke-grid">
              {displayList.map(function(p) { return <DefenseCard key={p.id} pokemon={p} onClick={setSelected} />; })}
            </div>
          )}
          {!isSearching && loadingMore && (
            <div className="loading" style={{ padding: "16px 0" }}><div className="loading-ball" /><p>더 불러오는 중...</p></div>
          )}
        </div>
      )}

      {selected && <DefenseModal pokemon={selected} onClose={function() { setSelected(null); }} />}
    </div>
  );
}

// ── 메인 TypeChart 컴포넌트 ──
export default function TypeChart() {
  var [tab, setTab] = useState("chart");

  return (
    <div>
      <h1 className="page-title">🗂️ <span>타입</span> 상성표</h1>
      <p className="page-subtitle">타입별 공격/방어 상성을 확인하세요</p>

      <div className="page-tabs">
        <button className={"page-tab" + (tab === "chart" ? " active" : "")} onClick={function() { setTab("chart"); }}>
          전체 상성표
        </button>
        <button className={"page-tab" + (tab === "pokemon" ? " active" : "")} onClick={function() { setTab("pokemon"); }}>
          포켓몬별 방어 상성
        </button>
      </div>

      {tab === "chart" && <FullTypeChart />}
      {tab === "pokemon" && <PokemonDefenseTab />}
    </div>
  );
}