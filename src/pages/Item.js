import { useState, useEffect, useRef } from "react";

const ITEM_WHITELIST = [
  // 구애 시리즈
  "choice-band","choice-scarf","choice-specs",
  // 생명/포커스
  "life-orb","focus-sash","focus-band",
  // 회복/방어
  "leftovers","black-sludge","rocky-helmet","assault-vest",
  "eviolite","weakness-policy","air-balloon",
  "shed-shell","safety-goggles","utility-umbrella",
  "clear-amulet","covert-cloak","mirror-herb",
  "punching-glove","loaded-dice","heavy-duty-boots",
  "protective-pads","eject-button","eject-pack",
  "room-service","terrain-extender","blunder-policy",
  // 상태이상 유발
  "toxic-orb","flame-orb",
  // 기술 강화
  "muscle-band","wise-glasses","expert-belt","scope-lens",
  "wide-lens","zoom-lens","kings-rock","razor-claw","razor-fang",
  "metronome","throat-spray","absorb-bulb","luminous-moss",
  "snowball","cell-battery","adrenaline-orb",
  // 타입 강화
  "charcoal","mystic-water","miracle-seed","magnet",
  "twisted-spoon","black-belt","poison-barb","soft-sand",
  "sharp-beak","spell-tag","never-melt-ice","silk-scarf",
  "metal-coat","hard-stone","silver-powder","black-glasses",
  "dragon-scale","fairy-feather",
  // 종족 전용
  "thick-club","light-ball","deep-sea-tooth","deep-sea-scale",
  "leek","lucky-punch","adamant-orb","lustrous-orb","griseous-orb",
  "rusted-sword","rusted-shield","soul-dew",
  // 메가스톤
  "venusaurite","charizardite-x","charizardite-y","blastoisinite",
  "alakazite","gengarite","kangaskhanite","gyaradosite","aerodactylite",
  "ampharosite","scizite","heracronite","houndoominite","manectite",
  "banettite","absolite","gardevoirite","mawilite","aggronite",
  "medichamite","salamencite","metagrossite","latiasite","latiosite",
  "lopunnite","garchompite","lucarionite","abomasite","galladite",
  "audinite","diancite","steelixite","pidgeotite","slowbronite",
  "swampertite","sceptilite","blazikenite","beedrillite","tyranitarite",
  // 나무 열매 - 상태이상 회복
  "cheri-berry","chesto-berry","pecha-berry","rawst-berry",
  "aspear-berry","persim-berry","lum-berry",
  // 나무 열매 - HP 회복
  "sitrus-berry","figy-berry","wiki-berry","mago-berry",
  "aguav-berry","iapapa-berry","leppa-berry",
  // 나무 열매 - 타입 반감
  "occa-berry","passho-berry","wacan-berry","rindo-berry",
  "yache-berry","chople-berry","kebia-berry","shuca-berry",
  "coba-berry","payapa-berry","tanga-berry","charti-berry",
  "kasib-berry","haban-berry","colbur-berry","babiri-berry",
  "chilan-berry","roseli-berry",
  // 나무 열매 - 능력치 강화
  "liechi-berry","ganlon-berry","salac-berry","petaya-berry",
  "apicot-berry","lansat-berry","starf-berry","micle-berry",
  "custap-berry","jaboca-berry","rowap-berry","kee-berry","maranga-berry",
  // 기타
  "white-herb","power-herb","mental-herb","iron-ball",
  "lagging-tail","full-incense","ring-target",
];

const CATEGORY_MAP = {
  "구애 시리즈": ["choice-band","choice-scarf","choice-specs"],
  "생명/포커스": ["life-orb","focus-sash","focus-band"],
  "회복/방어": ["leftovers","black-sludge","rocky-helmet","assault-vest","eviolite","air-balloon","shed-shell","safety-goggles","utility-umbrella","clear-amulet","covert-cloak","mirror-herb","punching-glove","loaded-dice","heavy-duty-boots","protective-pads","eject-button","eject-pack","room-service","terrain-extender","blunder-policy"],
  "상태이상 유발": ["toxic-orb","flame-orb"],
  "기술 강화": ["muscle-band","wise-glasses","expert-belt","scope-lens","wide-lens","zoom-lens","kings-rock","razor-claw","razor-fang","metronome","throat-spray","absorb-bulb","luminous-moss","snowball","cell-battery","adrenaline-orb"],
  "타입 강화": ["charcoal","mystic-water","miracle-seed","magnet","twisted-spoon","black-belt","poison-barb","soft-sand","sharp-beak","spell-tag","never-melt-ice","silk-scarf","metal-coat","hard-stone","silver-powder","black-glasses","dragon-scale","fairy-feather"],
  "종족 전용": ["thick-club","light-ball","deep-sea-tooth","deep-sea-scale","leek","lucky-punch","adamant-orb","lustrous-orb","griseous-orb","rusted-sword","rusted-shield","soul-dew"],
  "메가스톤": ["venusaurite","charizardite-x","charizardite-y","blastoisinite","alakazite","gengarite","kangaskhanite","gyaradosite","aerodactylite","ampharosite","scizite","heracronite","houndoominite","manectite","banettite","absolite","gardevoirite","mawilite","aggronite","medichamite","salamencite","metagrossite","latiasite","latiosite","lopunnite","garchompite","lucarionite","abomasite","galladite","audinite","diancite","steelixite","pidgeotite","slowbronite","swampertite","sceptilite","blazikenite","beedrillite","tyranitarite"],
  "나무 열매 - 상태이상 회복": ["cheri-berry","chesto-berry","pecha-berry","rawst-berry","aspear-berry","persim-berry","lum-berry"],
  "나무 열매 - HP 회복": ["sitrus-berry","figy-berry","wiki-berry","mago-berry","aguav-berry","iapapa-berry","leppa-berry"],
  "나무 열매 - 타입 반감": ["occa-berry","passho-berry","wacan-berry","rindo-berry","yache-berry","chople-berry","kebia-berry","shuca-berry","coba-berry","payapa-berry","tanga-berry","charti-berry","kasib-berry","haban-berry","colbur-berry","babiri-berry","chilan-berry","roseli-berry"],
  "나무 열매 - 능력치 강화": ["liechi-berry","ganlon-berry","salac-berry","petaya-berry","apicot-berry","lansat-berry","starf-berry","micle-berry","custap-berry","jaboca-berry","rowap-berry","kee-berry","maranga-berry"],
  "기타": ["white-herb","power-herb","mental-herb","iron-ball","lagging-tail","full-incense","ring-target"],
};

var ITEM_CACHE = {};

async function fetchItemDetail(name) {
  if (ITEM_CACHE[name]) return ITEM_CACHE[name];
  try {
    var res = await fetch("https://pokeapi.co/api/v2/item/" + name);
    if (!res.ok) return null;
    var data = await res.json();
    var nameKoObj = data.names.find(function(n) { return n.language.name === "ko"; });
    var descKoObj = data.flavor_text_entries.find(function(f) { return f.language.name === "ko"; });

    var result = {
      name: data.name,
      nameKo: nameKoObj ? nameKoObj.name : data.name,
      desc: descKoObj ? descKoObj.flavor_text.replace(/\n|\f/g, " ") : (data.flavor_text_entries.find(function(f) { return f.language.name === "en"; }) ? data.flavor_text_entries.find(function(f) { return f.language.name === "en"; }).flavor_text.replace(/\n|\f/g, " ") : ""),
      sprite: data.sprites && data.sprites.default ? data.sprites.default : null,
    };
    ITEM_CACHE[name] = result;
    return result;
  } catch(e) { return null; }
}

function ItemCard({ itemName }) {
  var [detail, setDetail] = useState(null);
  var [open, setOpen] = useState(false);
  var [loaded, setLoaded] = useState(false);

  useEffect(function() {
    fetchItemDetail(itemName).then(function(d) {
      setDetail(d);
      setLoaded(true);
    });
  }, [itemName]);

  if (!loaded || !detail) return null;

  return (
    <div className={"item-card pixel-card" + (open ? " open" : "")} onClick={function() { setOpen(function(v) { return !v; }); }}>
      <div className="item-card-header">
        {detail.sprite && <img src={detail.sprite} alt={detail.nameKo} className="item-sprite" />}
        <span className="item-name">{detail.nameKo}</span>
        <span className="item-arrow">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="item-card-body">
          <p className="item-desc">{detail.desc || "설명 없음"}</p>
        </div>
      )}
    </div>
  );
}

export default function Item() {
  var [search, setSearch] = useState("");
  var [categoryFilter, setCategoryFilter] = useState("전체");
  var [koMap, setKoMap] = useState({});
  var [suggestions, setSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [loadingDone, setLoadingDone] = useState(false);
  var koMapRef = useRef({});
  var searchWrapRef = useRef(null);

  // 한글 이름 미리 캐싱
  useEffect(function() {
    async function preload() {
      var batchSize = 20;
      for (var i = 0; i < ITEM_WHITELIST.length; i += batchSize) {
        var chunk = ITEM_WHITELIST.slice(i, i + batchSize);
        await Promise.all(chunk.map(async function(name) {
          var detail = await fetchItemDetail(name);
          if (detail) koMapRef.current[name] = detail.nameKo;
        }));
        setKoMap(Object.assign({}, koMapRef.current));
      }
      setLoadingDone(true);
    }
    preload();
  }, []);

  // 연관검색어
  useEffect(function() {
    var q = search.trim().toLowerCase();
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    var matched = ITEM_WHITELIST.filter(function(name) {
      var ko = (koMapRef.current[name] || "").toLowerCase();
      return ko.includes(q) || name.includes(q);
    }).map(function(name) {
      return { name: name, nameKo: koMapRef.current[name] || name };
    });
    setSuggestions(matched.slice(0, 8));
    setShowSuggestions(matched.length > 0);
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

  // 필터링
  var displayItems = ITEM_WHITELIST.filter(function(name) {
    var q = search.trim().toLowerCase();
    var ko = (koMapRef.current[name] || "").toLowerCase();
    var matchSearch = !q || ko.includes(q) || name.includes(q);
    var matchCat = categoryFilter === "전체" || (CATEGORY_MAP[categoryFilter] && CATEGORY_MAP[categoryFilter].includes(name));
    return matchSearch && matchCat;
  });

  var categories = ["전체"].concat(Object.keys(CATEGORY_MAP));

  return (
    <div>
      <h1 className="page-title">🎒 <span>도구</span> 도감</h1>
      <p className="page-subtitle">실전 배틀에서 쓰이는 도구를 확인하세요</p>

      <div className="search-wrap" ref={searchWrapRef}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="도구 이름 검색 (한글/영어)"
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

      <div className="item-category-wrap">
        {categories.map(function(cat) {
          return (
            <button
              key={cat}
              className={"gen-btn" + (categoryFilter === cat ? " active" : "")}
              onClick={function() { setCategoryFilter(cat); setSearch(""); }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {!loadingDone && (
        <div className="loading" style={{ padding: "16px 0" }}>
          <div className="loading-ball" />
          <p>도구 불러오는 중...</p>
        </div>
      )}

      <p className="result-count" style={{ marginBottom: "16px" }}>{displayItems.length}개</p>

      <div className="item-grid">
        {displayItems.map(function(name) {
          return <ItemCard key={name} itemName={name} />;
        })}
      </div>
    </div>
  );
}