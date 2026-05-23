import { useState, useEffect, useCallback, useRef } from "react";

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

const MULTIPLIER_LABELS = {
  4: "데미지 x4", 2: "데미지 x2", 0.5: "데미지 x0.5", 0.25: "데미지 x0.25", 0: "데미지 없음"
};

const CHALLENGE_MODES = [10, 25, 50, 100];

function getDefenseMatchup(types) {
  var result = {};
  TYPES.forEach(function(atkType) {
    var mult = 1;
    types.forEach(function(defType) {
      mult *= (CHART[atkType] && CHART[atkType][defType] !== undefined) ? CHART[atkType][defType] : 1;
    });
    result[atkType] = mult;
  });
  return result;
}

var POKEMON_CACHE = {};

async function fetchRandomPokemon() {
  var id = Math.floor(Math.random() * 898) + 1;
  if (POKEMON_CACHE[id]) return POKEMON_CACHE[id];
  try {
    var responses = await Promise.all([
      fetch("https://pokeapi.co/api/v2/pokemon/" + id),
      fetch("https://pokeapi.co/api/v2/pokemon-species/" + id)
    ]);
    var basic = await responses[0].json();
    var species = await responses[1].json();
    var nameKoObj = species.names.find(function(n) { return n.language.name === "ko"; });
    var nameKo = nameKoObj ? nameKoObj.name : basic.name;
    var result = Object.assign({}, basic, { nameKo: nameKo });
    POKEMON_CACHE[id] = result;
    return result;
  } catch(e) { return null; }
}

function getImgSrc(pokemon) {
  return (pokemon.sprites && pokemon.sprites.other && pokemon.sprites.other["official-artwork"] && pokemon.sprites.other["official-artwork"].front_default) || (pokemon.sprites && pokemon.sprites.front_default);
}

// ── 시작 화면 ──
function StartScreen({ quizType, onStart }) {
  var [mode, setMode] = useState(null);

  var title = quizType === "defense" ? "⚔️ 방어 상성 맞추기" : "👤 실루엣 맞추기";
  var desc = quizType === "defense"
    ? "포켓몬의 사진과 타입을 보고\n방어 상성 타입을 맞춰보세요!"
    : "실루엣만 보고 포켓몬 이름을\n맞춰보세요! 힌트도 있어요.";

  return (
    <div className="start-screen">
      <p className="start-title">{title}</p>
      <p className="start-desc">{desc}</p>

      <p className="start-mode-label">도전 모드 선택</p>
      <div className="start-modes">
        {CHALLENGE_MODES.map(function(m) {
          return (
            <button
              key={m}
              className={"start-mode-btn" + (mode === m ? " active" : "")}
              onClick={function() { setMode(m); }}
            >
              {m}문제
            </button>
          );
        })}
      </div>

      <button
        className="pixel-btn start-btn"
        disabled={!mode}
        onClick={function() { if (mode) onStart(mode); }}
      >
        퀴즈 시작 ▶
      </button>
    </div>
  );
}

// ── 결과 화면 ──
function ResultScreen({ score, total, onRestart, onHome }) {
  var pct = Math.round((score / total) * 100);
  var grade = pct === 100 ? "퍼펙트! 🏆" : pct >= 80 ? "훌륭해요! 🥇" : pct >= 60 ? "잘했어요! 🥈" : pct >= 40 ? "분발하세요! 🥉" : "포켓몬 박사의 길은 멀어요... 💪";

  return (
    <div className="result-screen pixel-card">
      <p className="result-grade">{grade}</p>
      <div className="result-score-big">
        <span className="result-num">{score}</span>
        <span className="result-sep"> / </span>
        <span className="result-total">{total}</span>
      </div>
      <p className="result-pct">{pct}% 정답률</p>

      <div className="result-btns">
        <button className="pixel-btn" onClick={onRestart}>다시 도전</button>
        <button className="pixel-btn" style={{ borderColor: "var(--blue)", color: "var(--blue)" }} onClick={onHome}>처음으로</button>
      </div>
    </div>
  );
}

// ── 퀴즈 1: 방어 상성 맞추기 ──
function DefenseQuiz({ total, onFinish }) {
  var [pokemon, setPokemon] = useState(null);
  var [loading, setLoading] = useState(true);
  var [question, setQuestion] = useState(null);
  var [selected, setSelected] = useState([]);
  var [submitted, setSubmitted] = useState(false);
  var [isCorrect, setIsCorrect] = useState(false);
  var [score, setScore] = useState(0);
  var [qNum, setQNum] = useState(1);
  var [showAnswer, setShowAnswer] = useState(false);
  var usedRef = useRef(new Set()); // 중복 방지용

  var loadQuestion = useCallback(async function() {
    setLoading(true);
    setSelected([]);
    setSubmitted(false);
    setIsCorrect(false);
    setShowAnswer(false);

    var pkm = null;
    var targetMult = null;
    var answers = null;
    var matchup = null;
    var attempts = 0;

    while (attempts < 50) {
      pkm = await fetchRandomPokemon();
      if (!pkm) { attempts++; continue; }
      var typeNames = pkm.types.map(function(t) { return t.type.name; });
      matchup = getDefenseMatchup(typeNames);
      var available = [4, 2, 0.5, 0.25, 0].filter(function(m) {
        return Object.values(matchup).some(function(v) { return v === m; });
      });
      var candidateMult = available[Math.floor(Math.random() * available.length)];
      var key = pkm.id + "-" + candidateMult;
      if (!usedRef.current.has(key)) {
        usedRef.current.add(key);
        targetMult = candidateMult;
        answers = Object.keys(matchup).filter(function(t) { return matchup[t] === targetMult; });
        break;
      }
      attempts++;
    }

    setPokemon(pkm);
    setQuestion({ matchup: matchup, targetMult: targetMult, answers: answers });
    setLoading(false);
  }, []);

  useEffect(function() { loadQuestion(); }, [loadQuestion]);

  function toggleType(type) {
    if (submitted) return;
    setSelected(function(prev) {
      return prev.includes(type) ? prev.filter(function(t) { return t !== type; }) : prev.concat(type);
    });
  }

  function handleSubmit() {
    if (selected.length === 0) return;
    var correct = question.answers.slice().sort().join(",") === selected.slice().sort().join(",");
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) setScore(function(s) { return s + 1; });
  }

  // 다시 도전하기 - 맞은 타입 유지, 틀린 타입만 제거
  function handleRetry() {
    // 맞은 타입만 남기고 나머지 제거
    var correctOnes = selected.filter(function(t) { return question.answers.includes(t); });
    setSelected(correctOnes);
    setSubmitted(false);
    setIsCorrect(false);
  }

  function handleNext() {
    if (qNum >= total) {
      onFinish(score);
    } else {
      setQNum(function(n) { return n + 1; });
      loadQuestion();
    }
  }

  if (loading) return <div className="loading"><div className="loading-ball" /><p>포켓몬 불러오는 중...</p></div>;
  if (!pokemon || !question) return null;

  return (
    <div className="quiz-wrap">
      <div className="quiz-progress-bar-wrap">
        <div className="quiz-progress-bar" style={{ width: ((qNum - 1) / total * 100) + "%" }} />
      </div>
      <div className="quiz-meta">
        <span className="quiz-meta-num">{qNum} / {total}</span>
        <span className="quiz-meta-score">점수 <span style={{ color: "var(--yellow)" }}>{score}</span></span>
      </div>

      <div className="quiz-card pixel-card">
        <div className="quiz-pokemon">
          <img src={getImgSrc(pokemon)} alt={pokemon.nameKo} className="quiz-pokemon-img" />
          <div className="quiz-pokemon-info">
            <p className="quiz-pokemon-name">{pokemon.nameKo}</p>
            <div className="quiz-pokemon-types">
              {pokemon.types.map(function(t) {
                return <span key={t.type.name} className={"type-badge type-" + t.type.name}>{TYPE_KO[t.type.name]}</span>;
              })}
            </div>
          </div>
        </div>

        <div>
          <p className="quiz-question-text">
            이 포켓몬이 <span className="quiz-highlight">{MULTIPLIER_LABELS[question.targetMult]}</span>를 받는 타입은?
          </p>
          <p className="quiz-question-sub">
            해당하는 타입을 모두 선택하세요 &nbsp;
            <span className="quiz-answer-count">정답 {question.answers.length}개</span>
          </p>
        </div>

        <div className="quiz-type-grid">
          {TYPES.map(function(type) {
            var isSel = selected.includes(type);
            var isAns = question.answers.includes(type);
            var isWrong = submitted && isSel && !isAns;
            var isCorrectSelected = isSel && isAns; // 맞은 타입 (제출 전후 모두)
            var isShowCorrect = submitted && showAnswer && isAns && !isSel;
            var isLocked = isCorrectSelected; // 맞은 타입은 클릭 불가
            return (
              <span
                key={type}
                className={
                  "type-badge type-" + type +
                  (isSel && !isCorrectSelected && !submitted ? " quiz-selected" : "") +
                  (isWrong ? " quiz-wrong" : "") +
                  (isCorrectSelected ? " quiz-correct-locked" : "") +
                  (isShowCorrect ? " quiz-correct" : "")
                }
                style={{ cursor: isLocked ? "default" : "pointer", fontSize: "9px", padding: "6px 10px" }}
                onClick={function() {
                  if (isLocked) return; // 맞은 타입은 클릭 불가
                  toggleType(type);
                }}
              >
                {TYPE_KO[type]}
              </span>
            );
          })}
        </div>

        {!submitted && (
          <button className="pixel-btn quiz-submit-btn" onClick={handleSubmit} disabled={selected.length === 0}>정답 제출</button>
        )}

        {submitted && isCorrect && (
          <div className="quiz-result">
            <p className="quiz-result-text result-correct">🎉 정답!</p>
            <button className="pixel-btn" onClick={handleNext} style={{ marginTop: "12px" }}>
              {qNum >= total ? "결과 보기" : "다음 문제"}
            </button>
          </div>
        )}

        {submitted && !isCorrect && (
          <div className="quiz-result">
            <p className="quiz-result-text result-wrong">❌ 다시 한번 도전해보세요!</p>
            {!showAnswer ? (
              <div className="retry-btns">
                <button className="pixel-btn" onClick={handleRetry}>다시 도전하기</button>
                <button className="pixel-btn" style={{ borderColor: "var(--text-muted)", color: "var(--text-muted)" }} onClick={function() { setShowAnswer(true); }}>정답 보기</button>
              </div>
            ) : (
              <div>
                <p className="quiz-answer-text" style={{ marginBottom: "12px" }}>
                  정답: {question.answers.map(function(t) { return TYPE_KO[t]; }).join(", ")}
                </p>
                <button className="pixel-btn" onClick={handleNext}>
                  {qNum >= total ? "결과 보기" : "다음 문제"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 퀴즈 2: 실루엣 맞추기 ──
function SilhouetteQuiz({ total, onFinish }) {
  var [pokemon, setPokemon] = useState(null);
  var [loading, setLoading] = useState(true);
  var [hint, setHint] = useState(0);
  var [input, setInput] = useState("");
  var [submitted, setSubmitted] = useState(false);
  var [isCorrect, setIsCorrect] = useState(false);
  var [showAnswer, setShowAnswer] = useState(false);
  var [locked, setLocked] = useState(false); // 입력 잠금
  var [score, setScore] = useState(0);
  var [qNum, setQNum] = useState(1);
  var topRef = useRef(null);

  var loadQuestion = useCallback(async function() {
    setLoading(true);
    setHint(0);
    setInput("");
    setSubmitted(false);
    setIsCorrect(false);
    setShowAnswer(false);
    setLocked(false);
    var pkm = null;
    while (!pkm) { pkm = await fetchRandomPokemon(); }
    setPokemon(pkm);
    setLoading(false);
  }, []);

  useEffect(function() { loadQuestion(); }, [loadQuestion]);

  function handleSubmit() {
    if (!input.trim() || locked) return;
    var ans = input.trim().toLowerCase();
    var correct = ans === pokemon.nameKo || ans === pokemon.name.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      setScore(function(s) { return s + 1; });
      setHint(2);
    } else {
      // 틀리면 입력 잠금
      setLocked(true);
    }
  }

  function handleKeyDown(e) { if (e.key === "Enter") handleSubmit(); }

  function handleNext(addScore) {
    var newScore = score + (addScore ? 1 : 0);
    if (qNum >= total) {
      onFinish(newScore);
    } else {
      setQNum(function(n) { return n + 1; });
      setScore(newScore);
      loadQuestion();
    }
  }

  // 다시 도전하기 - 입력만 초기화, 잠금 해제
  function handleRetry() {
    setSubmitted(false);
    setInput("");
    setLocked(false);
  }

  // 정답 보기 - 잠금 유지, 이미지 공개
  function handleShowAnswer() {
    setShowAnswer(true);
    setHint(2);
    setLocked(true);
  }

  if (loading) return <div className="loading"><div className="loading-ball" /><p>포켓몬 불러오는 중...</p></div>;
  if (!pokemon) return null;

  var imgSrc = getImgSrc(pokemon);

  var imgStyle = {};
  if (hint === 0) {
    imgStyle = { filter: "brightness(0) contrast(1)" };
  } else if (hint === 1) {
    imgStyle = { filter: "blur(6px) brightness(0.3)", imageRendering: "pixelated" };
  } else {
    imgStyle = { filter: "none" };
  }

  return (
    <div className="quiz-wrap" ref={topRef}>
      <div className="quiz-progress-bar-wrap">
        <div className="quiz-progress-bar" style={{ width: ((qNum - 1) / total * 100) + "%" }} />
      </div>
      <div className="quiz-meta">
        <span className="quiz-meta-num">{qNum} / {total}</span>
        <span className="quiz-meta-score">점수 <span style={{ color: "var(--yellow)" }}>{score}</span></span>
      </div>

      <div className="quiz-card pixel-card">
        <p className="quiz-question-text" style={{ textAlign: "center" }}>이 포켓몬의 이름은?</p>

        <div className="silhouette-stage">
          <span className={"stage-badge " + (hint === 0 ? "stage-active" : "")}>실루엣</span>
          <span className="stage-arrow">→</span>
          <span className={"stage-badge " + (hint === 1 ? "stage-active" : "")}>힌트</span>
          <span className="stage-arrow">→</span>
          <span className={"stage-badge " + (hint === 2 ? "stage-active" : "")}>공개</span>
        </div>

        <div className="silhouette-img-wrap">
          <img src={imgSrc} alt="?" className="silhouette-img" style={imgStyle} />
        </div>

        {/* 입력칸 - 잠금 아닐 때만 활성화 */}
        {!showAnswer && (
          <>
            {!locked && (
              <div className="silhouette-hints">
                {hint < 1 && (
                  <button className="pixel-btn hint-btn" onClick={function() { setHint(1); }}>힌트 보기</button>
                )}
                {hint === 1 && (
                  <button className="pixel-btn hint-btn" onClick={function() { setHint(2); setLocked(true); }}>정답 공개</button>
                )}
              </div>
            )}
            <div className="silhouette-input-wrap">
              <input
                className="search-input"
                type="text"
                placeholder="포켓몬 이름 입력 (한글/영어)"
                value={input}
                onChange={function(e) { if (!locked) setInput(e.target.value); }}
                onKeyDown={handleKeyDown}
                disabled={locked}
                style={{ marginBottom: "8px", opacity: locked ? 0.5 : 1 }}
              />
              {!locked && (
                <button className="pixel-btn quiz-submit-btn" onClick={handleSubmit} disabled={!input.trim()}>정답 제출</button>
              )}
            </div>
          </>
        )}

        {/* 힌트로 정답 공개했을 때 */}
        {!submitted && hint === 2 && locked && !showAnswer && (
          <div className="quiz-result">
            <p className="quiz-answer-text" style={{ marginBottom: "12px" }}>
              정답: <span style={{ color: "var(--accent)" }}>{pokemon.nameKo}</span> ({pokemon.name})
            </p>
            <button className="pixel-btn" onClick={function() { handleNext(false); }}>
              {qNum >= total ? "결과 보기" : "다음 문제"}
            </button>
          </div>
        )}

        {submitted && isCorrect && (
          <div className="quiz-result">
            <p className="quiz-result-text result-correct">🎉 정답!</p>
            <button className="pixel-btn" onClick={function() { handleNext(false); }} style={{ marginTop: "12px" }}>
              {qNum >= total ? "결과 보기" : "다음 문제"}
            </button>
          </div>
        )}

        {submitted && !isCorrect && !showAnswer && (
          <div className="quiz-result">
            <p className="quiz-result-text result-wrong">❌ 다시 한번 도전해보세요!</p>
            <div className="retry-btns">
              <button className="pixel-btn" onClick={handleRetry}>다시 도전하기</button>
              <button className="pixel-btn" style={{ borderColor: "var(--text-muted)", color: "var(--text-muted)" }} onClick={handleShowAnswer}>정답 보기</button>
            </div>
          </div>
        )}

        {showAnswer && (
          <div className="quiz-result">
            <p className="quiz-answer-text" style={{ marginBottom: "12px" }}>
              정답: <span style={{ color: "var(--accent)" }}>{pokemon.nameKo}</span> ({pokemon.name})
            </p>
            <button className="pixel-btn" onClick={function() { handleNext(false); }}>
              {qNum >= total ? "결과 보기" : "다음 문제"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 ──
export default function TypeCalculator() {
  var [quizTab, setQuizTab] = useState("defense");
  var [phase, setPhase] = useState("home"); // home | playing | result
  var [mode, setMode] = useState(null);
  var [finalScore, setFinalScore] = useState(0);

  function handleStart(m) {
    setMode(m);
    setPhase("playing");
  }

  function handleFinish(s) {
    setFinalScore(s);
    setPhase("result");
  }

  function handleRestart() {
    setPhase("home");
  }

  return (
    <div>
      <h1 className="page-title">🎮 <span>포켓몬</span> 퀴즈</h1>
      <p className="page-subtitle">포켓몬 지식을 테스트해보세요!</p>

      {phase !== "result" && (
        <div className="page-tabs">
          <button className={"page-tab" + (quizTab === "defense" ? " active" : "")} onClick={function() { setQuizTab("defense"); setPhase("home"); }}>
            ⚔️ 방어 상성 맞추기
          </button>
          <button className={"page-tab" + (quizTab === "silhouette" ? " active" : "")} onClick={function() { setQuizTab("silhouette"); setPhase("home"); }}>
            👤 실루엣 맞추기
          </button>
        </div>
      )}

      {phase === "home" && (
        <StartScreen quizType={quizTab} onStart={handleStart} />
      )}

      {phase === "playing" && quizTab === "defense" && (
        <DefenseQuiz total={mode} onFinish={handleFinish} key={mode + "-" + Date.now()} />
      )}

      {phase === "playing" && quizTab === "silhouette" && (
        <SilhouetteQuiz total={mode} onFinish={handleFinish} key={mode + "-" + Date.now()} />
      )}

      {phase === "result" && (
        <ResultScreen
          score={finalScore}
          total={mode}
          onRestart={function() { setPhase("playing"); }}
          onHome={handleRestart}
        />
      )}
    </div>
  );
}