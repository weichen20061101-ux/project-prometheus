import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronRight,
  Clock3,
  Lightbulb,
  NotebookPen,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Target,
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

const STORAGE_KEY = "prometheus-app-state-v3";

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
          return changed ? { ...current, timeLeft: nextTimeLeft } : current;
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
        activeStory: topicMeta[activeStory] ? activeStory : topicOrder[0],
        pageView,
        customTopics: normalizedCustomTopics,
        learningSettings,
        progressByTopic: normalizedProgress,
        dailyState: currentDailyState,
      });
    },
    [activeStory, pageView, normalizedCustomTopics, learningSettings, normalizedProgress, currentDailyState, topicMeta, topicOrder],
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

  const currentStory = topicMeta[activeStory] || topicMeta[topicOrder[0]];
  const focusedQuest = currentDailyState.focusQuestId ? questIndex[currentDailyState.focusQuestId] : null;
  const focusedResult = focusedQuest ? currentDailyState.results[focusedQuest.id] : null;
  const activeQuestIds = currentDailyState.topicQuestIds[activeStory] || [];
  const activeTopicQuests = activeQuestIds.map(function (questId) {
    return questIndex[questId];
  }).filter(Boolean);
  const nextQuestAfterFocused = focusedQuest
    ? (currentDailyState.topicQuestIds[focusedQuest.topic] || [])
        .map(function (questId) { return questIndex[questId]; })
        .filter(Boolean)
        .find(function (quest) { return !currentDailyState.completedQuestIds.includes(quest.id) && quest.id !== focusedQuest.id; }) || null
    : null;
  const totalEarnedExp = Object.values(currentDailyState.awardedExp).reduce(function (sum, value) {
    return sum + value;
  }, 0);
  const completedToday = currentDailyState.completedQuestIds.length;
  const startedToday = currentDailyState.startedQuestIds.length;

  const isExamMode = Boolean(
    focusedQuest &&
    currentDailyState.startedQuestIds.includes(focusedQuest.id) &&
    !currentDailyState.completedQuestIds.includes(focusedQuest.id),
  );

  const isResultMode = Boolean(pageView === "result" && focusedQuest && focusedResult);

  function openTopic(topicId) {
    setActiveStory(topicId);
    setPageView("topic");
  }

  function startQuest(quest) {
    setPageView("topic");
    setDailyState(function (current) {
      const startedQuestIds = current.startedQuestIds.includes(quest.id)
        ? current.startedQuestIds
        : [...current.startedQuestIds, quest.id];
      const multiplier = getTimerMultiplier(learningSettings);
      return {
        ...current,
        startedQuestIds,
        focusQuestId: quest.id,
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
      const baseQuizAnswer =
        currentAnswer && typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
          ? { ...currentAnswer }
          : {};
      const question = questIndex[questId]?.questions?.find(function (item) {
        return item.id === questionId;
      });
      let nextValue = value;
      if (question?.format === "multi_select") {
        const previousValues = Array.isArray(baseQuizAnswer[questionId]) ? baseQuizAnswer[questionId] : [];
        nextValue = previousValues.includes(value)
          ? previousValues.filter(function (item) { return item !== value; })
          : [...previousValues, value];
      }
      const nextQuizAnswer = { ...baseQuizAnswer, [questionId]: nextValue };
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
      const quest = questIndex[current.focusQuestId];
      const nextStep = getHintStep(learningSettings);
      return {
        ...current,
        hintLevel: Math.min((quest?.hints || []).length, current.hintLevel + nextStep),
      };
    });
  }

  function submitQuest(quest) {
    const answer = currentDailyState.answers[quest.id] || (quest.type === "quiz_group" ? {} : "");
    const existingAward = currentDailyState.awardedExp[quest.id] || 0;
    const existingResult = currentDailyState.results[quest.id];
    const evaluation = evaluateAnswer(answer, quest, learningSettings);

    if (evaluation.status === "fail") {
      setDailyState(function (current) {
        return {
          ...current,
          focusQuestId: quest.id,
          results: {
            ...current.results,
            [quest.id]: evaluation,
          },
        };
      });
      setPageView("result");
      return;
    }

    if (existingResult?.status === "pass") {
      setPageView("result");
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
      return {
        ...current,
        completedQuestIds: nextCompletedQuestIds,
        focusQuestId: quest.id,
        hintLevel: 0,
        awardedExp: {
          ...current.awardedExp,
          [quest.id]: evaluation.awardedExp,
        },
        results: {
          ...current.results,
          [quest.id]: evaluation,
        },
      };
    });
    setPageView("result");
  }

  function retryFocusedQuest() {
    if (!focusedQuest) {
      return;
    }
    setDailyState(function (current) {
      return {
        ...current,
        focusQuestId: focusedQuest.id,
        results: {
          ...current.results,
          [focusedQuest.id]: undefined,
        },
      };
    });
    setPageView("topic");
  }

  function exitFocusedQuest() {
    setDailyState(function (current) {
      return {
        ...current,
        focusQuestId: null,
        hintLevel: 0,
      };
    });
    setPageView("topic");
  }

  function resetDay() {
    setDailyState(createDailyState(normalizedProgress, getDateKey(), questPools, topicOrder, learningSettings));
    setPageView("overview");
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
      goal: topicDraft.goal.trim() || "自訂一條新的長線主題。",
      primarySkill,
      skills: topicDraft.skillsText
        .split(/[,，]/)
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

  if (isExamMode && focusedQuest) {
    return (
      <ExamPage
        currentStory={currentStory}
        focusedQuest={focusedQuest}
        answer={currentDailyState.answers[focusedQuest.id] || (focusedQuest.type === "quiz_group" ? {} : "")}
        hintLevel={currentDailyState.hintLevel}
        timerMode={learningSettings.timerMode}
        secondsLeft={currentDailyState.timeLeft[focusedQuest.id] ?? 0}
        onBack={exitFocusedQuest}
        onHint={showHint}
        onAnswer={updateAnswer}
        onQuizAnswer={updateQuizAnswer}
        onSubmit={submitQuest}
      />
    );
  }

  if (isResultMode && focusedQuest && focusedResult) {
    return (
      <ResultPage
        topicOrder={topicOrder}
        topicMeta={topicMeta}
        activeStory={activeStory}
        onTopicChange={openTopic}
        quest={focusedQuest}
        result={focusedResult}
        progress={normalizedProgress[focusedQuest.topic]}
        nextQuest={nextQuestAfterFocused}
        onRetry={retryFocusedQuest}
        onStartNext={function (quest) {
          startQuest(quest);
        }}
        onGoOverview={function () {
          setPageView("overview");
        }}
        onOpenTopic={function (topicId) {
          setActiveStory(topicId);
          setPageView("topic");
        }}
        onBack={function () {
          setPageView("topic");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <TopShell
        topicOrder={topicOrder}
        topicMeta={topicMeta}
        activeStory={activeStory}
        pageView={pageView}
        onHome={function () { setPageView("overview"); }}
        onTopicChange={openTopic}
      />

      {pageView === "overview" ? (
        <OverviewPage
          topicOrder={topicOrder}
          topicMeta={topicMeta}
          progressByTopic={normalizedProgress}
          totalEarnedExp={totalEarnedExp}
          completedToday={completedToday}
          startedToday={startedToday}
          onOpenTopic={openTopic}
          learningSettings={learningSettings}
          onUpdateSetting={updateSetting}
          onResetDay={resetDay}
          topicDraft={topicDraft}
          onUpdateTopicDraft={updateTopicDraft}
          onAddCustomTopic={addCustomTopic}
        />
      ) : (
        <TopicPage
          story={currentStory}
          progress={normalizedProgress[activeStory]}
          quests={activeTopicQuests}
          dailyState={currentDailyState}
          timerMode={learningSettings.timerMode}
          onBack={function () { setPageView("overview"); }}
          onStartQuest={startQuest}
          onContinueQuest={function (quest) {
            setDailyState(function (current) {
              return { ...current, focusQuestId: quest.id };
            });
          }}
          onViewResult={function (quest) {
            setDailyState(function (current) {
              return { ...current, focusQuestId: quest.id };
            });
            setPageView("result");
          }}
        />
      )}
    </main>
  );
}

function TopShell(props) {
  const { topicOrder, topicMeta, activeStory, pageView, onHome, onTopicChange } = props;
  return (
    <header className="border-b border-white/8 bg-[#08111d]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={onHome} className="text-left">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Project Prometheus</p>
            <h1 className="mt-1 text-lg font-black text-white md:text-xl">Knowledge Raid System</h1>
          </button>
          <div className="flex flex-wrap gap-2">
            {topicOrder.map(function (topicId) {
              const active = topicId === activeStory && pageView !== "overview";
              return (
                <button
                  key={topicId}
                  onClick={function () { onTopicChange(topicId); }}
                  className={
                    "rounded-full border px-3 py-2 text-sm font-bold transition md:px-4 " +
                    (active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                      : "border-white/8 bg-[#0b1525] text-slate-300 hover:border-cyan-400/20 hover:text-white")
                  }
                >
                  {topicMeta[topicId].title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

function OverviewPage(props) {
  const {
    topicOrder,
    topicMeta,
    progressByTopic,
    totalEarnedExp,
    completedToday,
    startedToday,
    onOpenTopic,
    learningSettings,
    onUpdateSetting,
    onResetDay,
    topicDraft,
    onUpdateTopicDraft,
    onAddCustomTopic,
  } = props;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/8 bg-[#08111d] p-6 shadow-[0_24px_80px_rgba(2,12,27,0.35)] md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
            <Sparkles size={14} />
            每天只做今天該做的題
          </p>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">先選主題，再進入今天的題組。</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            這個版本先把學習流程做穩。你進來先選主題，進主題頁只看今天的任務；開始測驗後，畫面只保留題目、學習資源、倒數與提交。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <MetricCard label="今日已完成" value={String(completedToday)} hint="完成後才會累積 EXP" />
          <MetricCard label="今日已開始" value={String(startedToday)} hint="開始後可隨時回來續作" />
          <MetricCard label="總 EXP" value={String(totalEarnedExp)} hint="所有題目累積的經驗值" />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/8 bg-[#08111d] p-5">
        <div className="mb-4 flex items-center gap-3">
          <Target className="text-cyan-300" size={18} />
          <h3 className="text-lg font-black text-white">今天怎麼用</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FlowCard step="01" title="選主題" body="先進入你今天要推進的主線，只看那個主題的任務。" />
          <FlowCard step="02" title="讀資源" body="每題都先看學習資料與導讀，再開始作答。" />
          <FlowCard step="03" title="交卷驗收" body="交卷後直接看結果、錯因和補強方向。" />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <Brain className="text-cyan-300" size={18} />
          <h3 className="text-lg font-black text-white">主題列表</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topicOrder.map(function (topicId) {
            const topic = topicMeta[topicId];
            const progress = progressByTopic[topicId];
            const status = deriveTopicStatus(progress);
            return (
              <button
                key={topicId}
                onClick={function () { onOpenTopic(topicId); }}
                className="rounded-2xl border border-white/8 bg-[#08111d] p-4 text-left transition hover:border-cyan-400/25 hover:bg-[#0c1728]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-cyan-200">{topic.primarySkill}</p>
                    <h4 className="mt-1 text-lg font-black text-white md:text-xl">{topic.title}</h4>
                  </div>
                  <span className="rounded-full border border-white/8 bg-[#0b1525] px-3 py-1 text-xs font-bold text-slate-300">
                    Lv.{progress.level}
                  </span>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-300">{topic.goal}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{status}</span>
                    <span>{progress.exp}/{progress.maxExp}</span>
                  </div>
                  <ProgressBar value={progress.exp} max={progress.maxExp} />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
                  進入主題 <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/8 bg-[#08111d] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Settings2 className="text-cyan-300" size={18} />
            <h3 className="text-lg font-black text-white">學習設定</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SettingSelect
              title="每日題量"
              value={learningSettings.dailyLoad}
              options={SETTINGS_OPTIONS.dailyLoad}
              onChange={function (value) { onUpdateSetting("dailyLoad", value); }}
            />
            <SettingSelect
              title="驗收模式"
              value={learningSettings.reviewMode}
              options={SETTINGS_OPTIONS.reviewMode}
              onChange={function (value) { onUpdateSetting("reviewMode", value); }}
            />
            <SettingSelect
              title="倒數模式"
              value={learningSettings.timerMode}
              options={SETTINGS_OPTIONS.timerMode}
              onChange={function (value) { onUpdateSetting("timerMode", value); }}
            />
            <SettingSelect
              title="提示模式"
              value={learningSettings.hintMode}
              options={SETTINGS_OPTIONS.hintMode}
              onChange={function (value) { onUpdateSetting("hintMode", value); }}
            />
          </div>
          <button
            onClick={onResetDay}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1525] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
          >
            <RotateCcw size={16} />
            重新生成今天任務
          </button>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#08111d] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Target className="text-cyan-300" size={18} />
            <h3 className="text-lg font-black text-white">新增主題</h3>
          </div>
          <div className="space-y-3">
            <input
              value={topicDraft.title}
              onChange={function (event) { onUpdateTopicDraft("title", event.target.value); }}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1525] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
              placeholder="主題名稱"
            />
            <input
              value={topicDraft.primarySkill}
              onChange={function (event) { onUpdateTopicDraft("primarySkill", event.target.value); }}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1525] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
              placeholder="核心技能"
            />
            <input
              value={topicDraft.skillsText}
              onChange={function (event) { onUpdateTopicDraft("skillsText", event.target.value); }}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1525] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
              placeholder="子技能，用逗號分隔"
            />
            <textarea
              value={topicDraft.goal}
              onChange={function (event) { onUpdateTopicDraft("goal", event.target.value); }}
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1525] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
              placeholder="這個主題想達成什麼"
            />
            <button
              onClick={onAddCustomTopic}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              <Sparkles size={16} />
              建立主題
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TopicPage(props) {
  const { story, progress, quests, dailyState, timerMode, onBack, onStartQuest, onContinueQuest, onViewResult } = props;
  const completedCount = quests.filter(function (quest) {
    return dailyState.completedQuestIds.includes(quest.id);
  }).length;
  const startedCount = quests.filter(function (quest) {
    return dailyState.startedQuestIds.includes(quest.id);
  }).length;
  const primaryQuest = quests[0] || null;
  const primaryResources = Array.isArray(primaryQuest?.resources) ? primaryQuest.resources.slice(0, 2) : [];
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1525] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
      >
        <ArrowLeft size={16} />
        返回首頁
      </button>

      <section className="mt-5 rounded-3xl border border-white/8 bg-[#08111d] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-sm text-cyan-200">{story.primarySkill}</p>
            <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">{story.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{story.goal}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {story.skills.map(function (skill) {
                return (
                  <span key={skill} className="rounded-full border border-white/8 bg-[#0b1525] px-3 py-1 text-xs text-slate-300">
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="min-w-[220px] rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
            <p className="text-sm font-bold text-cyan-200">主題進度</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-black text-white">Lv.{progress.level}</span>
              <span className="text-sm text-slate-300">{deriveTopicStatus(progress)}</span>
            </div>
            <div className="mt-3 text-sm text-slate-400">{progress.exp}/{progress.maxExp} EXP</div>
            <ProgressBar value={progress.exp} max={progress.maxExp} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="今日題數" value={String(quests.length)} hint="只顯示這個主題今天抽到的題目" />
        <MetricCard label="已開始" value={String(startedCount)} hint="中途離開也可以回來續答" />
        <MetricCard label="已完成" value={String(completedCount)} hint="完成後會發放這個主題的 EXP" />
      </section>

      {primaryQuest && primaryResources.length ? (
        <section className="mt-6 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="text-cyan-300" size={18} />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Study First</p>
              <h3 className="text-lg font-black text-white">今日學習資料</h3>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-300">{primaryQuest.title}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {primaryResources.map(function (resource) {
              const key = resource.label + "-" + (resource.content || resource.url || "");
              return (
                <div key={key} className="rounded-2xl border border-white/8 bg-[#09131f] p-4">
                  <p className="text-sm font-bold text-cyan-200">{resource.label}</p>
                  {resource.type === "link" ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm text-cyan-300 underline underline-offset-4"
                    >
                      開啟連結
                    </a>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-300">{resource.content}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border border-white/8 bg-[#08111d] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="text-cyan-300" size={18} />
          <h3 className="text-lg font-black text-white">作答前提醒</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FlowCard step="01" title="先看導讀" body="每題的學習資料會告訴你這題想練什麼。" />
          <FlowCard step="02" title="再進測驗" body="進入測驗後，畫面只保留和作答有關的內容。" />
          <FlowCard step="03" title="看結果補強" body="答完先看錯因，再決定要不要重做一次。" />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/8 bg-[#08111d] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="text-cyan-300" size={18} />
          <h3 className="text-lg font-black text-white">今天的題組</h3>
        </div>
        <div className="space-y-4">
          {quests.map(function (quest) {
            const started = dailyState.startedQuestIds.includes(quest.id);
            const completed = dailyState.completedQuestIds.includes(quest.id);
            const result = dailyState.results[quest.id];
            return (
              <QuestListItem
                key={quest.id}
                quest={quest}
                started={started}
                completed={completed}
                result={result}
                timerMode={timerMode}
                secondsLeft={dailyState.timeLeft[quest.id] ?? 0}
                onStart={onStartQuest}
                onContinue={onContinueQuest}
                onViewResult={onViewResult}
              />
            );
          })}
          {!quests.length ? <EmptyState title="今天這個主題沒有抽到題目。" body="題庫不足或等級資料還沒對上時，這裡會保持空白。" /> : null}
        </div>
      </section>
    </div>
  );
}

function ExamPage(props) {
  const {
    currentStory,
    focusedQuest,
    answer,
    hintLevel,
    timerMode,
    secondsLeft,
    onBack,
    onHint,
    onAnswer,
    onQuizAnswer,
    onSubmit,
  } = props;

  const quizAnswer = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
  const answeredCount = focusedQuest.type === "quiz_group"
    ? focusedQuest.questions.filter(function (question) { return isQuizQuestionAnswered(question, quizAnswer); }).length
    : 0;
  const visibleHints = Array.isArray(focusedQuest.hints) ? focusedQuest.hints.slice(0, hintLevel) : [];

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-white/8 bg-[#08111d]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Focus Mode</p>
            <h1 className="mt-1 text-lg font-black text-white md:text-xl">{focusedQuest.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{currentStory.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TopMiniPill icon={Clock3} label={timerMode === "off" ? "不限時" : formatTime(secondsLeft)} />
            <TopMiniPill icon={NotebookPen} label={focusedQuest.type === "quiz_group" ? answeredCount + "/" + focusedQuest.questions.length : "問答題"} />
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0b1525] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
            >
              <ArrowLeft size={16} />
              離開測驗
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-8 md:px-8">
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/8 bg-[#08111d] p-5">
            <div className="mb-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Study Guide</p>
                <h2 className="mt-1 text-base font-black text-white">學習資料</h2>
                <p className="mt-2 text-sm font-bold text-cyan-200">{focusedQuest.materialTitle}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  {focusedQuest.materials.slice(0, 3).map(function (item) {
                    return (
                      <li key={item} className="flex gap-2">
                        <ChevronRight className="mt-1 shrink-0 text-cyan-300" size={15} />
                        {item}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {Array.isArray(focusedQuest.resources) && focusedQuest.resources.length ? (
              <div className="mb-5 rounded-2xl border border-white/8 bg-[#0b1525] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reference</p>
                    <h3 className="mt-1 text-base font-black text-white">補充資料</h3>
                  </div>
                  <button
                    onClick={onHint}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-[#09131f] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
                  >
                    <Lightbulb size={16} />
                    提示
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {focusedQuest.resources.map(function (resource) {
                    const key = resource.label + "-" + (resource.content || resource.url || "");
                    return (
                      <div key={key} className="rounded-2xl border border-white/8 bg-[#09131f] p-4">
                        <p className="text-sm font-bold text-cyan-200">{resource.label}</p>
                        {resource.type === "link" ? (
                          <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-cyan-300 underline underline-offset-4">
                            開啟連結
                          </a>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-slate-300">{resource.content}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-5 flex justify-end">
                <button
                  onClick={onHint}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-[#0b1525] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
                >
                  <Lightbulb size={16} />
                  提示
                </button>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Question Set</p>
              <h2 className="mt-1 text-base font-black text-white md:text-lg">開始作答</h2>
            </div>

            {focusedQuest.type === "quiz_group" ? (
              <div className="space-y-4">
                {focusedQuest.questions.map(function (question, index) {
                  return (
                    <div key={question.id} className="rounded-2xl border border-white/8 bg-[#0b1525] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Question {index + 1}</p>
                      {question.format === "multi_select" ? (
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Multi Select</p>
                      ) : null}
                      <p className="mt-2 text-sm leading-7 text-white md:text-base">{question.prompt}</p>
                      <div className="mt-4 space-y-3">
                        {question.options.map(function (option) {
                          const selected = question.format === "multi_select"
                            ? Array.isArray(quizAnswer[question.id]) && quizAnswer[question.id].includes(option.id)
                            : quizAnswer[question.id] === option.id;
                          return (
                            <label
                              key={option.id}
                              className={
                                "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-sm transition " +
                                (selected
                                  ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                                  : "border-white/8 bg-[#09131f] text-slate-300 hover:border-cyan-400/20")
                              }
                            >
                              <input
                                type={question.format === "multi_select" ? "checkbox" : "radio"}
                                name={focusedQuest.id + "-" + question.id}
                                value={option.id}
                                checked={selected}
                                onChange={function () { onQuizAnswer(focusedQuest.id, question.id, option.id); }}
                                className="mt-1 h-4 w-4 accent-cyan-400"
                              />
                              <span className="leading-6">{option.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-[#0b1525] p-5">
                  <ul className="space-y-3 text-sm leading-6 text-slate-300">
                    {focusedQuest.questions.map(function (question) {
                      return (
                        <li key={question} className="flex gap-2">
                          <ChevronRight className="mt-1 shrink-0 text-slate-400" size={15} />
                          {question}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <textarea
                  value={answer}
                  onChange={function (event) { onAnswer(focusedQuest.id, event.target.value); }}
                  rows={10}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1525] p-4 text-sm leading-6 text-white outline-none transition focus:border-cyan-400/40"
                  placeholder={focusedQuest.clear}
                />
              </div>
            )}

            {visibleHints.length ? (
              <div className="mt-5 space-y-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <p className="text-sm font-bold text-cyan-200">提示</p>
                {visibleHints.map(function (hint) {
                  return (
                    <p key={hint} className="text-sm leading-6 text-slate-200">
                      {hint}
                    </p>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
              <p className="text-sm text-slate-400">{focusedQuest.clear}</p>
              <button
                onClick={function () { onSubmit(focusedQuest); }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <NotebookPen size={16} />
                提交驗收
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultPage(props) {
  const { topicOrder, topicMeta, activeStory, onTopicChange, quest, result, progress, nextQuest, onRetry, onStartNext, onGoOverview, onBack } = props;
  const canRetry = result.status === "fail";
  const nextActionTitle =
    result.status === "fail"
      ? "先補觀念再重做"
      : result.status === "reinforce"
        ? "先補強，再決定是否前進"
        : "保持節奏，繼續下一題";
  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <TopShell
        topicOrder={topicOrder}
        topicMeta={topicMeta}
        activeStory={activeStory}
        pageView="result"
        onHome={onBack}
        onTopicChange={onTopicChange}
      />
      <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
        <div className="rounded-3xl border border-white/8 bg-[#08111d] p-6 shadow-[0_24px_80px_rgba(2,12,27,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Result</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">{quest.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{quest.track}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="結果" value={result.label} hint={result.message} />
            <MetricCard label="獲得 EXP" value={String(result.awardedExp)} hint="通過後才會累積到主題進度" />
            <MetricCard label="主題進度" value={"Lv." + progress.level} hint={progress.exp + "/" + progress.maxExp + " EXP"} />
          </div>

          <div className="mt-6">
            <ReviewBadge result={result} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-[#0b1525] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Next Step</p>
            <h2 className="mt-2 text-lg font-black text-white">{nextActionTitle}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {canRetry ? (
                <FlowCard
                  step="01"
                  title="重做同一題"
                  body="先看錯因和提示，回到同一題重新作答。"
                />
              ) : result.status === "reinforce" ? (
                <FlowCard
                  step="01"
                  title="補強這一題"
                  body="這題已過線，但先把缺漏概念補齊會更穩。"
                />
              ) : (
                <FlowCard
                  step="01"
                  title="保留這題節奏"
                  body="這題已通過，維持同樣的作答結構往下一題推進。"
                />
              )}
              <FlowCard
                step="02"
                title="回主題頁"
                body="回到同一主題，決定是繼續這條線還是切換主題。"
              />
              <FlowCard
                step="03"
                title={nextQuest ? "前往下一題" : "切換其他主題"}
                body={nextQuest ? "今天這個主題還有下一題可以直接開始。" : "這個主題今天沒有下一題了，可以切去別的主題。"}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {canRetry ? (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <Play size={16} />
                回到題目重做
              </button>
            ) : null}
            {!canRetry && nextQuest ? (
              <button
                onClick={function () { onStartNext(nextQuest); }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <Play size={16} />
                開始下一題
              </button>
            ) : null}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1525] px-4 py-2 font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
            >
              <ArrowLeft size={16} />
              回到主題頁
            </button>
            {!nextQuest ? (
              <button
                onClick={onGoOverview}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1525] px-4 py-2 font-bold text-slate-200 transition hover:border-cyan-400/20 hover:text-white"
              >
                <ChevronRight size={16} />
                切換主題
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function QuestListItem(props) {
  const { quest, started, completed, result, timerMode, secondsLeft, onStart, onContinue, onViewResult } = props;
  const actionLabel = completed ? "查看結果" : started ? "繼續測驗" : "開始測驗";
  const actionHandler = completed ? onViewResult : started ? onContinue : onStart;
  return (
    <article className="rounded-2xl border border-white/8 bg-[#0b1525] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/8 bg-[#09131f] px-3 py-1 text-xs text-slate-300">Lv.{quest.minLevel}</span>
            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-200">{quest.skill}</span>
          </div>
          <h4 className="mt-3 text-lg font-black text-white md:text-xl">{quest.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">{quest.materialTitle}</p>
        </div>
        <div className="min-w-[180px] space-y-2">
          <div className="rounded-xl border border-white/8 bg-[#09131f] px-3 py-2 text-sm text-slate-300">
            {timerMode === "off" ? "不限時" : formatTime(secondsLeft)}
          </div>
          <div className="rounded-xl border border-white/8 bg-[#09131f] px-3 py-2 text-sm text-slate-300">
            +{quest.exp} EXP
          </div>
        </div>
      </div>

      {Array.isArray(quest.resources) && quest.resources.length ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-cyan-200">學習資料</p>
            <span className="text-xs text-cyan-100/70">開始前先看</span>
          </div>
          <div className="mt-3 space-y-3">
            {quest.resources.slice(0, 2).map(function (resource) {
              const key = resource.label + "-" + (resource.content || resource.url || "");
              return (
                <div key={key} className="rounded-xl border border-white/8 bg-[#09131f] p-3">
                  <p className="text-sm font-bold text-white">{resource.label}</p>
                  {resource.type === "link" ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm text-cyan-300 underline underline-offset-4"
                    >
                      開啟連結
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

      {Array.isArray(quest.summary) && quest.summary.length ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-[#09131f] p-4">
          <p className="text-sm font-bold text-white">你會先學到</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {quest.summary.slice(0, 2).map(function (item) {
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          {completed ? "已完成" : started ? "已開始，可繼續作答" : "尚未開始"}
        </div>
        <div className="flex flex-wrap gap-2">
          {result ? (
            <span className="rounded-full border border-white/8 bg-[#09131f] px-3 py-2 text-xs text-slate-300">{result.label}</span>
          ) : null}
          <button
            onClick={function () { actionHandler(quest); }}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            <Play size={16} />
            {actionLabel}
          </button>
        </div>
      </div>
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
    <div className={"rounded-2xl border p-4 text-sm leading-6 " + palette}>
      <p className="font-bold">{result.label}</p>
      <p className="mt-2">{result.message}</p>
      {typeof result.correctCount === "number" && typeof result.totalCount === "number" ? (
        <p className="mt-3 font-bold">答對 {result.correctCount} / {result.totalCount}</p>
      ) : null}
      {Array.isArray(result.incorrectItems) && result.incorrectItems.length ? (
        <div className="mt-4 space-y-3">
          {result.incorrectItems.map(function (item) {
            return (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="font-bold text-white">{item.prompt}</p>
                <p className="mt-1">你的答案：{item.selectedText || "未作答"}</p>
                <p className="mt-1">正確答案：{item.correctText}</p>
                <p className="mt-1">{item.explanation}</p>
              </div>
            );
          })}
        </div>
      ) : null}
      {result.hitConcepts?.length ? <p className="mt-3">有碰到的概念：{result.hitConcepts.join("、")}</p> : null}
      {result.missingConcepts?.length ? <p className="mt-2">還沒補到的概念：{result.missingConcepts.join("、")}</p> : null}
      {result.followUpQuestion ? <p className="mt-2 font-bold">追問：{result.followUpQuestion}</p> : null}
      {result.coachMessage ? <p className="mt-2">建議：{result.coachMessage}</p> : null}
    </div>
  );
}

function SettingSelect(props) {
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
                "w-full rounded-2xl border px-3 py-3 text-left transition " +
                (active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                  : "border-white/8 bg-[#0b1525] text-slate-300 hover:border-cyan-400/20")
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

function MetricCard(props) {
  const { label, value, hint } = props;
  return (
    <div className="rounded-3xl border border-white/8 bg-[#08111d] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-white md:text-2xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
    </div>
  );
}

function FlowCard(props) {
  const { step, title, body } = props;
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b1525] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{step}</p>
      <h4 className="mt-2 text-base font-black text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function TopMiniPill(props) {
  const { icon: Icon, label } = props;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0b1525] px-4 py-2 text-sm font-bold text-slate-200">
      <Icon size={15} />
      {label}
    </div>
  );
}

function EmptyState(props) {
  const { title, body } = props;
  return (
    <div className="rounded-3xl border border-dashed border-white/12 bg-[#0b1525] p-5">
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function ProgressBar(props) {
  const { value, max } = props;
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-cyan-400" style={{ width: percent + "%" }} />
    </div>
  );
}

function loadInitialState() {
  const stored = readStoredState();
  return {
    activeStory: stored?.activeStory || "analyst",
    pageView: stored?.pageView || "overview",
    customTopics: Array.isArray(stored?.customTopics) ? stored.customTopics : [],
    learningSettings: { ...DEFAULT_SETTINGS, ...(stored?.learningSettings || {}) },
    progressByTopic: stored?.progressByTopic || {},
    dailyState: stored?.dailyState || createEmptyDailyState(),
  };
}

function createEmptyDailyState() {
  return {
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
    const level = typeof current.level === "number" ? current.level : base.level;
    next[topicId] = {
      level,
      exp: typeof current.exp === "number" ? current.exp : base.exp,
      maxExp: typeof current.maxExp === "number" ? current.maxExp : getNextThreshold(topicMeta[topicId], level),
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
    topicQuestIds: normalizedTopicQuestIds,
    completedQuestIds: Array.isArray(dailyState.completedQuestIds) ? dailyState.completedQuestIds : [],
    startedQuestIds: Array.isArray(dailyState.startedQuestIds) ? dailyState.startedQuestIds : [],
    answers: dailyState.answers || {},
    timeLeft: dailyState.timeLeft || {},
    awardedExp: dailyState.awardedExp || {},
    results: dailyState.results || {},
    hintLevel: typeof dailyState.hintLevel === "number" ? dailyState.hintLevel : 0,
    focusQuestId: dailyState.focusQuestId || rebuilt.focusQuestId,
    unlockedTopics: topicOrder,
  };
}

function createDailyState(progressByTopic, dateKey, questPools, topicOrder, settings) {
  const loadCount = getDailyLoadCount(settings);
  const topicQuestIds = {};
  topicOrder.forEach(function (topicId) {
    const pool = questPools[topicId] || [];
    if (!pool.length) {
      topicQuestIds[topicId] = [];
      return;
    }
    topicQuestIds[topicId] = pickQuestSet(pool, {
      level: progressByTopic[topicId].level,
      dateKey,
      seedScope: topicId + "-daily",
      count: loadCount,
      excludeIds: [],
    }).map(function (quest) {
      return quest.id;
    });
  });
  return {
    dateKey,
    gateQuestId: null,
    topicQuestIds,
    unlockedTopics: topicOrder,
    completedQuestIds: [],
    startedQuestIds: [],
    answers: {},
    timeLeft: {},
    awardedExp: {},
    results: {},
    hintLevel: 0,
    focusQuestId: null,
  };
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
    candidates = pool.filter(function (quest) {
      return !excluded.has(quest.id);
    });
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

  const plain = String(answer || "").replace(/\s+/g, " ").trim();
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
    .filter(function (item) { return !matchedConcepts.includes(item); })
    .map(function (item) { return item.concept; });
  const coverageRate = rubricChecks.length ? matchedConcepts.length / rubricChecks.length : 1;
  const followUpQuestion = missingConcepts.length
    ? rubricChecks.find(function (item) { return item.concept === missingConcepts[0]; })?.followUp || "請把缺少的概念補完整。"
    : "";
  const coachMessage = missingConcepts.length
    ? rubricChecks.find(function (item) { return item.concept === missingConcepts[0]; })?.coachNote || "先把關鍵概念說清楚，再寫結論。"
    : "結構已經成形，可以進下一題。";

  if (plain.length < thresholds.minFailLength || sentenceCount < Math.max(2, quest.questions.length - 1)) {
    return {
      status: "fail",
      label: "未達標",
      awardedExp: 0,
      message: "內容太短，還不足以判斷你是否真的理解。先用自己的話把概念講完整。",
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
      message: "主架構有了，但還缺少一些關鍵概念，建議先補齊再往上加難度。",
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
    message: "這題已經達到目前等級要求，可以繼續往下一題推進。",
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
    return !isQuizQuestionAnswered(question, quizAnswer);
  });

  if (unansweredItems.length) {
    return {
      status: "fail",
      label: "未達標",
      awardedExp: 0,
      message: "題組還沒作答完整，先把每一題都完成再提交。",
      hitConcepts: [],
      missingConcepts: unansweredItems.map(function (_, index) { return "第 " + String(index + 1) + " 題"; }),
      followUpQuestion: "先把未作答題目補完。",
      coachMessage: "這一版先要求完整作答，不留空題。",
      correctCount: questions.length - unansweredItems.length,
      totalCount: questions.length,
      incorrectItems: [],
    };
  }

  const incorrectItems = [];
  let correctCount = 0;
  questions.forEach(function (question) {
    const selected = quizAnswer[question.id];
    if (isCorrectQuizSelection(question, selected)) {
      correctCount += 1;
      return;
    }
    incorrectItems.push({
      id: question.id,
      prompt: question.prompt,
      selectedText: getQuizOptionText(question, selected),
      correctText: getCorrectQuizOptionText(question),
      explanation: question.explanation,
    });
  });

  const totalCount = questions.length;
  const accuracy = totalCount ? correctCount / totalCount : 0;

  if (accuracy < 0.5) {
    return {
      status: "fail",
      label: "未達標",
      awardedExp: 0,
      message: "錯誤率偏高，建議先看學習資源再重做一次。",
      hitConcepts: [],
      missingConcepts: incorrectItems.map(function (item) { return item.prompt; }),
      followUpQuestion: "你能說出自己錯在哪一個判斷嗎？",
      coachMessage: "先修正觀念，不急著刷題。",
      correctCount,
      totalCount,
      incorrectItems,
    };
  }

  if (accuracy < 0.8) {
    return {
      status: "reinforce",
      label: "通過但需補強",
      awardedExp: Math.round(quest.exp * 0.7),
      message: "大方向正確，但仍有幾個觀念不穩，先看錯題解釋再進下一題。",
      hitConcepts: [],
      missingConcepts: incorrectItems.map(function (item) { return item.prompt; }),
      followUpQuestion: "把錯題重新講一次理由。",
      coachMessage: "觀念已經接近，但還不夠紮實。",
      correctCount,
      totalCount,
      incorrectItems,
    };
  }

  return {
    status: "pass",
    label: "通過",
    awardedExp: quest.exp,
    message: "這組題目已經掌握，可以往下一組走。",
    hitConcepts: [],
    missingConcepts: incorrectItems.map(function (item) { return item.prompt; }),
    followUpQuestion: incorrectItems.length ? "把最後幾題的錯因補一下。" : "",
    coachMessage: incorrectItems.length ? "整體通過，但還有局部細節可以補強。" : "正確率夠高，直接前進。",
    correctCount,
    totalCount,
    incorrectItems,
  };
}

function isQuizQuestionAnswered(question, quizAnswer) {
  const value = quizAnswer[question.id];
  if (question.format === "multi_select") {
    return Array.isArray(value) && value.length > 0;
  }
  return Boolean(value);
}

function isCorrectQuizSelection(question, selected) {
  if (question.format === "multi_select") {
    const selectedValues = Array.isArray(selected) ? [...selected].sort() : [];
    const correctValues = Array.isArray(question.correctAnswer) ? [...question.correctAnswer].sort() : [];
    return selectedValues.length === correctValues.length && correctValues.every(function (value, index) {
      return value === selectedValues[index];
    });
  }
  return selected === question.correctAnswer;
}

function getQuizOptionText(question, selected) {
  if (Array.isArray(selected)) {
    return selected
      .map(function (id) {
        return question.options.find(function (option) { return option.id === id; })?.text || "";
      })
      .filter(Boolean)
      .join(" / ");
  }
  return question.options.find(function (option) { return option.id === selected; })?.text || "";
}

function getCorrectQuizOptionText(question) {
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer
      .map(function (id) {
        return question.options.find(function (option) { return option.id === id; })?.text || "";
      })
      .filter(Boolean)
      .join(" / ");
  }
  return question.options.find(function (option) { return option.id === question.correctAnswer; })?.text || "";
}

function applyQuestReward(progressByTopic, topicId, deltaExp, topicMeta) {
  const current = progressByTopic[topicId] || {
    level: 0,
    exp: 0,
    maxExp: getNextThreshold(topicMeta[topicId], 0),
  };
  let nextLevel = current.level;
  let nextExp = current.exp + deltaExp;
  let nextMaxExp = current.maxExp;

  while (nextExp >= nextMaxExp && nextLevel < 9) {
    nextExp -= nextMaxExp;
    nextLevel += 1;
    nextMaxExp = getNextThreshold(topicMeta[topicId], nextLevel);
  }

  return {
    ...progressByTopic,
    [topicId]: {
      level: nextLevel,
      exp: nextExp,
      maxExp: nextMaxExp,
    },
  };
}

function deriveTopicStatus(progress) {
  if (!progress) {
    return "未開始";
  }
  if (progress.level >= 8) {
    return "高階推進中";
  }
  if (progress.level >= 5) {
    return "中階建立中";
  }
  if (progress.level >= 2) {
    return "基礎累積中";
  }
  return "起步中";
}

function getNextThreshold(topic, level) {
  const base = topic?.baseMaxExp || 120;
  const step = topic?.expStep || 40;
  return base + step * level;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
}

function getDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function hashString(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
