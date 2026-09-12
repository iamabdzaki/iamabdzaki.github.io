(() => {
  "use strict";

  const GAME_DURATION = 75;
  const OFFICE_START = 16 * 60 * 60 + 57 * 60 + 30;
  const OFFICE_SPAN = 150;
  const STORAGE = {
    best: "pretendToWorkBest",
    audio: "pretendToWorkAudio",
  };

  const activities = {
    cat: {
      rate: 3,
      suspicion: 0.11,
      title: "MeowTube — quarterly cat analysis",
      message: "Low risk. High-quality feline research.",
    },
    shop: {
      rate: 5.1,
      suspicion: 0.2,
      title: "Midnight Market — essential purchases",
      message: "Faster points. The ads have no respect for your career.",
    },
    nap: {
      rate: 7.8,
      suspicion: 0.34,
      title: "Power Nap.exe — definitely not sleeping",
      message: "Maximum relaxation. Remember: SPACE wakes you first.",
    },
  };

  const ui = {
    bestScore: document.querySelector("#bestScore"),
    soundToggle: document.querySelector("#soundToggle"),
    soundLabel: document.querySelector("#soundLabel"),
    officeClock: document.querySelector("#officeClock"),
    score: document.querySelector("#score"),
    suspicionValue: document.querySelector("#suspicionValue"),
    suspicionMeter: document.querySelector("#suspicionMeter"),
    extraTasks: document.querySelector("#extraTasks"),
    gameStage: document.querySelector("#gameStage"),
    visitor: document.querySelector("#visitor"),
    visitorImage: document.querySelector("#visitorImage"),
    visitorTag: document.querySelector("#visitorTag"),
    approachCue: document.querySelector("#approachCue"),
    approachText: document.querySelector("#approachText"),
    startScreen: document.querySelector("#startScreen"),
    startButton: document.querySelector("#startButton"),
    desktop: document.querySelector("#desktop"),
    windowTitle: document.querySelector("#windowTitle"),
    windowStatus: document.querySelector("#windowStatus"),
    breakView: document.querySelector("#breakView"),
    workView: document.querySelector("#workView"),
    activityScreens: [...document.querySelectorAll(".activity-screen")],
    shoppingPopup: document.querySelector("#shoppingPopup"),
    closePopup: document.querySelector("#closePopup"),
    spreadsheet: document.querySelector("#spreadsheet"),
    screenFlash: document.querySelector("#screenFlash"),
    endScreen: document.querySelector("#endScreen"),
    endingTitle: document.querySelector("#endingTitle"),
    endingCopy: document.querySelector("#endingCopy"),
    finalScore: document.querySelector("#finalScore"),
    caughtCount: document.querySelector("#caughtCount"),
    restartButton: document.querySelector("#restartButton"),
    activityButtons: [...document.querySelectorAll(".activity-button")],
    coverButton: document.querySelector("#coverButton"),
    coverLabel: document.querySelector("#coverLabel"),
    coverHint: document.querySelector("#coverHint"),
    messageBar: document.querySelector("#messageBar"),
    messageText: document.querySelector("#messageText"),
    modeChip: document.querySelector("#modeChip"),
  };

  const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  let bestScore = Math.max(0, Math.round(safeNumber(localStorage.getItem(STORAGE.best))));
  let audioEnabled = localStorage.getItem(STORAGE.audio) !== "off";
  let animationFrame = 0;
  let flashTimer = 0;

  const state = {
    running: false,
    mode: "break",
    activity: "cat",
    elapsed: 0,
    lastFrame: 0,
    score: 0,
    suspicion: 6,
    extraTasks: 0,
    caught: 0,
    napSleeping: false,
    popupOpen: false,
    nextPopupAt: 12,
    nextEventAt: 5.5,
    visitor: null,
    eventCount: 0,
  };

  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function setMessage(text, tone = "normal") {
    ui.messageText.textContent = text;
    ui.messageBar.classList.toggle("is-danger", tone === "danger");
  }

  function updateAudioButton() {
    ui.soundToggle.setAttribute("aria-pressed", String(audioEnabled));
    ui.soundLabel.textContent = audioEnabled ? "Lo-fi on" : "Lo-fi off";
  }

  function formatOfficeTime(elapsed) {
    const total = OFFICE_START + Math.min(OFFICE_SPAN, (elapsed / GAME_DURATION) * OFFICE_SPAN);
    const hours24 = Math.floor(total / 3600) % 24;
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = Math.floor(total % 60);
    const hours12 = hours24 % 12 || 12;
    const suffix = hours24 >= 12 ? "PM" : "AM";
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${suffix}`;
  }

  function updateStats() {
    const roundedSuspicion = Math.round(state.suspicion);
    ui.officeClock.textContent = formatOfficeTime(state.elapsed);
    ui.score.textContent = Math.max(0, Math.floor(state.score)).toLocaleString("en-US");
    ui.suspicionValue.textContent = `${roundedSuspicion}%`;
    ui.suspicionMeter.style.width = `${roundedSuspicion}%`;
    ui.extraTasks.textContent = String(state.extraTasks);

    if (roundedSuspicion >= 70) {
      ui.suspicionMeter.style.background =
        "repeating-linear-gradient(90deg, #ef806f 0 9px, #c95758 9px 12px)";
      ui.suspicionValue.style.color = "#ef806f";
    } else if (roundedSuspicion >= 38) {
      ui.suspicionMeter.style.background =
        "repeating-linear-gradient(90deg, #f5b95d 0 9px, #d89043 9px 12px)";
      ui.suspicionValue.style.color = "#f5b95d";
    } else {
      ui.suspicionMeter.style.background = "";
      ui.suspicionValue.style.color = "";
    }
  }

  function buildSpreadsheet() {
    const values = [
      "Q4", "$84K", "+12%", "OK", "31", "7.4", "YES", "88%",
      "OPS", "14", "$9K", "+4%", "26", "3.2", "OK", "71%",
      "ROI", "42", "$21K", "+9%", "18", "6.7", "YES", "94%",
      "KPI", "63", "$33K", "+7%", "39", "8.1", "OK", "82%",
      "FYI", "22", "$17K", "+5%", "24", "5.6", "YES", "76%",
    ];

    const fragment = document.createDocumentFragment();
    values.forEach((value, index) => {
      const cell = document.createElement("span");
      cell.className = "cell-value";
      cell.textContent = value;
      if (index % 8 === 0) cell.classList.add("is-label");
      fragment.appendChild(cell);
    });
    ui.spreadsheet.appendChild(fragment);
  }

  function setControlsEnabled(enabled) {
    ui.coverButton.disabled = !enabled;
    ui.activityButtons.forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function setActivity(activity, announce = true) {
    if (!activities[activity]) return;
    state.activity = activity;
    state.napSleeping = activity === "nap" && state.mode === "break";
    document.querySelector('[data-screen="nap"]').classList.remove("is-awake");
    closeShoppingPopup(false);

    ui.activityButtons.forEach((button) => {
      const active = button.dataset.activity === activity;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    ui.activityScreens.forEach((screen) => {
      screen.hidden = screen.dataset.screen !== activity;
    });

    if (state.mode === "break") {
      ui.windowTitle.textContent = activities[activity].title;
    }
    updateCoverButton();
    if (announce) setMessage(activities[activity].message);
  }

  function setMode(mode, announce = true) {
    state.mode = mode;
    const working = mode === "work";
    ui.workView.hidden = !working;
    ui.breakView.hidden = working;
    ui.windowStatus.textContent = working ? "WORK MODE" : "BREAK MODE";
    ui.windowStatus.style.color = working ? "#7fdbc5" : "";
    ui.modeChip.textContent = working ? "WORKING" : "RELAXING";
    ui.modeChip.classList.toggle("is-break", !working);
    ui.modeChip.classList.remove("is-danger");

    if (working) {
      ui.windowTitle.textContent = "Definitely_Working.xlsx";
      closeShoppingPopup(false);
      if (announce) setMessage("Spreadsheet deployed. Breathe normally and look expensive.");
      audioSystem.switchSound(true);
    } else {
      state.napSleeping = state.activity === "nap";
      document.querySelector('[data-screen="nap"]').classList.remove("is-awake");
      ui.windowTitle.textContent = activities[state.activity].title;
      if (announce) setMessage(activities[state.activity].message);
      audioSystem.switchSound(false);
    }
    updateCoverButton();
  }

  function updateCoverButton() {
    const working = state.mode === "work";
    ui.coverButton.classList.toggle("is-working", working);

    if (working) {
      ui.coverLabel.textContent = "RESUME BREAK";
      ui.coverHint.textContent = "The corridor looks clear";
    } else if (state.popupOpen) {
      ui.coverLabel.textContent = "CLOSE POP-UP!";
      ui.coverHint.textContent = "Then press again to look busy";
    } else if (state.activity === "nap" && state.napSleeping) {
      ui.coverLabel.textContent = "WAKE UP!";
      ui.coverHint.textContent = "One more press opens the sheet";
    } else {
      ui.coverLabel.textContent = "LOOK BUSY!";
      ui.coverHint.textContent = "Switch to spreadsheet";
    }
  }

  function toggleCover() {
    if (!state.running) return;

    if (state.mode === "work") {
      setMode("break");
      return;
    }

    if (state.popupOpen) {
      closeShoppingPopup();
      setMessage("Ad closed. Press SPACE again — the footsteps are not waiting!", "danger");
      audioSystem.popupSound();
      return;
    }

    if (state.activity === "nap" && state.napSleeping) {
      state.napSleeping = false;
      document.querySelector('[data-screen="nap"]').classList.add("is-awake");
      updateCoverButton();
      setMessage("Awake-ish. Press SPACE again to open the spreadsheet!", "danger");
      audioSystem.wakeSound();
      return;
    }

    setMode("work");
  }

  function showShoppingPopup() {
    if (!state.running || state.mode !== "break" || state.activity !== "shop") return;
    state.popupOpen = true;
    ui.shoppingPopup.hidden = false;
    updateCoverButton();
    setMessage("Pop-up ambush! It will eat your first SPACE press.", "danger");
    audioSystem.popupSound();
  }

  function closeShoppingPopup(announce = false) {
    if (!state.popupOpen && ui.shoppingPopup.hidden) return;
    state.popupOpen = false;
    ui.shoppingPopup.hidden = true;
    updateCoverButton();
    if (announce) setMessage("Pop-up closed. Your cart will never recover.");
  }

  function flash(type) {
    window.clearTimeout(flashTimer);
    ui.screenFlash.className = `screen-flash is-${type}`;
    flashTimer = window.setTimeout(() => {
      ui.screenFlash.className = "screen-flash";
    }, 560);
  }

  function beginVisitor() {
    if (!state.running || state.visitor) return;

    state.eventCount += 1;
    const type = state.eventCount === 1 || Math.random() < 0.68 ? "boss" : "coworker";
    const progress = state.elapsed / GAME_DURATION;
    const duration = randomBetween(4.1, 4.9) - progress * 0.85;

    state.visitor = {
      type,
      start: state.elapsed,
      duration,
      warned: false,
      caught: false,
      footstep: -1,
    };

    ui.visitor.className = `visitor is-${type}`;
    ui.visitorImage.src = type === "boss" ? "assets/boss.webp" : "assets/coworker.webp";
    ui.visitorTag.textContent = type === "boss" ? "BOSS" : "COWORKER";
    ui.visitor.style.setProperty("--visitor-duration", `${duration}s`);
    void ui.visitor.offsetWidth;
    ui.visitor.classList.add("is-crossing");

    ui.approachText.textContent = "FOOTSTEPS · RIGHT SIDE";
    ui.approachCue.classList.add("is-visible");
    setMessage("Footsteps from the right. Friend, foe, or someone with a calendar invite?", "danger");
    audioSystem.footstep();
  }

  function updateVisitor() {
    const event = state.visitor;
    if (!event) return;

    const ratio = (state.elapsed - event.start) / event.duration;
    const footstep = Math.floor(ratio * 5);
    if (footstep > event.footstep && footstep < 5) {
      event.footstep = footstep;
      audioSystem.footstep();
    }

    if (ratio >= 0.34 && !event.warned) {
      event.warned = true;
      if (event.type === "coworker") {
        ui.approachText.textContent = "FALSE ALARM";
        setMessage(
          state.mode === "work"
            ? "False alarm — just a coworker getting coffee. Your sacrifice was noted."
            : "Just a coworker. Continue your extremely important break.",
        );
      } else {
        ui.approachText.textContent = "BOSS APPROACHING";
        setMessage("Boss in the corridor. Get that spreadsheet open!", "danger");
      }
    }

    const inSight = ratio >= 0.57 && ratio <= 0.92;
    ui.coverButton.classList.toggle(
      "is-alert",
      event.type === "boss" && inSight && state.mode === "break",
    );

    if (event.type === "boss" && inSight && state.mode === "break" && !event.caught) {
      catchPlayer();
      event.caught = true;
    }

    if (ratio >= 1) finishVisitor();
  }

  function catchPlayer() {
    state.caught += 1;
    state.extraTasks += 1;
    state.suspicion = clamp(state.suspicion + 28, 0, 100);
    state.score = Math.max(0, state.score - 15);
    setMode("work", false);
    flash("caught");
    setMessage("CAUGHT. You just earned one urgent ‘quick task.’", "danger");
    ui.modeChip.textContent = "BUSTED";
    ui.modeChip.classList.add("is-danger");
    audioSystem.caughtSound();
    updateStats();
  }

  function finishVisitor() {
    const event = state.visitor;
    if (!event) return;

    if (event.type === "boss" && !event.caught) {
      state.score += 8;
      state.suspicion = clamp(state.suspicion - 7, 0, 100);
      flash("safe");
      setMessage("Clean cover. The boss detected several convincing numbers.");
      audioSystem.safeSound();
    } else if (event.type === "coworker") {
      setMessage("Coast clear. The coffee run continues.");
    }

    ui.visitor.classList.remove("is-crossing");
    ui.approachCue.classList.remove("is-visible");
    ui.coverButton.classList.remove("is-alert");
    state.visitor = null;
    const lateGame = state.elapsed > GAME_DURATION * 0.7;
    state.nextEventAt = state.elapsed + randomBetween(lateGame ? 4.8 : 6.2, lateGame ? 7.3 : 9.2);
  }

  function updatePopup() {
    if (
      state.running &&
      state.mode === "break" &&
      state.activity === "shop" &&
      !state.popupOpen &&
      state.elapsed >= state.nextPopupAt
    ) {
      showShoppingPopup();
      state.nextPopupAt = state.elapsed + randomBetween(9, 14);
    }
  }

  function chooseEnding() {
    if (state.caught >= 3 || state.suspicion >= 95) {
      return {
        title: "Overtime.",
        copy: "The lights are still cozy. Your calendar is not.",
      };
    }
    if (state.caught === 2) {
      return {
        title: "One Quick Meeting Before You Go",
        copy: "A phrase no employee has ever trusted.",
      };
    }
    if (state.caught === 1) {
      return {
        title: "Looks Busy Enough",
        copy: "One close call, one extra task, zero lessons learned.",
      };
    }
    if (state.score >= 360) {
      return {
        title: "Corporate Ninja",
        copy: "Maximum relaxation. Minimum observable evidence.",
      };
    }
    return {
      title: "Employee of the Month, Somehow",
      copy: "You worked so convincingly that you forgot to take a break.",
    };
  }

  function endGame() {
    if (!state.running) return;
    state.running = false;
    window.cancelAnimationFrame(animationFrame);
    state.elapsed = GAME_DURATION;
    ui.officeClock.textContent = "05:00:00 PM";
    ui.visitor.classList.remove("is-crossing");
    ui.approachCue.classList.remove("is-visible");
    ui.coverButton.classList.remove("is-alert");
    state.visitor = null;
    closeShoppingPopup(false);
    setControlsEnabled(false);

    const final = Math.max(0, Math.floor(state.score));
    const ending = chooseEnding();
    ui.endingTitle.textContent = ending.title;
    ui.endingCopy.textContent = ending.copy;
    ui.finalScore.textContent = final.toLocaleString("en-US");
    ui.caughtCount.textContent = `${state.caught}×`;
    ui.desktop.hidden = true;
    ui.endScreen.hidden = false;
    ui.modeChip.textContent = "CLOCKED OUT";
    ui.modeChip.className = "mode-chip";
    setMessage("Five o’clock. Close the laptop before somebody says ‘real quick.’");

    if (final > bestScore) {
      bestScore = final;
      localStorage.setItem(STORAGE.best, String(bestScore));
      ui.bestScore.textContent = bestScore.toLocaleString("en-US");
    }
    audioSystem.endSound();
  }

  function gameLoop(timestamp) {
    if (!state.running) return;
    const delta = Math.min(0.05, (timestamp - state.lastFrame) / 1000 || 0);
    state.lastFrame = timestamp;
    state.elapsed += delta;

    if (state.mode === "break") {
      const activity = activities[state.activity];
      state.score += activity.rate * delta;
      state.suspicion = clamp(state.suspicion + activity.suspicion * delta, 0, 100);
    } else {
      state.suspicion = clamp(state.suspicion - 0.54 * delta, 0, 100);
    }

    if (!state.visitor && state.elapsed >= state.nextEventAt) beginVisitor();
    updateVisitor();
    updatePopup();
    updateStats();

    if (state.elapsed >= GAME_DURATION) {
      endGame();
      return;
    }
    animationFrame = window.requestAnimationFrame(gameLoop);
  }

  function resetState() {
    state.running = true;
    state.mode = "break";
    state.activity = "cat";
    state.elapsed = 0;
    state.lastFrame = performance.now();
    state.score = 0;
    state.suspicion = 6;
    state.extraTasks = 0;
    state.caught = 0;
    state.napSleeping = false;
    state.popupOpen = false;
    state.nextPopupAt = randomBetween(9, 13);
    state.nextEventAt = randomBetween(5.2, 6.5);
    state.visitor = null;
    state.eventCount = 0;
  }

  function startGame() {
    window.cancelAnimationFrame(animationFrame);
    resetState();
    ui.startScreen.hidden = true;
    ui.endScreen.hidden = true;
    ui.desktop.hidden = false;
    ui.visitor.className = "visitor";
    ui.approachCue.classList.remove("is-visible");
    setControlsEnabled(true);
    setActivity("cat", false);
    setMode("break", false);
    setMessage("Coast looks clear. Pick a distraction and keep one hand near SPACE.");
    updateStats();
    if (audioEnabled) audioSystem.start();
    animationFrame = window.requestAnimationFrame(gameLoop);
  }

  const audioSystem = (() => {
    let context = null;
    let master = null;
    let musicTimer = 0;
    let vinyl = null;
    let nextStepTime = 0;
    let step = 0;
    const bpm = 78;
    const eighth = 60 / bpm / 2;
    const progression = [
      [130.81, 164.81, 196.0, 246.94],
      [110.0, 130.81, 164.81, 196.0],
      [146.83, 174.61, 220.0, 261.63],
      [98.0, 123.47, 146.83, 174.61],
    ];

    function ready() {
      return context && master && context.state !== "closed";
    }

    function noiseBuffer(duration = 0.3) {
      const length = Math.max(1, Math.floor(context.sampleRate * duration));
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function envelope(gainNode, time, peak, duration, attack = 0.015) {
      gainNode.gain.cancelScheduledValues(time);
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    }

    function chord(frequencies, time) {
      const bus = context.createGain();
      const filter = context.createBiquadFilter();
      bus.gain.value = 0.46;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1450, time);
      filter.Q.value = 0.55;
      bus.connect(filter).connect(master);

      frequencies.forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = index % 2 ? "sine" : "triangle";
        osc.frequency.value = frequency;
        osc.detune.value = index % 2 ? 3 : -3;
        envelope(gain, time, 0.025, 1.35, 0.025);
        osc.connect(gain).connect(bus);
        osc.start(time);
        osc.stop(time + 1.42);
      });
    }

    function bass(frequency, time) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency / 2, time);
      filter.type = "lowpass";
      filter.frequency.value = 310;
      envelope(gain, time, 0.075, 0.46, 0.012);
      osc.connect(filter).connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + 0.5);
    }

    function kick(time) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(118, time);
      osc.frequency.exponentialRampToValueAtTime(44, time + 0.12);
      envelope(gain, time, 0.12, 0.18, 0.005);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + 0.2);
    }

    function noiseHit(time, duration, peak, cutoff, type = "highpass") {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = noiseBuffer(duration);
      filter.type = type;
      filter.frequency.value = cutoff;
      envelope(gain, time, peak, duration, 0.004);
      source.connect(filter).connect(gain).connect(master);
      source.start(time);
      source.stop(time + duration + 0.02);
    }

    function scheduleStep(time) {
      const barStep = step % 32;
      const chordIndex = Math.floor(barStep / 8) % progression.length;

      if (barStep % 8 === 0) {
        chord(progression[chordIndex], time);
        bass(progression[chordIndex][0], time);
      }
      if (barStep % 4 === 0) kick(time);
      if (barStep % 8 === 4) noiseHit(time, 0.16, 0.026, 900, "bandpass");
      if (barStep % 2 === 0) noiseHit(time, 0.045, 0.009, 4200);
      step += 1;
    }

    function scheduler() {
      if (!ready()) return;
      while (nextStepTime < context.currentTime + 0.18) {
        scheduleStep(nextStepTime);
        nextStepTime += eighth;
      }
    }

    function startVinyl() {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = noiseBuffer(2.5);
      source.loop = true;
      filter.type = "bandpass";
      filter.frequency.value = 1250;
      filter.Q.value = 0.28;
      gain.gain.value = 0.008;
      source.connect(filter).connect(gain).connect(master);
      source.start();
      vinyl = source;
    }

    function start() {
      if (!audioEnabled) return;
      if (ready()) {
        context.resume();
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        audioEnabled = false;
        updateAudioButton();
        return;
      }
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0.52;
      master.connect(context.destination);
      nextStepTime = context.currentTime + 0.06;
      step = 0;
      startVinyl();
      scheduler();
      musicTimer = window.setInterval(scheduler, 80);
    }

    function stop() {
      window.clearInterval(musicTimer);
      musicTimer = 0;
      if (vinyl) {
        try { vinyl.stop(); } catch (_) { /* already stopped */ }
        vinyl = null;
      }
      if (context && context.state !== "closed") context.close();
      context = null;
      master = null;
    }

    function tone(frequency, duration, volume, type = "sine", delay = 0) {
      if (!audioEnabled) return;
      if (!ready()) start();
      if (!ready()) return;
      const time = context.currentTime + delay;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      envelope(gain, time, volume, duration, 0.008);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    }

    return {
      start,
      stop,
      switchSound(toWork) {
        tone(toWork ? 520 : 390, 0.11, 0.04, "square");
        tone(toWork ? 690 : 520, 0.12, 0.03, "square", 0.07);
      },
      footstep() {
        if (!audioEnabled) return;
        if (!ready()) start();
        if (!ready()) return;
        const time = context.currentTime;
        kick(time);
        tone(72, 0.09, 0.025, "triangle", 0.03);
      },
      popupSound() {
        tone(880, 0.08, 0.028, "square");
        tone(660, 0.09, 0.025, "square", 0.08);
      },
      wakeSound() {
        tone(240, 0.1, 0.04, "sawtooth");
        tone(360, 0.12, 0.035, "sawtooth", 0.1);
      },
      caughtSound() {
        tone(180, 0.28, 0.08, "sawtooth");
        tone(120, 0.36, 0.07, "sawtooth", 0.13);
      },
      safeSound() {
        tone(523.25, 0.18, 0.04, "sine");
        tone(659.25, 0.2, 0.035, "sine", 0.11);
        tone(783.99, 0.25, 0.03, "sine", 0.21);
      },
      endSound() {
        tone(392, 0.25, 0.04, "sine");
        tone(523.25, 0.3, 0.035, "sine", 0.15);
        tone(659.25, 0.45, 0.03, "sine", 0.3);
      },
    };
  })();

  ui.activityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.running) setActivity(button.dataset.activity);
    });
  });

  ui.coverButton.addEventListener("click", toggleCover);
  ui.startButton.addEventListener("click", startGame);
  ui.restartButton.addEventListener("click", startGame);
  ui.closePopup.addEventListener("click", () => closeShoppingPopup(true));

  ui.soundToggle.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    localStorage.setItem(STORAGE.audio, audioEnabled ? "on" : "off");
    updateAudioButton();
    if (audioEnabled) {
      if (state.running) {
        audioSystem.start();
        audioSystem.safeSound();
      }
    } else {
      audioSystem.stop();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) toggleCover();
      return;
    }
    if (!state.running || event.repeat) return;
    if (event.code === "Digit1" || event.code === "Numpad1") setActivity("cat");
    if (event.code === "Digit2" || event.code === "Numpad2") setActivity("shop");
    if (event.code === "Digit3" || event.code === "Numpad3") setActivity("nap");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !state.running) return;
    state.lastFrame = performance.now();
  });

  window.addEventListener("pagehide", () => audioSystem.stop());

  buildSpreadsheet();
  ui.bestScore.textContent = bestScore.toLocaleString("en-US");
  updateAudioButton();
  setControlsEnabled(false);
  updateStats();
})();
