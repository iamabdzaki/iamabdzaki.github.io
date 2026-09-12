(() => {
  "use strict";

  const SESSION_SECONDS = new URLSearchParams(window.location.search).has("demo") ? 15 : 120;
  const STORAGE_KEYS = {
    best: "tiny-office-break-best",
    sound: "tiny-office-break-sound",
  };

  const actions = {
    coffee: {
      points: 8,
      calm: 7,
      cooldown: 7200,
      x: 27,
      y: 74,
      tones: [392, 523],
      messages: [
        "One warm sip. The spreadsheet has lost some of its power.",
        "Coffee acquired. Urgency temporarily downgraded.",
        "The mug understands. No follow-up questions asked.",
      ],
    },
    plant: {
      points: 6,
      calm: 8,
      cooldown: 9000,
      x: 12,
      y: 23,
      tones: [349, 440],
      messages: [
        "The plant is thriving despite never joining a status meeting.",
        "A tiny leaf unfurls. Promotion criteria remain unclear.",
        "Plant watered. It continues to have excellent boundaries.",
      ],
    },
    cat: {
      points: 10,
      calm: 10,
      cooldown: 5200,
      x: 69,
      y: 64,
      tones: [440, 659],
      messages: [
        "Office cat approves your five-second performance review.",
        "Purr acknowledged. No action items were recorded.",
        "The cat has been promoted to Head of Emotional Support.",
      ],
    },
    papers: {
      points: 3,
      calm: 3,
      cooldown: 1300,
      x: 77,
      y: 79,
      tones: [330, 392],
      messages: [
        "One page sorted. Its final name is definitely FINAL_v7.",
        "Document moved somewhere that feels official.",
        "Paperwork reduced by a statistically satisfying amount.",
      ],
    },
    window: {
      points: 5,
      calm: 9,
      cooldown: 8500,
      x: 81,
      y: 31,
      tones: [294, 440],
      messages: [
        "Rain watched. Brain tabs quietly closing.",
        "The city keeps moving. You do not have to, for a moment.",
        "A perfectly productive ten seconds of looking outside.",
      ],
    },
  };

  const meetingPrompts = [
    ["Quick sync?", "Someone scheduled 45 minutes to ask one question."],
    ["Alignment check", "The agenda says: align on future alignment."],
    ["Tiny follow-up", "It arrives with twelve people and no context."],
    ["Mandatory fun", "A calendar invite would like to improve morale."],
  ];

  const elements = {
    timer: document.querySelector("#timer"),
    score: document.querySelector("#score"),
    calmValue: document.querySelector("#calmValue"),
    calmMeter: document.querySelector("#calmMeter"),
    bestScore: document.querySelector("#bestScore"),
    startScreen: document.querySelector("#startScreen"),
    startButton: document.querySelector("#startButton"),
    pausedScreen: document.querySelector("#pausedScreen"),
    pauseButton: document.querySelector("#pauseButton"),
    pauseLabel: document.querySelector("#pauseLabel"),
    resumeButton: document.querySelector("#resumeButton"),
    endScreen: document.querySelector("#endScreen"),
    endTitle: document.querySelector("#endTitle"),
    endCopy: document.querySelector("#endCopy"),
    finalScore: document.querySelector("#finalScore"),
    newBest: document.querySelector("#newBest"),
    replayButton: document.querySelector("#replayButton"),
    meetingCard: document.querySelector("#meetingCard"),
    meetingTitle: document.querySelector("#meetingTitle"),
    meetingCopy: document.querySelector("#meetingCopy"),
    emailButton: document.querySelector("#emailButton"),
    acceptButton: document.querySelector("#acceptButton"),
    scene: document.querySelector("#scene"),
    floatLayer: document.querySelector("#floatLayer"),
    message: document.querySelector("#message"),
    streak: document.querySelector("#streak"),
    soundToggle: document.querySelector("#soundToggle"),
    soundIcon: document.querySelector("#soundIcon"),
    soundLabel: document.querySelector("#soundLabel"),
    actionButtons: [...document.querySelectorAll("[data-action]")],
  };

  const state = {
    running: false,
    paused: false,
    score: 0,
    calm: 35,
    secondsLeft: SESSION_SECONDS,
    best: readNumber(STORAGE_KEYS.best),
    soundOn: readBoolean(STORAGE_KEYS.sound),
    paperProgress: 0,
    streak: 0,
    lastActionAt: 0,
    endAt: 0,
    pausedAt: 0,
    ticker: null,
    meetingTimer: null,
    cooldownTimers: new Map(),
    audioContext: null,
    rainSource: null,
  };

  function readNumber(key) {
    try {
      return Math.max(0, Number.parseInt(window.localStorage.getItem(key) || "0", 10) || 0);
    } catch {
      return 0;
    }
  }

  function readBoolean(key) {
    try {
      return window.localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // The game remains fully playable when private browsing blocks storage.
    }
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function render() {
    elements.timer.textContent = formatTime(state.secondsLeft);
    elements.score.textContent = String(state.score);
    elements.calmValue.textContent = `${state.calm}%`;
    elements.calmMeter.style.width = `${state.calm}%`;
    elements.bestScore.textContent = String(state.best);
    elements.scene.classList.toggle("deep-calm", state.calm >= 78);

    if (state.streak >= 2 && state.running) {
      elements.streak.hidden = false;
      elements.streak.textContent = `FLOW ×${state.streak}`;
    } else {
      elements.streak.hidden = true;
    }
  }

  function setMessage(message) {
    elements.message.textContent = message;
  }

  function setAllActionsEnabled(enabled) {
    elements.actionButtons.forEach((button) => {
      const coolingDown = state.cooldownTimers.has(button.dataset.action);
      button.disabled = !enabled || coolingDown;
    });
  }

  function clearCooldowns() {
    state.cooldownTimers.forEach((timer) => window.clearTimeout(timer));
    state.cooldownTimers.clear();
  }

  function beginCooldown(actionName, duration) {
    elements.actionButtons
      .filter((button) => button.dataset.action === actionName)
      .forEach((button) => {
        button.disabled = true;
      });

    const timer = window.setTimeout(() => {
      state.cooldownTimers.delete(actionName);
      elements.actionButtons
        .filter((button) => button.dataset.action === actionName)
        .forEach((button) => {
          button.disabled = !state.running || state.paused;
        });
    }, duration);

    state.cooldownTimers.set(actionName, timer);
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function startGame() {
    window.clearInterval(state.ticker);
    window.clearTimeout(state.meetingTimer);
    clearCooldowns();

    state.running = true;
    state.paused = false;
    state.score = 0;
    state.calm = 35;
    state.secondsLeft = SESSION_SECONDS;
    state.paperProgress = 0;
    state.streak = 0;
    state.lastActionAt = 0;
    state.endAt = performance.now() + SESSION_SECONDS * 1000;

    elements.startScreen.hidden = true;
    elements.endScreen.hidden = true;
    elements.pausedScreen.hidden = true;
    elements.meetingCard.hidden = true;
    elements.pauseButton.disabled = false;
    elements.pauseLabel.textContent = "Pause";
    elements.newBest.hidden = true;
    setAllActionsEnabled(true);
    setMessage("Take your time. The glowing objects are ready whenever you are.");
    render();

    state.ticker = window.setInterval(tick, 200);
    scheduleMeeting();
    if (state.soundOn) startRainSound();
    playTone([349, 523]);
  }

  function tick() {
    if (!state.running || state.paused) return;

    const remaining = Math.max(0, Math.ceil((state.endAt - performance.now()) / 1000));
    if (remaining !== state.secondsLeft) {
      state.secondsLeft = remaining;
      render();
    }

    if (remaining <= 0) endGame();
  }

  function togglePause(forcePause = null) {
    if (!state.running) return;

    const shouldPause = forcePause === null ? !state.paused : forcePause;
    if (shouldPause === state.paused) return;

    state.paused = shouldPause;
    if (state.paused) {
      state.pausedAt = performance.now();
      elements.pausedScreen.hidden = false;
      elements.pauseLabel.textContent = "Resume";
      setAllActionsEnabled(false);
      stopRainSound();
      setMessage("Paused. Nothing here will move until you come back.");
      elements.resumeButton.focus();
    } else {
      state.endAt += performance.now() - state.pausedAt;
      elements.pausedScreen.hidden = true;
      elements.pauseLabel.textContent = "Pause";
      setAllActionsEnabled(true);
      if (state.soundOn) startRainSound();
      setMessage("Welcome back. The rain kept your seat warm.");
    }
  }

  function performAction(actionName) {
    if (!state.running || state.paused || state.cooldownTimers.has(actionName)) return;

    const action = actions[actionName];
    if (!action) return;

    const now = performance.now();
    state.streak = now - state.lastActionAt <= 6500 ? Math.min(6, state.streak + 1) : 1;
    state.lastActionAt = now;

    let earned = action.points + Math.floor((state.streak - 1) / 2);
    let message = randomItem(action.messages);

    if (actionName === "papers") {
      state.paperProgress += 1;
      if (state.paperProgress === 3) {
        earned += 7;
        state.calm = Math.min(100, state.calm + 5);
        state.paperProgress = 0;
        message = "Inbox-sized victory: one paper stack officially under control. +7 bonus.";
        playTone([392, 523, 659]);
      } else {
        message = `${message} ${3 - state.paperProgress} page${3 - state.paperProgress === 1 ? "" : "s"} until the stack bonus.`;
      }
    }

    state.score += earned;
    state.calm = Math.min(100, state.calm + action.calm);
    beginCooldown(actionName, action.cooldown);
    showFloatingScore(earned, action.x, action.y);
    setMessage(message);

    if (actionName === "window") {
      elements.scene.classList.remove("rain-focus");
      window.requestAnimationFrame(() => elements.scene.classList.add("rain-focus"));
      window.setTimeout(() => elements.scene.classList.remove("rain-focus"), 3900);
    }

    playTone(action.tones);
    render();
  }

  function showFloatingScore(points, x, y) {
    const label = document.createElement("span");
    label.className = "float-score";
    label.textContent = `+${points}`;
    label.style.left = `${x + (Math.random() * 3 - 1.5)}%`;
    label.style.top = `${y}%`;
    elements.floatLayer.append(label);
    window.setTimeout(() => label.remove(), 1200);
  }

  function scheduleMeeting() {
    window.clearTimeout(state.meetingTimer);
    if (!state.running) return;

    const delay = 16500 + Math.random() * 11000;
    state.meetingTimer = window.setTimeout(() => {
      if (!state.running) return;
      if (state.paused || !elements.meetingCard.hidden) {
        scheduleMeeting();
        return;
      }
      showMeeting();
    }, delay);
  }

  function showMeeting() {
    const [title, copy] = randomItem(meetingPrompts);
    elements.meetingTitle.textContent = title;
    elements.meetingCopy.textContent = copy;
    elements.meetingCard.hidden = false;
    elements.emailButton.focus({ preventScroll: true });
    playTone([262, 247]);
  }

  function resolveMeeting(asEmail) {
    if (elements.meetingCard.hidden || !state.running) return;

    const earned = asEmail ? 12 : 4;
    state.score += earned;
    state.calm = Math.min(100, state.calm + (asEmail ? 8 : 3));
    elements.meetingCard.hidden = true;
    showFloatingScore(earned, 82, 19);
    setMessage(
      asEmail
        ? "Meeting converted into an email. Forty-five imaginary minutes reclaimed."
        : "Invite accepted peacefully. Emotional boundaries remain intact.",
    );
    playTone(asEmail ? [392, 523, 784] : [330, 392]);
    render();
    scheduleMeeting();
  }

  function rankFor(score) {
    if (score >= 125) {
      return {
        title: "Break-time Legend",
        copy: "The office is still standing, and somehow you are calmer than the office cat.",
        badge: "★",
      };
    }
    if (score >= 90) {
      return {
        title: "Quiet Achiever",
        copy: "You did almost nothing important, which was exactly the assignment.",
        badge: "✦",
      };
    }
    if (score >= 55) {
      return {
        title: "Desk Zen",
        copy: "You made a little room between yourself and the next deadline.",
        badge: "☾",
      };
    }
    return {
      title: "Breathing Room",
      copy: "A small pause still counts. The desk will be here when you are ready.",
      badge: "☕",
    };
  }

  function endGame() {
    if (!state.running) return;

    state.running = false;
    state.paused = false;
    state.secondsLeft = 0;
    window.clearInterval(state.ticker);
    window.clearTimeout(state.meetingTimer);
    clearCooldowns();
    stopRainSound();
    setAllActionsEnabled(false);
    elements.pauseButton.disabled = true;
    elements.meetingCard.hidden = true;

    const rank = rankFor(state.score);
    elements.endTitle.textContent = rank.title;
    elements.endCopy.textContent = rank.copy;
    elements.finalScore.textContent = String(state.score);
    document.querySelector("#endBadge").textContent = rank.badge;

    const isNewBest = state.score > state.best;
    if (isNewBest) {
      state.best = state.score;
      writeStorage(STORAGE_KEYS.best, state.best);
      elements.newBest.hidden = false;
    }

    render();
    elements.endScreen.hidden = false;
    setMessage("Break complete. No timesheets were harmed.");
    playTone([392, 523, 659, 784]);
    window.setTimeout(() => elements.replayButton.focus(), 120);
  }

  function ensureAudioContext() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.audioContext = new AudioContext();
    }
    if (state.audioContext.state === "suspended") state.audioContext.resume();
    return state.audioContext;
  }

  function playTone(frequencies) {
    if (!state.soundOn) return;
    const context = ensureAudioContext();
    if (!context) return;

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime + index * 0.055;
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.045, startsAt + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.24);
    });
  }

  function startRainSound() {
    if (!state.soundOn || state.rainSource) return;
    const context = ensureAudioContext();
    if (!context) return;

    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 820;
    gain.gain.value = 0.018;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    state.rainSource = source;
  }

  function stopRainSound() {
    if (!state.rainSource) return;
    try {
      state.rainSource.stop();
    } catch {
      // It may already have stopped during rapid toggling.
    }
    state.rainSource = null;
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    writeStorage(STORAGE_KEYS.sound, state.soundOn);
    elements.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
    elements.soundIcon.textContent = state.soundOn ? "♫" : "♪";
    elements.soundLabel.textContent = state.soundOn ? "Sound on" : "Sound off";

    if (state.soundOn) {
      ensureAudioContext();
      playTone([392, 523]);
      if (state.running && !state.paused) startRainSound();
    } else {
      stopRainSound();
    }
  }

  elements.actionButtons.forEach((button) => {
    button.addEventListener("click", () => performAction(button.dataset.action));
  });
  elements.startButton.addEventListener("click", startGame);
  elements.replayButton.addEventListener("click", startGame);
  elements.pauseButton.addEventListener("click", () => togglePause());
  elements.resumeButton.addEventListener("click", () => togglePause(false));
  elements.emailButton.addEventListener("click", () => resolveMeeting(true));
  elements.acceptButton.addEventListener("click", () => resolveMeeting(false));
  elements.soundToggle.addEventListener("click", toggleSound);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running && !state.paused) togglePause(true);
  });

  elements.timer.textContent = formatTime(SESSION_SECONDS);
  elements.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  elements.soundIcon.textContent = state.soundOn ? "♫" : "♪";
  elements.soundLabel.textContent = state.soundOn ? "Sound on" : "Sound off";
  render();
})();
