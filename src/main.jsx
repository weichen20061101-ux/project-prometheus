import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Flame,
  Lightbulb,
  Lock,
  NotebookPen,
  Play,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import analystPool from "../data/quest-pool/analyst.json";
import englishPool from "../data/quest-pool/english.json";
import growthPool from "../data/quest-pool/growth.json";
import tradingPool from "../data/quest-pool/trading.json";
import "./styles.css";

const STORAGE_KEY = "prometheus-app-state-v1";
const BOSS_START_HP = 100;
const OTHER_TOPICS = ["english", "trading", "growth"];
const TOPIC_ORDER = ["analyst", "english", "trading", "growth"];
const TOPIC_META = {
  analyst: {
    id: "analyst",
    title: "分析師之路",
    goal: "三年後具備獨立研究公司的能力",
    skills: ["經濟學", "財報分析", "公司分析", "產業分析", "總經", "投資學"],
    primarySkill: "財報分析",
    baseMaxExp: 300,
    expStep: 60,
  },
  english: {
    id: "english",
    title: "英文",
    goal: "能閱讀英文年報與法說會",
    skills: ["財經英文", "閱讀", "寫作", "字彙"],
    primarySkill: "財經英文",
    baseMaxExp: 120,
    expStep: 40,
  },
  trading: {
    id: "trading",
    title: "交易系統",
    goal: "建立自己的交易框架",
    skills: ["技術分析", "風控", "回測", "紀律"],
    primarySkill: "風控紀律",
    baseMaxExp: 120,
    expStep: 40,
  },
  growth: {
    id: "growth",
    title: "個人成長",
    goal: "建立穩定執行系統",
    skills: ["專注", "時間管理", "深度工作", "習慣建立"],
    primarySkill: "深度工作",
    baseMaxExp: 150,
    expStep: 50,
  },
};
const DEFAULT_PROGRESS = {
  analyst: { level: 1, exp: 80, maxExp: 300 },
  english: { level: 0, exp: 30, maxExp: 120 },
  trading: { level: 0, exp: 0, maxExp: 120 },
  growth: { level: 1, exp: 45, maxExp: 150 },
};
const QUEST_POOLS = {
  analyst: analystPool,
  english: englishPool,
  trading: tradingPool,
  growth: growthPool,
};

function App() {
  const initialState = useMemo(loadInitialState, []);
  const [activeStory, setActiveStory] = useState(initialState.activeStory);
  const [progressByTopic, setProgressByTopic] = useState(initialState.progressByTopic);
  const [dailyState, setDailyState] = useState(initialState.dailyState);

  const questIndex = useMemo(function () {
    const entries = [];
    Object.values(QUEST_POOLS).forEach(function (pool) {
      pool.forEach(function (quest) {
        entries.push([quest.id, quest]);
      });
    });
    return Object.fromEntries(entries);
  }, []);

  const gateQuest = dailyState.gateQuestId ? questIndex[dailyState.gateQuestId] : null;
  const unlockedQuests = useMemo(function () {
    return OTHER_TOPICS.map(function (topic) {
      const questId = dailyState.topicQuestIds[topic];
      return questId ? questIndex[questId] : null;
    }).filter(Boolean);
  }, [dailyState.topicQuestIds, questIndex]);
  const focusedQuestId = dailyState.focusQuestId || dailyState.gateQuestId;
  const focusedQuest = focusedQuestId ? questIndex[focusedQuestId] : gateQuest;
  const currentStory = TOPIC_META[activeStory];
  const totalEarnedExp = useMemo(function () {
    return Object.values(dailyState.awardedExp).reduce(function (sum, value) {
      return sum + value;
    }, 0);
  }, [dailyState.awardedExp]);
  const completedCount = dailyState.submittedQuestIds.length;
  const focusMinutes = completedCount === 0 ? "0/60" : completedCount === 1 ? "30/60" : "50/60";
  const gateCompleted = dailyState.submittedQuestIds.includes(dailyState.gateQuestId);

  useEffect(function () {
    const timer = window.setInterval(function () {
      setDailyState(function (current) {
        let changed = false;
        const nextTimeLeft = { ...current.timeLeft };
        current.startedQuestIds.forEach(function (questId) {
          if (!current.submittedQuestIds.includes(questId) && nextTimeLeft[questId] > 0) {
            nextTimeLeft[questId] -= 1;
            changed = true;
          }
        });
        if (!changed) {
          return current;
        }
        return { ...current, timeLeft: nextTimeLeft };
      });
    }, 1000);
    return function () {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(function () {
    saveAppState({
      activeStory,
      progressByTopic,
      dailyState,
    });
  }, [activeStory, progressByTopic, dailyState]);

  function startQuest(quest) {
    setDailyState(function (current) {
      const startedQuestIds = current.startedQuestIds.includes(quest.id)
        ? current.startedQuestIds
        : [...current.startedQuestIds, quest.id];
      return {
        ...current,
        startedQuestIds,
        focusQuestId: quest.id,
        reviewMessage:
          quest.type === "daily_gate"
            ? "今日必修任務已開始。先完成分析師首題，其他主題才會解鎖。"
            : quest.title + " 已開始。請先讀題，再用自己的話作答。",
        hintLevel: 0,
        timeLeft: {
          ...current.timeLeft,
          [quest.id]: current.timeLeft[quest.id] ?? quest.seconds,
        },
      };
    });
  }

  function updateAnswer(id, value) {
    setDailyState(function (current) {
      return {
        ...current,
        answers: {
          ...current.answers,
          [id]: value,
        },
      };
    });
  }

  function showHint() {
    if (!focusedQuest) {
      return;
    }
    setDailyState(function (current) {
      return {
        ...current,
        focusQuestId: focusedQuest.id,
        hintLevel: Math.min(focusedQuest.hints.length, current.hintLevel + 1),
      };
    });
  }

  function submitQuest(quest) {
    const answer = (dailyState.answers[quest.id] || "").trim();
    if (!dailyState.startedQuestIds.includes(quest.id)) {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          reviewMessage: "請先按開始測驗，讓系統進入倒數與作答狀態。",
        };
      });
      return;
    }

    const evaluation = evaluateAnswer(answer, quest);
    if (evaluation.status === "fail") {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          reviewMessage: evaluation.message,
          results: {
            ...current.results,
            [quest.id]: evaluation,
          },
        };
      });
      return;
    }

    const alreadySubmitted = dailyState.submittedQuestIds.includes(quest.id);
    if (alreadySubmitted) {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          reviewMessage: "這題今天已經通過驗收，進度已記錄。",
        };
      });
      return;
    }

    const nextProgress = applyQuestReward(progressByTopic, quest.topic, evaluation.awardedExp);
    setProgressByTopic(nextProgress);
    setDailyState(function (current) {
      const nextUnlockedTopics =
        quest.type === "daily_gate"
          ? [...new Set([...current.unlockedTopics, ...OTHER_TOPICS])]
          : current.unlockedTopics;
      const nextBossHp = Math.max(0, current.bossHp - (quest.type === "daily_gate" ? 34 : 14));
      return {
        ...current,
        unlockedTopics: nextUnlockedTopics,
        submittedQuestIds: [...current.submittedQuestIds, quest.id],
        focusQuestId: quest.id,
        hintLevel: 0,
        bossHp: nextBossHp,
        awardedExp: {
          ...current.awardedExp,
          [quest.id]: evaluation.awardedExp,
        },
        results: {
          ...current.results,
          [quest.id]: evaluation,
        },
        reviewMessage:
          quest.type === "daily_gate"
            ? evaluation.reviewAfterPass ||
              "分析師首題已通過，其他主題任務已解鎖，今天可以繼續往下攻略。"
            : evaluation.reviewAfterPass ||
              "任務已通過驗收，請查看技能進度並選下一題。",
      };
    });
  }

  function resetDay() {
    setDailyState(createDailyState(progressByTopic, getDateKey()));
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <section className="border-b border-slate-200 bg-[#16251f] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-7 md:grid-cols-[1.15fr_0.85fr] md:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-3 py-1 text-sm text-emerald-100">
              <Sparkles size={16} /> Project Prometheus
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">知識攻略系統</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
              每天先完成一題分析師之路的必修任務，再解鎖其他主題。系統會依主題等級抽題，並保存你的當日進度。
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-100">今日限制</p>
                <h2 className="mt-1 text-2xl font-black">先完成分析師首題</h2>
              </div>
              <Target className="text-[#f2bf4a]" size={42} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="EXP" value={totalEarnedExp} />
              <Metric label="Quest" value={completedCount + "/4"} />
              <Metric label="Time" value={focusMinutes} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[280px_1fr_360px] md:px-8">
        <aside className="space-y-5">
          <Panel title="人生主線" icon={Flame}>
            <div className="space-y-2">
              {TOPIC_ORDER.map(function (topicId) {
                const story = TOPIC_META[topicId];
                const active = topicId === activeStory;
                return (
                  <button
                    key={story.id}
                    onClick={function () {
                      setActiveStory(story.id);
                    }}
                    className={
                      "w-full rounded-lg border p-3 text-left transition " +
                      (active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-400")
                    }
                  >
                    <span className="block font-bold">{story.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">{story.goal}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="技能樹" icon={Brain}>
            <div className="space-y-3">
              {TOPIC_ORDER.map(function (topicId) {
                const story = TOPIC_META[topicId];
                const progress = progressByTopic[topicId];
                const status = deriveTopicStatus(topicId, progress, gateCompleted);
                const locked = status === "鎖定";
                return (
                  <div key={topicId} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={"grid h-8 w-8 place-items-center rounded-md " + (locked ? "bg-slate-100 text-slate-400" : "bg-cyan-700 text-white")}>
                          {locked ? <Lock size={16} /> : <Brain size={16} />}
                        </span>
                        <div>
                          <p className="font-bold">{story.primarySkill}</p>
                          <p className="text-xs text-slate-500">
                            Lv.{progress.level} / {status}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-500">
                        {progress.exp}/{progress.maxExp}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-600" style={{ width: Math.min(100, Math.round((progress.exp / progress.maxExp) * 100)) + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </aside>

        <section className="space-y-5">
          <Panel title="今日 Quest" icon={BookOpenCheck}>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">目前主線：{currentStory.title}</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">技能：{currentStory.skills.join(" / ")}</p>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">今日必修任務</h3>
                <span className="text-sm font-bold text-amber-700">先完成才解鎖其他主題</span>
              </div>
              {gateQuest ? (
                <QuestCard
                  quest={gateQuest}
                  kindLabel="每日首題"
                  done={dailyState.submittedQuestIds.includes(gateQuest.id)}
                  started={dailyState.startedQuestIds.includes(gateQuest.id)}
                  secondsLeft={dailyState.timeLeft[gateQuest.id] ?? gateQuest.seconds}
                  answer={dailyState.answers[gateQuest.id] || ""}
                  result={dailyState.results[gateQuest.id]}
                  onStart={startQuest}
                  onAnswer={updateAnswer}
                  onSubmit={submitQuest}
                />
              ) : (
                <FallbackCard title="今日必修任務尚未生成" body="分析師題庫目前沒有可用的首題，請先補充 analyst 的 daily_gate 題目。" />
              )}
            </section>

            <section className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">已解鎖任務</h3>
                <span className="text-sm text-slate-500">{gateCompleted ? "已開放所有其他主題" : "完成今日分析師任務後解鎖"}</span>
              </div>
              {gateCompleted ? (
                <div className="space-y-4">
                  {unlockedQuests.map(function (quest) {
                    return (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        kindLabel="已解鎖任務"
                        done={dailyState.submittedQuestIds.includes(quest.id)}
                        started={dailyState.startedQuestIds.includes(quest.id)}
                        secondsLeft={dailyState.timeLeft[quest.id] ?? quest.seconds}
                        answer={dailyState.answers[quest.id] || ""}
                        result={dailyState.results[quest.id]}
                        onStart={startQuest}
                        onAnswer={updateAnswer}
                        onSubmit={submitQuest}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {OTHER_TOPICS.map(function (topicId) {
                    return <LockedTopicCard key={topicId} story={TOPIC_META[topicId]} progress={progressByTopic[topicId]} />;
                  })}
                </div>
              )}
            </section>
          </Panel>

          <Panel title="提交驗收" icon={ClipboardCheck}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-bold">AI 教授模式</p>
                <p className="mt-2 min-h-14 text-sm leading-6 text-slate-600">{dailyState.reviewMessage}</p>
              </div>
              <button onClick={showHint} disabled={!focusedQuest} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
                <Lightbulb size={18} /> 給提示
              </button>
            </div>
            {focusedQuest && dailyState.hintLevel > 0 ? (
              <div className="mt-4 space-y-2">
                {focusedQuest.hints.slice(0, dailyState.hintLevel).map(function (hint) {
                  return (
                    <p key={hint} className="rounded-md bg-slate-100 p-3 text-sm leading-6 text-slate-700">
                      {hint}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </Panel>
        </section>

        <aside className="space-y-5">
          <Panel title="每週 Boss" icon={Swords}>
            <div className="rounded-lg border border-rose-200 bg-[#fff7f4] p-4">
              <p className="text-sm font-bold text-rose-700">本週主題：財報</p>
              <h3 className="mt-1 text-2xl font-black">台積電季度財報</h3>
              <div className="mt-4 flex items-center justify-between text-sm font-bold">
                <span>理解阻力</span>
                <span>{dailyState.bossHp}/100 HP</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-rose-100">
                <div className="h-full rounded-full bg-rose-600 transition-all" style={{ width: dailyState.bossHp + "%" }} />
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                <li>營收來源？</li>
                <li>毛利率變化？</li>
                <li>最大風險？</li>
                <li>你的結論？</li>
              </ul>
            </div>
          </Panel>

          <Panel title="每月 Project" icon={Trophy}>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">七月作品</p>
              <h3 className="mt-1 text-xl font-black">半導體產業研究報告</h3>
              <div className="mt-4 space-y-2">
                {["產業鏈", "上下游", "成長動能", "風險", "投資想法"].map(function (item, index) {
                  return (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={index < completedCount ? "text-emerald-600" : "text-slate-300"} size={17} />
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={resetDay} className="mt-4 w-full rounded-md border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition hover:border-slate-500">
              重置今日進度
            </button>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function QuestCard(props) {
  const { quest, kindLabel, done, started, secondsLeft, answer, result, onStart, onAnswer, onSubmit } = props;
  const expired = secondsLeft === 0 && !done;
  return (
    <article className={"rounded-lg border p-4 " + (done ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {kindLabel} / {quest.track}
          </p>
          <h3 className="mt-1 text-2xl font-black">{quest.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{Math.ceil(quest.seconds / 60)} 分鐘測驗 / Lv.{quest.minLevel}-{quest.maxLevel}</p>
        </div>
        <span className="rounded-md bg-[#f1b84b] px-3 py-1 text-sm font-black text-slate-900">+{quest.exp} EXP</span>
      </div>

      <div className="mt-4 rounded-md bg-cyan-50 p-4">
        <p className="font-bold text-cyan-950">{quest.materialTitle}</p>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
          {quest.materials.map(function (item) {
            return (
              <li key={item} className="flex gap-2">
                <ChevronRight className="mt-1 shrink-0 text-cyan-700" size={15} />
                {item}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="inline-flex items-center gap-2 font-bold text-slate-700">
          <Timer size={18} /> {formatTime(secondsLeft)} {expired ? <span className="text-rose-700">已超時</span> : null}
        </div>
        <button onClick={function () { onStart(quest); }} disabled={started || done} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
          <Play size={17} /> {started ? "測驗進行中" : done ? "已完成" : "開始測驗"}
        </button>
      </div>

      {result ? <ReviewBadge result={result} /> : null}

      {started ? (
        <div className="mt-4">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm font-bold">測驗題目</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
              {quest.questions.map(function (question) {
                return (
                  <li key={question} className="flex gap-2">
                    <ChevronRight className="mt-1 shrink-0" size={15} />
                    {question}
                  </li>
                );
              })}
            </ul>
          </div>
          <label className="mt-4 block text-sm font-bold" htmlFor={quest.id}>
            你的答案
          </label>
          <textarea id={quest.id} value={answer} onChange={function (event) { onAnswer(quest.id, event.target.value); }} rows={5} className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 outline-none transition focus:border-cyan-600" placeholder={quest.clear} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">完成條件：{quest.clear}</p>
            <button onClick={function () { onSubmit(quest); }} className={"inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-bold transition " + (done ? "bg-emerald-700 text-white" : "bg-slate-950 text-white hover:bg-slate-800")}>
              <NotebookPen size={17} /> {done ? "已提交" : "提交驗收"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ReviewBadge(props) {
  const { result } = props;
  const palette =
    result.status === "pass"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : result.status === "reinforce"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-rose-300 bg-rose-50 text-rose-900";
  return (
    <div className={"mt-4 rounded-md border p-3 text-sm leading-6 " + palette}>
      <p className="font-bold">{result.label}</p>
      <p className="mt-1">{result.message}</p>
      <p className="mt-2 font-bold">本次獲得：{result.awardedExp} EXP</p>
    </div>
  );
}

function LockedTopicCard(props) {
  const { story, progress } = props;
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-200 text-slate-500">
          <Lock size={16} />
        </span>
        <div>
          <p className="font-bold">{story.title}</p>
          <p className="text-xs text-slate-500">Lv.{progress.level} / 完成今日分析師任務後解鎖</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{story.goal}</p>
    </div>
  );
}

function FallbackCard(props) {
  const { title, body } = props;
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-bold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function Metric(props) {
  const { label, value } = props;
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Panel(props) {
  const { title, icon: Icon, children } = props;
  return (
    <article className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 text-white">
          <Icon size={19} />
        </span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </article>
  );
}

function loadInitialState() {
  const progressByTopic = normalizeProgress(readStoredState()?.progressByTopic || DEFAULT_PROGRESS);
  const activeStory = readStoredState()?.activeStory || "analyst";
  const storedDailyState = readStoredState()?.dailyState;
  const dateKey = getDateKey();
  const dailyState =
    storedDailyState && storedDailyState.dateKey === dateKey
      ? normalizeDailyState(storedDailyState, progressByTopic)
      : createDailyState(progressByTopic, dateKey);

  return {
    activeStory,
    progressByTopic,
    dailyState,
  };
}

function readStoredState() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveAppState(state) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createDailyState(progressByTopic, dateKey) {
  const gateQuest = pickQuest(QUEST_POOLS.analyst, {
    type: "daily_gate",
    topic: "analyst",
    level: progressByTopic.analyst.level,
    dateKey,
  });
  const topicQuestIds = {};
  OTHER_TOPICS.forEach(function (topic) {
    const quest = pickQuest(QUEST_POOLS[topic], {
      type: "standard",
      topic,
      level: progressByTopic[topic].level,
      dateKey,
    });
    if (quest) {
      topicQuestIds[topic] = quest.id;
    }
  });

  return {
    dateKey,
    gateQuestId: gateQuest ? gateQuest.id : null,
    topicQuestIds,
    unlockedTopics: [],
    submittedQuestIds: [],
    startedQuestIds: [],
    answers: {},
    timeLeft: {},
    awardedExp: {},
    results: {},
    hintLevel: 0,
    focusQuestId: gateQuest ? gateQuest.id : null,
    reviewMessage: "今天先完成分析師之路的必修任務。完成後才會解鎖其他主題。",
    bossHp: BOSS_START_HP,
  };
}

function normalizeDailyState(dailyState, progressByTopic) {
  const rebuilt = createDailyState(progressByTopic, dailyState.dateKey);
  return {
    ...rebuilt,
    ...dailyState,
    topicQuestIds: {
      ...rebuilt.topicQuestIds,
      ...dailyState.topicQuestIds,
    },
    unlockedTopics: Array.isArray(dailyState.unlockedTopics) ? dailyState.unlockedTopics : [],
    submittedQuestIds: Array.isArray(dailyState.submittedQuestIds) ? dailyState.submittedQuestIds : [],
    startedQuestIds: Array.isArray(dailyState.startedQuestIds) ? dailyState.startedQuestIds : [],
    answers: dailyState.answers || {},
    timeLeft: dailyState.timeLeft || {},
    awardedExp: dailyState.awardedExp || {},
    results: dailyState.results || {},
  };
}

function normalizeProgress(progressByTopic) {
  const next = {};
  TOPIC_ORDER.forEach(function (topic) {
    const current = progressByTopic[topic] || DEFAULT_PROGRESS[topic];
    next[topic] = {
      level: current.level,
      exp: current.exp,
      maxExp: current.maxExp || getNextThreshold(topic, current.level),
    };
  });
  return next;
}

function pickQuest(pool, options) {
  const { type, topic, level, dateKey } = options;
  const typeMatches = pool.filter(function (quest) {
    return quest.type === type;
  });
  let candidates = typeMatches.filter(function (quest) {
    return level >= quest.minLevel && level <= quest.maxLevel;
  });

  if (!candidates.length) {
    const lowerMatches = typeMatches.filter(function (quest) {
      return quest.minLevel <= level;
    });
    if (lowerMatches.length) {
      const highestMinLevel = Math.max.apply(
        null,
        lowerMatches.map(function (quest) {
          return quest.minLevel;
        }),
      );
      candidates = lowerMatches.filter(function (quest) {
        return quest.minLevel === highestMinLevel;
      });
    }
  }

  if (!candidates.length) {
    candidates = typeMatches;
  }

  if (!candidates.length) {
    return null;
  }

  const seed = hashString(dateKey + ":" + topic + ":" + type + ":" + level);
  return candidates[seed % candidates.length];
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function evaluateAnswer(answer, quest) {
  const plain = answer.replace(/\s+/g, " ").trim();
  const sentenceCount = plain.split(/[。！？!?]/).filter(Boolean).length;
  const minFailLength = Math.max(45, quest.questions.length * 18);
  const reinforceLength = Math.max(90, quest.questions.length * 35);
  const passLength = Math.max(150, quest.questions.length * 48);

  if (plain.length < minFailLength || sentenceCount < Math.max(2, quest.questions.length - 1)) {
    return {
      status: "fail",
      label: "未達標",
      awardedExp: 0,
      message: "回答太短或不夠完整。請至少逐題作答，用自己的話把邏輯講清楚。",
    };
  }

  if (plain.length < passLength) {
    return {
      status: "reinforce",
      label: "通過但需補強",
      awardedExp: Math.round(quest.exp * 0.7),
      message: "核心方向對了，但推理還不夠扎實。請再補一句為什麼，讓答案更像你自己的理解。",
      reviewAfterPass:
        quest.type === "daily_gate"
          ? "分析師首題已通過，但還需要補強。其他主題已先解鎖，建議今天再回來把這題講得更完整。"
          : "這題已通過，但表達還可以更精準。進度已記錄，你可以先繼續下一題。",
    };
  }

  return {
    status: "pass",
    label: "通過",
    awardedExp: quest.exp,
    message: "回答已達到通過標準。你有把主要概念講清楚，而且能用自己的語言整理重點。",
    reviewAfterPass:
      quest.type === "daily_gate"
        ? "分析師首題已通過，其他主題任務已解鎖。接下來可以從英文、交易系統或個人成長裡挑一題繼續。"
        : "任務已通過驗收，EXP 已發放。你可以繼續今天的其他已解鎖任務。",
  };
}

function applyQuestReward(progressByTopic, topic, awardedExp) {
  const current = progressByTopic[topic];
  let nextLevel = current.level;
  let nextExp = current.exp + awardedExp;
  let nextMaxExp = current.maxExp;

  while (nextExp >= nextMaxExp) {
    nextExp -= nextMaxExp;
    nextLevel += 1;
    nextMaxExp = getNextThreshold(topic, nextLevel);
  }

  return {
    ...progressByTopic,
    [topic]: {
      level: nextLevel,
      exp: nextExp,
      maxExp: nextMaxExp,
    },
  };
}

function getNextThreshold(topic, level) {
  const config = TOPIC_META[topic];
  return config.baseMaxExp + level * config.expStep;
}

function deriveTopicStatus(topic, progress, gateCompleted) {
  if (topic !== "analyst" && !gateCompleted && progress.level === 0 && progress.exp === 0) {
    return "鎖定";
  }
  if (progress.level === 0 && progress.exp === 0) {
    return "暖身";
  }
  if (progress.exp >= progress.maxExp * 0.75) {
    return "可升級";
  }
  return "攻略中";
}

function getDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return minutes + ":" + seconds;
}

createRoot(document.getElementById("root")).render(<App />);
