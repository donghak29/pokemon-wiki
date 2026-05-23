import { useState, useEffect, useCallback, useRef } from "react";

var ABILITY_CACHE = {};

async function fetchAbilityDetail(url) {
  if (ABILITY_CACHE[url]) return ABILITY_CACHE[url];
  try {
    var res = await fetch(url);
    var data = await res.json();
    var nameKoObj = data.names.find(function(n) { return n.language.name === "ko"; });
    var descKoObj = data.flavor_text_entries.find(function(f) { return f.language.name === "ko"; });
    var result = {
      name: data.name,
      nameKo: nameKoObj ? nameKoObj.name : data.name,
      desc: descKoObj ? descKoObj.flavor_text.replace(/\n|\f/g, " ") : "설명 없음",
      pokemon: data.pokemon
    };
    ABILITY_CACHE[url] = result;
    return result;
  } catch(e) { return null; }
}

var PKM_NAME_CACHE = {};

async function getPokemonKoName(id) {
  if (PKM_NAME_CACHE[id]) return PKM_NAME_CACHE[id];
  try {
    var res = await fetch("https://pokeapi.co/api/v2/pokemon-species/" + id);
    var data = await res.json();
    var nameKoObj = data.names.find(function(n) { return n.language.name === "ko"; });
    var ko = nameKoObj ? nameKoObj.name : "";
    PKM_NAME_CACHE[id] = ko;
    return ko;
  } catch(e) { return ""; }
}

function PokemonChip({ entry }) {
  var [nameKo, setNameKo] = useState("");
  var urlParts = entry.pokemon.url.split("/").filter(Boolean);
  var id = urlParts[urlParts.length - 1];

  useEffect(function() {
    if (parseInt(id) > 1025) return;
    getPokemonKoName(id).then(function(ko) { setNameKo(ko); });
  }, [id]);

  if (parseInt(id) > 1025) return null;
  if (!nameKo) return null;

  return (
    <span className={"ability-pokemon-chip" + (entry.is_hidden ? " chip-hidden" : "")}>
      {nameKo}
      {entry.is_hidden && <span className="chip-star"> *</span>}
    </span>
  );
}

function AbilityCard({ ability, defaultOpen }) {
  var [open, setOpen] = useState(defaultOpen || false);
  var [detail, setDetail] = useState(null);
  var [loading, setLoading] = useState(false);

  function handleToggle() {
    if (!open && !detail) {
      setLoading(true);
      fetchAbilityDetail(ability.url).then(function(d) {
        setDetail(d);
        setLoading(false);
      });
    }
    setOpen(function(v) { return !v; });
  }

  return (
    <div className={"ability-list-card pixel-card" + (open ? " open" : "")}>
      <div className="ability-list-header" onClick={handleToggle}>
        <span className="ability-list-name">{ability.nameKo || ability.name}</span>
        <span className="ability-list-arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="ability-list-body">
          {loading ? (
            <div className="loading" style={{ padding: "16px 0" }}>
              <div className="loading-ball" />
              <p>불러오는 중...</p>
            </div>
          ) : detail ? (
            <>
              <p className="ability-list-desc">{detail.desc}</p>
              <div className="ability-pokemon-section">
                <p className="ability-pokemon-label">이 특성을 가진 포켓몬</p>
                <div className="ability-pokemon-chips">
                  {detail.pokemon.map(function(entry, i) {
                    return <PokemonChip key={i} entry={entry} />;
                  })}
                </div>
                <p className="ability-hint" style={{ marginTop: "8px" }}>* 숨겨진 특성</p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 30;

export default function Ability() {
  var [allList, setAllList] = useState([]);
  var [displayed, setDisplayed] = useState([]);
  var [koMap, setKoMap] = useState({});
  var [search, setSearch] = useState("");
  var [suggestions, setSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [loading, setLoading] = useState(true);
  var [offset, setOffset] = useState(0);
  var [hasMore, setHasMore] = useState(true);
  var [loadingMore, setLoadingMore] = useState(false);
  var [isSearching, setIsSearching] = useState(false);
  var [searchResults, setSearchResults] = useState([]);

  var loadingMoreRef = useRef(false);
  var offsetRef = useRef(0);
  var hasMoreRef = useRef(true);
  var allListRef = useRef([]);
  var koMapRef = useRef({});
  var searchWrapRef = useRef(null);

  // 전체 특성 목록 + 한글 이름 캐싱
  useEffect(function() {
    async function fetchList() {
      setLoading(true);
      try {
        var res = await fetch("https://pokeapi.co/api/v2/ability?limit=400");
        var data = await res.json();
        allListRef.current = data.results;
        setAllList(data.results);

        // 한글 이름 백그라운드 캐싱
        preloadKo(data.results);

        // 첫 배치 로드
        var chunk = data.results.slice(0, PAGE_SIZE);
        setDisplayed(chunk);
        offsetRef.current = PAGE_SIZE;
        hasMoreRef.current = PAGE_SIZE < data.results.length;
        setOffset(PAGE_SIZE);
        setHasMore(PAGE_SIZE < data.results.length);
      } catch(e) { console.error(e); }
      setLoading(false);
    }

    async function preloadKo(list) {
      var batchSize = 20;
      for (var i = 0; i < list.length; i += batchSize) {
        var chunk = list.slice(i, i + batchSize);
        await Promise.all(chunk.map(async function(entry) {
          try {
            var detail = await fetchAbilityDetail(entry.url);
            if (detail) {
              koMapRef.current[entry.name] = detail.nameKo;
            }
          } catch(e) {}
        }));
        setKoMap(Object.assign({}, koMapRef.current));
      }
    }

    fetchList();
  }, []);

  // 무한 스크롤
  var loadMore = useCallback(async function() {
    if (loadingMoreRef.current || !hasMoreRef.current || isSearching) return;
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
    setDisplayed(function(prev) { return prev.concat(chunk); });
    var newOffset = currentOffset + PAGE_SIZE;
    offsetRef.current = newOffset;
    hasMoreRef.current = newOffset < allListRef.current.length;
    setHasMore(newOffset < allListRef.current.length);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [isSearching]);

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

  // 연관검색어
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    var list = allListRef.current;
    var matched = [];
    list.forEach(function(entry) {
      var ko = koMapRef.current[entry.name] || "";
      if (ko.includes(q) || entry.name.includes(q)) {
        matched.push({ name: entry.name, nameKo: ko || entry.name });
      }
    });
    setSuggestions(matched.slice(0, 8));
    setShowSuggestions(matched.length > 0);
  }, [search, koMap]);

  // 검색
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    var list = allListRef.current;
    var matched = list.filter(function(entry) {
      var ko = (koMapRef.current[entry.name] || "").toLowerCase();
      return ko.includes(q) || entry.name.includes(q);
    });
    setSearchResults(matched);
  }, [search, koMap]);

  // 바깥 클릭
  useEffect(function() {
    function handleClick(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); };
  }, []);

  var displayList = isSearching ? searchResults : displayed;

  return (
    <div>
      <h1 className="page-title">✨ <span>특성</span> 도감</h1>
      <p className="page-subtitle">포켓몬의 특성과 설명을 확인하세요</p>

      <div className="search-wrap" ref={searchWrapRef}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="특성 이름 검색 (한글/영어)"
          value={search}
          onChange={function(e) { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={function() { if (suggestions.length > 0) setShowSuggestions(true); }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestion-box">
            {suggestions.map(function(s, i) {
              return (
                <div key={i} className="suggestion-item" onMouseDown={function() { setSearch(s.nameKo); setShowSuggestions(false); }}>
                  <span className="suggestion-ko">{s.nameKo}</span>
                  <span className="suggestion-en">{s.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="result-count" style={{ marginBottom: "16px" }}>
        {isSearching ? searchResults.length + "개 검색됨" : offset + " / " + allList.length + "개"}
      </p>

      {loading ? (
        <div className="loading"><div className="loading-ball" /><p>특성 불러오는 중...</p></div>
      ) : (
        <div className="ability-list">
          {displayList.map(function(entry) {
            return (
              <AbilityCard
                key={entry.name}
                ability={{ name: entry.name, nameKo: koMapRef.current[entry.name] || entry.name, url: entry.url }}
              />
            );
          })}
          {!isSearching && loadingMore && (
            <div className="loading" style={{ padding: "16px 0" }}><div className="loading-ball" /><p>더 불러오는 중...</p></div>
          )}
          {!isSearching && !hasMore && (
            <p className="result-count" style={{ textAlign: "center", padding: "16px 0" }}>전체 특성 로드 완료!</p>
          )}
        </div>
      )}
    </div>
  );
}