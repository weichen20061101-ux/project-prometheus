import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BadgePlus,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Flame,
  Lightbulb,
  Lock,
  MoonStar,
  NotebookPen,
  Play,
  Settings2,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import {
  buildTopicRegistry,
  createCustomTopicId,
  DEFAULT_SETTINGS,
  getDailyLoadCount,
  getHintStep,
  getThresholdPreset,
  getTimerMultiplier,
  SETTINGS_OPTIONS,
} from "./topicSystem";
import "./styles.css";

const STORAGE_KEY = "prometheus-app-state-v2";
const BOSS_START_HP = 100;

function App() {
  const initialState = useMemo(loadInitialState, []);
  const [customTopics, setCustomTopics] = useState(initialState.customTopics);
  const [learningSettings, setLearningSettings] = useState(initialState.learningSettings);
  const [activeStory, setActiveStory] = useState(initialState.activeStory);
  const [pageView, setPageView] = useState(initialState.pageView);
  const [progressByTopic, setProgressByTopic] = useState(initialState.progressByTopic);
  const [dailyState, setDailyState] = useState(initialState.dailyState);
  const [topicDraft, setTopicDraft] = useState({
    title: "",
    goal: "",
    primarySkill: "",
    skillsText: "",
  });

  const registry = useMemo(function () {
    return buildTopicRegistry(customTopics);
  }, [customTopics]);
  const { topicMeta, topicOrder, questPools, progressDefaults, customTopics: normalizedCustomTopics } = registry;
  const normalizedProgress = useMemo(function () {
    return normalizeProgress(progressByTopic, progressDefaults, topicOrder, topicMeta);
  }, [progressByTopic, progressDefaults, topicOrder, topicMeta]);
  const currentDailyState = useMemo(function () {
    return syncDailyState(dailyState, normalizedProgress, questPools, topicOrder, learningSettings);
  }, [dailyState, normalizedProgress, questPools, topicOrder, learningSettings]);

  useEffect(
    function () {
      const syncedProgress = normalizeProgress(progressByTopic, progressDefaults, topicOrder, topicMeta);
      if (JSON.stringify(syncedProgress) !== JSON.stringify(progressByTopic)) {
        setProgressByTopic(syncedProgress);
      }
    },
    [progressByTopic, progressDefaults, topicOrder, topicMeta],
  );

  useEffect(
    function () {
      if (JSON.stringify(currentDailyState) !== JSON.stringify(dailyState)) {
        setDailyState(currentDailyState);
      }
    },
    [currentDailyState, dailyState],
  );

  useEffect(
    function () {
      if (learningSettings.timerMode === "off") {
        return undefined;
      }
      const timer = window.setInterval(function () {
        setDailyState(function (current) {
          let changed = false;
          const nextTimeLeft = { ...current.timeLeft };
          current.startedQuestIds.forEach(function (questId) {
            if (!current.completedQuestIds.includes(questId) && nextTimeLeft[questId] > 0) {
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
    },
    [learningSettings.timerMode],
  );

  useEffect(
    function () {
      saveAppState({
        activeStory: topicMeta[activeStory] ? activeStory : "analyst",
        pageView,
        customTopics: normalizedCustomTopics,
        learningSettings,
        progressByTopic: normalizedProgress,
        dailyState: currentDailyState,
      });
    },
    [activeStory, pageView, normalizedCustomTopics, learningSettings, normalizedProgress, currentDailyState, topicMeta],
  );

  const questIndex = useMemo(function () {
    const entries = [];
    Object.values(questPools).forEach(function (pool) {
      pool.forEach(function (quest) {
        entries.push([quest.id, quest]);
      });
    });
    return Object.fromEntries(entries);
  }, [questPools]);

  const currentStory = topicMeta[activeStory] || topicMeta.analyst;
  const gateQuest = currentDailyState.gateQuestId ? questIndex[currentDailyState.gateQuestId] : null;
  const totalEarnedExp = Object.values(currentDailyState.awardedExp).reduce(function (sum, value) {
    return sum + value;
  }, 0);
  const activeQuestIds = currentDailyState.topicQuestIds[activeStory] || [];
  const activeTopicQuests = activeQuestIds.map(function (questId) {
    return questIndex[questId];
  }).filter(Boolean);
  const visibleHints = currentDailyState.focusQuestId ? questIndex[currentDailyState.focusQuestId]?.hints || [] : [];

  function startQuest(quest) {
    setDailyState(function (current) {
      const startedQuestIds = current.startedQuestIds.includes(quest.id)
        ? current.startedQuestIds
        : [...current.startedQuestIds, quest.id];
      const multiplier = getTimerMultiplier(learningSettings);
      return {
        ...current,
        startedQuestIds,
        focusQuestId: quest.id,
        reviewMessage:
          activeStory === "analyst" && quest.id === current.gateQuestId
            ? "今日分析師首題已開始。先用自己的話回答，再看系統的補強追問。"
            : quest.title + " 已開始。先讀快速導讀和作答方向，再開始回答。",
        hintLevel: 0,
        timeLeft: {
          ...current.timeLeft,
          [quest.id]:
            learningSettings.timerMode === "off"
              ? 0
              : current.timeLeft[quest.id] ?? Math.round(quest.seconds * multiplier),
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

  function updateQuizAnswer(questId, questionId, value) {
    setDailyState(function (current) {
      const currentAnswer = current.answers[questId];
      const nextQuizAnswer =
        currentAnswer && typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
          ? { ...currentAnswer, [questionId]: value }
          : { [questionId]: value };
      return {
        ...current,
        answers: {
          ...current.answers,
          [questId]: nextQuizAnswer,
        },
      };
    });
  }

  function showHint() {
    if (!currentDailyState.focusQuestId) {
      return;
    }
    setDailyState(function (current) {
      const focusedQuest = questIndex[current.focusQuestId];
      const nextStep = getHintStep(learningSettings);
      return {
        ...current,
        hintLevel: Math.min(focusedQuest.hints.length, current.hintLevel + nextStep),
      };
    });
  }

  function submitQuest(quest) {
    const answer = currentDailyState.answers[quest.id] || (quest.type === "quiz_group" ? {} : "");
    if (!currentDailyState.startedQuestIds.includes(quest.id) && learningSettings.timerMode !== "off") {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          reviewMessage: "請先按開始測驗，讓系統進入作答狀態。",
        };
      });
      return;
    }

    const existingAward = currentDailyState.awardedExp[quest.id] || 0;
    const existingResult = currentDailyState.results[quest.id];
    const evaluation = evaluateAnswer(answer, quest, learningSettings);

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

    if (existingResult?.status === "pass") {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          reviewMessage: "這題已經完整通過驗收，進度與 EXP 都已記錄。",
        };
      });
      return;
    }

    const deltaExp = Math.max(0, evaluation.awardedExp - existingAward);
    if (deltaExp > 0) {
      setProgressByTopic(function (current) {
        return applyQuestReward(current, quest.topic, deltaExp, topicMeta);
      });
    }

    setDailyState(function (current) {
      const nextCompletedQuestIds = current.completedQuestIds.includes(quest.id)
        ? current.completedQuestIds
        : [...current.completedQuestIds, quest.id];
      const nextUnlockedTopics =
        quest.id === current.gateQuestId
          ? topicOrder.filter(function (topicId) { return topicId !== "analyst"; })
          : current.unlockedTopics;
      return {
        ...current,
        completedQuestIds: nextCompletedQuestIds,
        focusQuestId: quest.id,
        hintLevel: 0,
        unlockedTopics: nextUnlockedTopics,
        bossHp: Math.max(0, current.bossHp - (quest.topic === "analyst" ? 12 : 8)),
        awardedExp: {
          ...current.awardedExp,
          [quest.id]: evaluation.awardedExp,
        },
        results: {
          ...current.results,
          [quest.id]: evaluation,
        },
        reviewMessage:
          evaluation.reviewAfterPass ||
          (evaluation.status === "reinforce"
            ? "這題先通過，但還有缺口。建議先補答，再切下一題。"
            : "任務通過，進度已更新。可以繼續今天的下一題。"),
      };
    });
  }

  function resetDay() {
    setDailyState(createDailyState(normalizedProgress, getDateKey(), questPools, topicOrder, learningSettings));
  }

  function updateSetting(key, value) {
    setLearningSettings(function (current) {
      return { ...current, [key]: value };
    });
  }

  function updateTopicDraft(key, value) {
    setTopicDraft(function (current) {
      return { ...current, [key]: value };
    });
  }

  function addCustomTopic() {
    const title = topicDraft.title.trim();
    const primarySkill = topicDraft.primarySkill.trim();
    if (!title || !primarySkill) {
      return;
    }
    const nextId = createCustomTopicId(
      title,
      [...customTopics, ...normalizedCustomTopics].map(function (topic) {
        return topic.id;
      }),
    );
    const nextTopic = {
      id: nextId,
      title,
      goal: topicDraft.goal.trim() || "為這個主題建立一套可持續學習流程",
      primarySkill,
      skills: topicDraft.skillsText
        .split(/[,，/]/)
        .map(function (item) { return item.trim(); })
        .filter(Boolean),
    };
    setCustomTopics(function (current) {
      return [...current, nextTopic];
    });
    setProgressByTopic(function (current) {
      return {
        ...current,
        [nextId]: {
          level: 0,
          exp: 0,
          maxExp: 130,
        },
      };
    });
    setTopicDraft({
      title: "",
      goal: "",
      primarySkill: "",
      skillsText: "",
    });
    setActiveStory(nextId);
    setPageView("topic");
  }

  function openTopic(topicId) {
    setActiveStory(topicId);
    setPageView("topic");
  }

  const activeStatus = deriveTopicStatus(normalizedProgress[activeStory]);
  const activeBoss = currentStory.bossQuestions || [];
  const activeProject = currentStory.projectSteps || [];

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <section className="border-b border-cyan-500/10 bg-[#09192d]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
              <MoonStar size={15} /> Project Prometheus
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">知識攻略系統</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              現在切到哪個主題，就只看那個主題的題目、進度與驗收。分析師首題保留為今日推薦入口，不再限制其他主題。
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-[#0d2038] p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_30px_80px_rgba(2,12,27,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-cyan-200">今日狀態</p>
                <h2 className="mt-1 text-2xl font-black text-white">{pageView === "topic" ? currentStory.title : "全部主題"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{pageView === "topic" ? currentStory.goal : "先選一個主題，再進入該主題的專屬頁面做題。"}</p>
              </div>
              <Target className="text-cyan-300" size={42} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="EXP" value={totalEarnedExp} />
              <Metric label="完成" value={currentDailyState.completedQuestIds.length + ""} />
              <Metric label="模式" value={activeStatus} />
            </div>
          </div>
        </div>
      </section>

      {pageView === "overview" ? (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1fr_360px] md:px-8">
          <section className="space-y-5">
            <Panel title="選擇主題" icon={Flame}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {topicOrder.map(function (topicId) {
                  const story = topicMeta[topicId];
                  const progress = normalizedProgress[topicId];
                  const status = deriveTopicStatus(progress);
                  return (
                    <button
                      key={topicId}
                      onClick={function () { openTopic(topicId); }}
                      className="rounded-2xl border border-white/8 bg-[#0b1525] p-5 text-left transition hover:border-cyan-400/30 hover:bg-[#0f1d31]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-cyan-200">{story.primarySkill}</p>
                          <h3 className="mt-1 text-xl font-black text-white">{story.title}</h3>
                        </div>
                        <span className="rounded-full border border-white/10 bg-[#09131f] px-3 py-1 text-xs text-slate-300">Lv.{progress.level}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{story.goal}</p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{status}</span>
                          <span>{progress.exp}/{progress.maxExp}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: Math.min(100, Math.round((progress.exp / progress.maxExp) * 100)) + "%" }} />
                        </div>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
                        進入主題 <ChevronRight size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel title="學習設定" icon={Settings2}>
              <div className="space-y-5">
                <SettingGroup
                  title="每日任務量"
                  value={learningSettings.dailyLoad}
                  options={SETTINGS_OPTIONS.dailyLoad}
                  onChange={function (value) { updateSetting("dailyLoad", value); }}
                />
                <SettingGroup
                  title="驗收模式"
                  value={learningSettings.reviewMode}
                  options={SETTINGS_OPTIONS.reviewMode}
                  onChange={function (value) { updateSetting("reviewMode", value); }}
                />
                <SettingGroup
                  title="計時方式"
                  value={learningSettings.timerMode}
                  options={SETTINGS_OPTIONS.timerMode}
                  onChange={function (value) { updateSetting("timerMode", value); }}
                />
              </div>
            </Panel>

            <Panel title="新增主題" icon={BadgePlus}>
              <div className="space-y-3">
                <input value={topicDraft.title} onChange={function (event) { updateTopicDraft("title", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="主題名稱，例如：程式設計" />
                <input value={topicDraft.primarySkill} onChange={function (event) { updateTopicDraft("primarySkill", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="核心技能，例如：React 基礎" />
                <input value={topicDraft.skillsText} onChange={function (event) { updateTopicDraft("skillsText", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="技能清單，逗號分隔" />
                <textarea value={topicDraft.goal} onChange={function (event) { updateTopicDraft("goal", event.target.value); }} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="主題目標，例如：能獨立做出作品" />
                <button onClick={addCustomTopic} className="w-full rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300">
                  建立新主題
                </button>
              </div>
            </Panel>
          </aside>
        </section>
      ) : (
      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[290px_1fr_360px] md:px-8">
        <aside className="space-y-5">
          <Panel title="返回主題" icon={Flame}>
            <button
              onClick={function () { setPageView("overview"); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0b1525] px-4 py-3 font-bold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            >
              <ArrowLeft size={16} /> 回到主題首頁
            </button>
          </Panel>

          <Panel title="技能進度" icon={Brain}>
            <div className="space-y-3">
              {topicOrder.map(function (topicId) {
                const story = topicMeta[topicId];
                const progress = normalizedProgress[topicId];
                const locked = false;
                return (
                  <div key={topicId} className="rounded-xl border border-white/8 bg-[#0b1525] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={"grid h-8 w-8 place-items-center rounded-lg " + (locked ? "bg-slate-800 text-slate-500" : "bg-cyan-500/15 text-cyan-300")}>
                          {locked ? <Lock size={16} /> : <Brain size={16} />}
                        </span>
                        <div>
                          <p className="font-bold text-slate-100">{story.primarySkill}</p>
                          <p className="text-xs text-slate-400">{story.title}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-300">{progress.exp}/{progress.maxExp}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: Math.min(100, Math.round((progress.exp / progress.maxExp) * 100)) + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="新增主題" icon={BadgePlus}>
            <div className="space-y-3">
              <input value={topicDraft.title} onChange={function (event) { updateTopicDraft("title", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="主題名稱，例如：程式設計" />
              <input value={topicDraft.primarySkill} onChange={function (event) { updateTopicDraft("primarySkill", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="核心技能，例如：React 基礎" />
              <input value={topicDraft.skillsText} onChange={function (event) { updateTopicDraft("skillsText", event.target.value); }} className="w-full rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="技能清單，逗號分隔" />
              <textarea value={topicDraft.goal} onChange={function (event) { updateTopicDraft("goal", event.target.value); }} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-[#09131f] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40" placeholder="主題目標，例如：能獨立做出作品" />
              <button onClick={addCustomTopic} className="w-full rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300">
                建立新主題
              </button>
            </div>
          </Panel>
        </aside>

        <section className="space-y-5">
          <Panel title={currentStory.title + " 任務面板"} icon={BookOpenCheck}>
            <div className="mb-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-cyan-200">主題技能</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{currentStory.skills.join(" / ")}</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-[#0b1525] px-3 py-1 text-sm text-cyan-200">
                  {activeStatus}
                </span>
              </div>
            </div>

            {activeStory === "analyst" ? (
              <div className="space-y-5">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">今日必修首題</h3>
                    <span className="text-sm text-cyan-200">今日推薦入口，可直接略過改做其他主題</span>
                  </div>
                  {gateQuest ? (
                    <QuestCard
                      quest={gateQuest}
                      kindLabel="Gate Quest"
                      done={currentDailyState.completedQuestIds.includes(gateQuest.id)}
                      started={currentDailyState.startedQuestIds.includes(gateQuest.id)}
                      secondsLeft={currentDailyState.timeLeft[gateQuest.id] ?? 0}
                      answer={currentDailyState.answers[gateQuest.id] || ""}
                      result={currentDailyState.results[gateQuest.id]}
                      timerMode={learningSettings.timerMode}
                      onStart={startQuest}
                      onAnswer={updateAnswer}
                      onQuizAnswer={updateQuizAnswer}
                      onSubmit={submitQuest}
                    />
                  ) : (
                    <FallbackCard title="今天沒有可用的分析師首題" body="目前題庫無法生成 gate 題，請檢查 analyst pool。" />
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">分析師主題任務</h3>
                    <span className="text-sm text-slate-400">依設定生成今日主題題目</span>
                  </div>
                  <div className="space-y-4">
                    {activeTopicQuests.map(function (quest) {
                      return (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          kindLabel="Analyst Quest"
                          done={currentDailyState.completedQuestIds.includes(quest.id)}
                          started={currentDailyState.startedQuestIds.includes(quest.id)}
                          secondsLeft={currentDailyState.timeLeft[quest.id] ?? 0}
                          answer={currentDailyState.answers[quest.id] || ""}
                          result={currentDailyState.results[quest.id]}
                            timerMode={learningSettings.timerMode}
                            onStart={startQuest}
                            onAnswer={updateAnswer}
                            onQuizAnswer={updateQuizAnswer}
                            onSubmit={submitQuest}
                          />
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTopicQuests.map(function (quest) {
                  return (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      kindLabel={currentStory.title}
                      done={currentDailyState.completedQuestIds.includes(quest.id)}
                      started={currentDailyState.startedQuestIds.includes(quest.id)}
                      secondsLeft={currentDailyState.timeLeft[quest.id] ?? 0}
                      answer={currentDailyState.answers[quest.id] || ""}
                      result={currentDailyState.results[quest.id]}
                      timerMode={learningSettings.timerMode}
                      onStart={startQuest}
                      onAnswer={updateAnswer}
                      onQuizAnswer={updateQuizAnswer}
                      onSubmit={submitQuest}
                    />
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="驗收與提示" icon={ClipboardCheck}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="rounded-xl border border-white/8 bg-[#0b1525] p-4">
                <p className="font-bold text-white">混合驗收模式</p>
                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-300">{currentDailyState.reviewMessage}</p>
              </div>
              <button
                onClick={showHint}
                disabled={!currentDailyState.focusQuestId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                <Lightbulb size={18} /> 顯示提示
              </button>
            </div>
            {currentDailyState.focusQuestId && currentDailyState.hintLevel > 0 ? (
              <div className="mt-4 space-y-2">
                {visibleHints.slice(0, currentDailyState.hintLevel).map(function (hint) {
                  return (
                    <p key={hint} className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3 text-sm leading-6 text-slate-200">
                      {hint}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </Panel>
        </section>

        <aside className="space-y-5">
          <Panel title="學習設定" icon={Settings2}>
            <div className="space-y-5">
              <SettingGroup
                title="每日任務量"
                value={learningSettings.dailyLoad}
                options={SETTINGS_OPTIONS.dailyLoad}
                onChange={function (value) { updateSetting("dailyLoad", value); }}
              />
              <SettingGroup
                title="驗收模式"
                value={learningSettings.reviewMode}
                options={SETTINGS_OPTIONS.reviewMode}
                onChange={function (value) { updateSetting("reviewMode", value); }}
              />
              <SettingGroup
                title="計時方式"
                value={learningSettings.timerMode}
                options={SETTINGS_OPTIONS.timerMode}
                onChange={function (value) { updateSetting("timerMode", value); }}
              />
              <SettingGroup
                title="提示節奏"
                value={learningSettings.hintMode}
                options={SETTINGS_OPTIONS.hintMode}
                onChange={function (value) { updateSetting("hintMode", value); }}
              />
              <button onClick={resetDay} className="w-full rounded-xl border border-white/10 bg-[#0b1525] px-4 py-3 font-bold text-slate-200 transition hover:border-cyan-400/30 hover:text-white">
                依目前設定重建今日任務
              </button>
            </div>
          </Panel>

          <Panel title="當前 Boss" icon={Swords}>
            <div className="rounded-xl border border-white/8 bg-[#0b1525] p-4">
              <p className="text-sm font-bold text-slate-400">{currentStory.title}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{currentStory.bossTitle}</h3>
              <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-300">
                <span>理解阻力</span>
                <span>{currentDailyState.bossHp}/100 HP</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: currentDailyState.bossHp + "%" }} />
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {activeBoss.map(function (item) {
                  return <li key={item}>{item}</li>;
                })}
              </ul>
            </div>
          </Panel>

          <Panel title="每月 Project" icon={Trophy}>
            <div className="rounded-xl border border-white/8 bg-[#0b1525] p-4">
              <p className="text-sm font-bold text-slate-400">本月作品</p>
              <h3 className="mt-1 text-xl font-black text-white">{currentStory.projectTitle}</h3>
              <div className="mt-4 space-y-2">
                {activeProject.map(function (item, index) {
                  return (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className={index < currentDailyState.completedQuestIds.length ? "text-cyan-300" : "text-slate-600"} size={17} />
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </aside>
      </section>
      )}
    </main>
  );
}

function QuestCard(props) {
  const { quest, kindLabel, done, started, secondsLeft, answer, result, timerMode, onStart, onAnswer, onQuizAnswer, onSubmit } = props;
  const expired = timerMode !== "off" && secondsLeft === 0 && started && !done;
  const quizAnswer = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
  const answeredCount = quest.type === "quiz_group"
    ? quest.questions.filter(function (question) { return Boolean(quizAnswer[question.id]); }).length
    : 0;
  return (
    <article className={"rounded-2xl border p-4 " + (done ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/8 bg-[#0b1525]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-400">
            {kindLabel} / {quest.track}
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">{quest.title}</h3>
          <p className="mt-1 text-sm text-slate-400">約 {Math.ceil(quest.seconds / 60)} 分鐘 / Lv.{quest.minLevel}</p>
        </div>
        <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-black text-cyan-200">+{quest.exp} EXP</span>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <div>
          <p className="font-bold text-cyan-200">{quest.materialTitle}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
            {quest.materials.map(function (item) {
              return (
                <li key={item} className="flex gap-2">
                  <ChevronRight className="mt-1 shrink-0 text-cyan-300" size={15} />
                  {item}
                </li>
              );
            })}
          </ul>
        </div>

        {Array.isArray(quest.summary) && quest.summary.length ? (
          <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
            <p className="text-sm font-bold text-white">快速導讀</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {quest.summary.map(function (item) {
                return (
                  <li key={item} className="flex gap-2">
                    <ChevronRight className="mt-1 shrink-0 text-slate-400" size={15} />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {Array.isArray(quest.answerGuide) && quest.answerGuide.length ? (
          <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
            <p className="text-sm font-bold text-white">作答方向</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {quest.answerGuide.map(function (item) {
                return (
                  <li key={item} className="flex gap-2">
                    <ChevronRight className="mt-1 shrink-0 text-slate-400" size={15} />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {Array.isArray(quest.resources) && quest.resources.length ? (
          <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
            <p className="text-sm font-bold text-white">學習資源</p>
            <div className="mt-2 space-y-3">
              {quest.resources.map(function (resource) {
                const key = resource.label + "-" + (resource.content || resource.url || "");
                return (
                  <div key={key} className="rounded-lg border border-white/8 bg-[#0b1525] p-3">
                    <p className="text-sm font-bold text-cyan-200">{resource.label}</p>
                    {resource.type === "link" ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm text-cyan-300 underline underline-offset-4"
                      >
                        開啟參考連結
                      </a>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-300">{resource.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#09131f] p-3">
        <div className="inline-flex items-center gap-2 font-bold text-slate-300">
          <Timer size={18} />
          {timerMode === "off" ? "自由作答" : formatTime(secondsLeft)}
          {expired ? <span className="text-rose-300">已超時</span> : null}
        </div>
        <button
          onClick={function () { onStart(quest); }}
          disabled={started || done}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          <Play size={17} /> {started ? "進行中" : done ? "已完成" : "開始測驗"}
        </button>
      </div>

      {result ? <ReviewBadge result={result} /> : null}

      {started || timerMode === "off" ? (
        <div className="mt-4">
          {quest.type === "quiz_group" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">基礎題組</p>
                  <span className="text-sm text-cyan-200">{answeredCount}/{quest.questions.length} 已作答</span>
                </div>
                <div className="mt-4 space-y-4">
                  {quest.questions.map(function (question, index) {
                    return (
                      <div key={question.id} className="rounded-xl border border-white/8 bg-[#0b1525] p-4">
                        <p className="text-sm font-bold text-white">第 {index + 1} 題</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{question.prompt}</p>
                        <div className="mt-3 space-y-2">
                          {question.options.map(function (option) {
                            const selected = quizAnswer[question.id] === option.id;
                            return (
                              <label
                                key={option.id}
                                className={
                                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition " +
                                  (selected
                                    ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                                    : "border-white/8 bg-[#09131f] text-slate-300 hover:border-cyan-400/20")
                                }
                              >
                                <input
                                  type="radio"
                                  name={quest.id + "-" + question.id}
                                  value={option.id}
                                  checked={selected}
                                  onChange={function () { onQuizAnswer(quest.id, question.id, option.id); }}
                                  className="mt-1 h-4 w-4 accent-cyan-400"
                                />
                                <span>{option.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
                <p className="text-sm font-bold text-white">測驗題目</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                  {quest.questions.map(function (question) {
                    return (
                      <li key={question} className="flex gap-2">
                        <ChevronRight className="mt-1 shrink-0 text-slate-400" size={15} />
                        {question}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <label className="mt-4 block text-sm font-bold text-white" htmlFor={quest.id}>
                你的答案
              </label>
              <textarea
                id={quest.id}
                value={answer}
                onChange={function (event) { onAnswer(quest.id, event.target.value); }}
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#09131f] p-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400/40"
                placeholder={quest.clear}
              />
            </>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">完成條件：{quest.clear}</p>
            <button
              onClick={function () { onSubmit(quest); }}
              className={"inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-bold transition " + (done ? "bg-emerald-500 text-slate-950" : "bg-white text-slate-950 hover:bg-cyan-50")}
            >
              <NotebookPen size={17} /> {done ? "再次補答" : quest.type === "quiz_group" ? "提交題組" : "提交驗收"}
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
      ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-100"
      : result.status === "reinforce"
        ? "border-amber-400/25 bg-amber-400/5 text-amber-100"
        : "border-rose-400/25 bg-rose-400/5 text-rose-100";
  return (
    <div className={"mt-4 rounded-xl border p-3 text-sm leading-6 " + palette}>
      <p className="font-bold">{result.label}</p>
      <p className="mt-1">{result.message}</p>
      {result.hitConcepts?.length ? <p className="mt-2">已命中：{result.hitConcepts.join("、")}</p> : null}
      {result.missingConcepts?.length ? <p className="mt-2">需要補強：{result.missingConcepts.join("、")}</p> : null}
      {result.followUpQuestion ? <p className="mt-2 font-bold">追問：{result.followUpQuestion}</p> : null}
      {result.coachMessage ? <p className="mt-2">教練建議：{result.coachMessage}</p> : null}
      {typeof result.correctCount === "number" && typeof result.totalCount === "number" ? (
        <p className="mt-2 font-bold">答對 {result.correctCount} / {result.totalCount}</p>
      ) : null}
      {Array.isArray(result.incorrectItems) && result.incorrectItems.length ? (
        <div className="mt-3 space-y-3">
          {result.incorrectItems.map(function (item) {
            return (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/10 p-3">
                <p className="font-bold">{item.prompt}</p>
                <p className="mt-1">你的答案：{item.selectedText || "未作答"}</p>
                <p className="mt-1">正確答案：{item.correctText}</p>
                <p className="mt-1">{item.explanation}</p>
              </div>
            );
          })}
        </div>
      ) : null}
      <p className="mt-2 font-bold">本次獲得：{result.awardedExp} EXP</p>
    </div>
  );
}

function Panel(props) {
  const { title, icon: Icon, children } = props;
  return (
    <article className="rounded-2xl border border-white/8 bg-[#08111d] p-4 shadow-[0_20px_60px_rgba(2,12,27,0.35)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon size={19} />
        </span>
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      {children}
    </article>
  );
}

function Metric(props) {
  const { label, value } = props;
  return (
    <div className="rounded-xl border border-white/8 bg-[#09131f] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function FallbackCard(props) {
  const { title, body } = props;
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-[#0b1525] p-4">
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function SettingGroup(props) {
  const { title, value, options, onChange } = props;
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white">{title}</p>
      <div className="space-y-2">
        {options.map(function (option) {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              onClick={function () { onChange(option.id); }}
              className={
                "w-full rounded-xl border px-3 py-3 text-left transition " +
                (active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                  : "border-white/8 bg-[#09131f] text-slate-300 hover:border-cyan-400/20")
              }
            >
              <p className="font-bold">{option.label}</p>
              <p className="mt-1 text-xs text-slate-400">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function loadInitialState() {
  const stored = readStoredState();
  return {
    activeStory: stored?.activeStory || "analyst",
    customTopics: Array.isArray(stored?.customTopics) ? stored.customTopics : [],
    learningSettings: { ...DEFAULT_SETTINGS, ...(stored?.learningSettings || {}) },
    progressByTopic: stored?.progressByTopic || {},
    dailyState: stored?.dailyState || {
      dateKey: "",
      gateQuestId: null,
      topicQuestIds: {},
      unlockedTopics: [],
      completedQuestIds: [],
      startedQuestIds: [],
      answers: {},
      timeLeft: {},
      awardedExp: {},
      results: {},
      hintLevel: 0,
      focusQuestId: null,
      reviewMessage: "今天可直接從任何主題開始。分析師首題保留為推薦入口。",
      bossHp: BOSS_START_HP,
    },
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

function normalizeProgress(progressByTopic, defaults, topicOrder, topicMeta) {
  const next = {};
  topicOrder.forEach(function (topicId) {
    const base = defaults[topicId];
    const current = progressByTopic?.[topicId] || base;
    next[topicId] = {
      level: typeof current.level === "number" ? current.level : base.level,
      exp: typeof current.exp === "number" ? current.exp : base.exp,
      maxExp: typeof current.maxExp === "number" ? current.maxExp : getNextThreshold(topicMeta[topicId], current.level || base.level),
    };
  });
  return next;
}

function syncDailyState(dailyState, progressByTopic, questPools, topicOrder, settings) {
  const dateKey = getDateKey();
  if (!dailyState?.dateKey || dailyState.dateKey !== dateKey) {
    return createDailyState(progressByTopic, dateKey, questPools, topicOrder, settings);
  }
  const rebuilt = createDailyState(progressByTopic, dateKey, questPools, topicOrder, settings);
  const normalizedTopicQuestIds = {};
  topicOrder.forEach(function (topicId) {
    const current = dailyState.topicQuestIds?.[topicId];
    normalizedTopicQuestIds[topicId] = Array.isArray(current)
      ? current
      : current
        ? [current]
        : rebuilt.topicQuestIds[topicId] || [];
  });
  return {
    ...rebuilt,
    ...dailyState,
    gateQuestId: dailyState.gateQuestId || rebuilt.gateQuestId,
    focusQuestId: dailyState.focusQuestId || rebuilt.focusQuestId,
    topicQuestIds: normalizedTopicQuestIds,
    unlockedTopics: Array.isArray(dailyState.unlockedTopics) ? dailyState.unlockedTopics : [],
    completedQuestIds: Array.isArray(dailyState.completedQuestIds || dailyState.submittedQuestIds)
      ? (dailyState.completedQuestIds || dailyState.submittedQuestIds)
      : [],
    startedQuestIds: Array.isArray(dailyState.startedQuestIds) ? dailyState.startedQuestIds : [],
    answers: dailyState.answers || {},
    timeLeft: dailyState.timeLeft || {},
    awardedExp: dailyState.awardedExp || {},
    results: dailyState.results || {},
  };
}

function createDailyState(progressByTopic, dateKey, questPools, topicOrder, settings) {
  const loadCount = getDailyLoadCount(settings);
  const analystGate = pickQuest(questPools.analyst, {
    level: progressByTopic.analyst.level,
    dateKey,
    seedScope: "analyst-gate",
    excludeIds: [],
  });
  const topicQuestIds = {};
  topicOrder.forEach(function (topicId) {
    const pool = questPools[topicId] || [];
    if (!pool.length) {
      topicQuestIds[topicId] = [];
      return;
    }
    const excludeIds = topicId === "analyst" && analystGate ? [analystGate.id] : [];
    topicQuestIds[topicId] = pickQuestSet(pool, {
      level: progressByTopic[topicId].level,
      dateKey,
      seedScope: topicId + "-daily",
      count: loadCount,
      excludeIds,
    }).map(function (quest) {
      return quest.id;
    });
  });
  return {
    dateKey,
    gateQuestId: analystGate ? analystGate.id : null,
    topicQuestIds,
    unlockedTopics: [],
    completedQuestIds: [],
    startedQuestIds: [],
    answers: {},
    timeLeft: {},
    awardedExp: {},
    results: {},
    hintLevel: 0,
    focusQuestId: analystGate ? analystGate.id : topicQuestIds.analyst?.[0] || null,
    reviewMessage: "今天可直接從任何主題開始。切到哪個主題，就只會看到該主題自己的任務。",
    bossHp: BOSS_START_HP,
  };
}

function pickQuest(pool, options) {
  return pickQuestSet(pool, { ...options, count: 1 })[0] || null;
}

function pickQuestSet(pool, options) {
  const { level, dateKey, seedScope, count, excludeIds } = options;
  const excluded = new Set(excludeIds || []);
  let candidates = pool.filter(function (quest) {
    return quest.minLevel <= level && quest.maxLevel >= level && !excluded.has(quest.id);
  });
  if (!candidates.length) {
    const lowerMatches = pool.filter(function (quest) {
      return quest.minLevel <= level && !excluded.has(quest.id);
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
    candidates = pool.filter(function (quest) { return !excluded.has(quest.id); });
  }
  if (!candidates.length) {
    return [];
  }
  const decorated = candidates.map(function (quest) {
    return {
      quest,
      order: hashString(dateKey + ":" + seedScope + ":" + quest.id),
    };
  });
  decorated.sort(function (left, right) {
    return left.order - right.order;
  });
  return decorated.slice(0, count).map(function (item) {
    return item.quest;
  });
}

function evaluateAnswer(answer, quest, settings) {
  if (quest.type === "quiz_group") {
    return evaluateQuizGroupAnswer(answer, quest);
  }

  const plain = answer.replace(/\s+/g, " ").trim();
  const sentenceCount = plain.split(/[。！？!?]/).filter(Boolean).length;
  const thresholds = getThresholdPreset(settings, quest);
  const rubricChecks = Array.isArray(quest.rubric) ? quest.rubric : [];
  const matchedConcepts = rubricChecks.filter(function (item) {
    return item.keywords.some(function (keyword) {
      return plain.toLowerCase().includes(String(keyword).toLowerCase());
    });
  });
  const hitConcepts = matchedConcepts.map(function (item) { return item.concept; });
  const missingConcepts = rubricChecks
    .filter(function (item) {
      return !matchedConcepts.includes(item);
    })
    .map(function (item) {
      return item.concept;
    });
  const coverageRate = rubricChecks.length ? matchedConcepts.length / rubricChecks.length : 1;
  const followUpQuestion = missingConcepts.length
    ? rubricChecks.find(function (item) { return item.concept === missingConcepts[0]; })?.followUp || "請把缺漏概念補完整。"
    : "";
  const coachMessage = missingConcepts.length
    ? rubricChecks.find(function (item) { return item.concept === missingConcepts[0]; })?.coachNote || "先補清楚概念，再補一個例子。"
    : "你的回答已經有完整主軸，可以繼續往下推進。";

  if (plain.length < thresholds.minFailLength || sentenceCount < Math.max(2, quest.questions.length - 1)) {
    return {
      status: "fail",
      label: "未達標",
      awardedExp: 0,
      message: "回答太短或不夠完整。請至少逐題作答，用自己的話把邏輯講清楚。",
      hitConcepts,
      missingConcepts,
      followUpQuestion,
      coachMessage,
    };
  }

  if (plain.length < thresholds.passLength || coverageRate < thresholds.passCoverage) {
    return {
      status: "reinforce",
      label: "通過但需補強",
      awardedExp: Math.round(quest.exp * 0.7),
      message:
        coverageRate < thresholds.passCoverage
          ? "你有抓到方向，但核心概念還沒覆蓋完整。先補缺漏點，再讓答案更完整。"
          : "方向正確，但說明還不夠扎實。請把原因和例子補清楚。",
      reviewAfterPass:
        quest.topic === "analyst"
          ? "分析師首題已通過，但還建議補強。其他主題已解鎖，你可以先切過去，也可以先把這題補完整。"
          : "這題先通過，但還有補強空間。系統已記錄進度，你可以稍後再來升級答案。",
      hitConcepts,
      missingConcepts,
      followUpQuestion,
      coachMessage,
    };
  }

  return {
    status: "pass",
    label: "通過",
    awardedExp: quest.exp,
    message: "回答已達到通過標準。你有把主要概念講清楚，而且能用自己的語言整理重點。",
    reviewAfterPass:
      quest.topic === "analyst"
        ? "分析師首題已通過。現在切到其他主題，只會看到各自主題對應的任務。"
        : "任務已通過驗收，EXP 已發放。你可以繼續這個主題的其他題目，或切去別的主題。",
    hitConcepts,
    missingConcepts,
    followUpQuestion,
    coachMessage,
  };
}

function evaluateQuizGroupAnswer(answer, quest) {
  const quizAnswer = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
  const questions = Array.isArray(quest.questions) ? quest.questions : [];
  const unansweredItems = questions.filter(function (question) {
    return !quizAnswer[question.id];
  });

  if (unansweredItems.length) {
    return {
      status: "fail",
      label: "未完成題組",
      awardedExp: 0,
      message: "這組題目還沒全部作答完。請先把每一題都選完再提交。",
      hitConcepts: [],
      missingConcepts: unansweredItems.map(function (item) { return "第 " + (questions.indexOf(item) + 1) + " 題"; }),
      followUpQuestion: "先補完所有空白題目。",
      coachMessage: "基礎題組先求完整作答，再看對錯。",
      correctCount: questions.length - unansweredItems.length,
      totalCount: questions.length,
      incorrectItems: [],
    };
  }

  const incorrectItems = [];
  let correctCount = 0;
  questions.forEach(function (question) {
    const selected = quizAnswer[question.id];
    if (selected === question.correctAnswer) {
      correctCount += 1;
      return;
    }
    const selectedOption = question.options.find(function (option) { return option.id === selected; });
    const correctOption = question.options.find(function (option) { return option.id === question.correctAnswer; });
    incorrectItems.push({
      id: question.id,
      prompt: question.prompt,
      selectedText: selectedOption?.text || "",
      correctText: correctOption?.text || "",
      explanation: question.explanation,
    });
  });

  const totalCount = questions.length;
  const accuracy = totalCount ? correctCount / totalCount : 0;
  const masteryLabel = accuracy < 0.5 ? "基礎不穩" : accuracy < 0.8 ? "可進下一題" : "已掌握";
  const reviewAfterPass =
    accuracy >= 0.8
      ? "這組基礎題掌握得不錯。你可以繼續下一題，之後再進問答題。"
      : "這組題先過，但有幾個基礎觀念還不夠穩，建議先看錯題解釋。";

  if (accuracy < 0.5) {
    return {
      status: "fail",
      label: masteryLabel,
      awardedExp: 0,
      message: "這組基礎觀念還不穩。先看錯題解釋，再重新做一次會比較有效。",
      hitConcepts: ["已完成整組作答"],
      missingConcepts: incorrectItems.map(function (item) { return item.prompt; }),
      followUpQuestion: "先把錯題的原因看懂，再重做一次。",
      coachMessage: "現在不需要急著進問答題，先把基本判斷補穩。",
      correctCount,
      totalCount,
      incorrectItems,
    };
  }

  if (accuracy < 0.8) {
    return {
      status: "reinforce",
      label: masteryLabel,
      awardedExp: Math.round(quest.exp * 0.75),
      message: "這組題大致有抓到，但還有幾個觀念不夠穩。先看錯題解釋，再繼續會比較扎實。",
      reviewAfterPass,
      hitConcepts: ["已建立基礎輪廓", "可繼續往下"],
      missingConcepts: incorrectItems.map(function (item) { return item.prompt; }),
      followUpQuestion: "哪一題你剛剛最不確定？先把那題看懂。",
      coachMessage: "你已經不是完全沒概念了，接下來重點是把錯的直覺修正過來。",
      correctCount,
      totalCount,
      incorrectItems,
    };
  }

  return {
    status: "pass",
    label: masteryLabel,
    awardedExp: quest.exp,
    message: "這組基礎題已掌握。你已經能做出穩定判斷，可以往下一層題型前進。",
    reviewAfterPass,
    hitConcepts: ["基礎判斷穩定", "可進下一題"],
    missingConcepts: [],
    followUpQuestion: quest.followUpOpenEnded ? "接下來可以挑戰同主題的問答題，把辨識能力轉成輸出。" : "",
    coachMessage: "先把這組的判斷邏輯記住，後面開放題會更好答。",
    correctCount,
    totalCount,
    incorrectItems,
  };
}

function applyQuestReward(progressByTopic, topic, awardedExp, topicMeta) {
  const current = progressByTopic[topic];
  let nextLevel = current.level;
  let nextExp = current.exp + awardedExp;
  let nextMaxExp = current.maxExp;

  while (nextExp >= nextMaxExp) {
    nextExp -= nextMaxExp;
    nextLevel += 1;
    nextMaxExp = getNextThreshold(topicMeta[topic], nextLevel);
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

function deriveTopicStatus(progress) {
  if (progress.level === 0 && progress.exp === 0) {
    return "暖身";
  }
  if (progress.exp >= progress.maxExp * 0.75) {
    return "可升級";
  }
  return "攻略中";
}

function getNextThreshold(topic, level) {
  return topic.baseMaxExp + level * topic.expStep;
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
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return minutes + ":" + seconds;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

createRoot(document.getElementById("root")).render(<App />);
