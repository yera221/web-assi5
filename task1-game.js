const MAX_HP = 100;
const MAX_TURNS = 10;

const JAB_MIN = 8;
const JAB_MAX = 12;

const KICK_MIN = 15;
const KICK_MAX = 25;
const KICK_CHANCE = 50;

const CLINCH_MIN = 4;
const CLINCH_MAX = 7;
const CLINCH_HEAL = 5;

const HEAL_AMOUNT = 15;
const MAX_HEALS = 3;

const ENEMY_MIN = 5;
const ENEMY_MAX = 14;
const CRIT_CHANCE = 10;
const CRIT_MULTIPLIER = 2;

const GUARD_FACTOR = 0.5;
const LOW_HP_PERCENT = 0.3;
const LOG_SIZE = 5;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
  return randInt(1, 100) <= percent;
}

let state = newState();

function newState() {
  return {
    playerHp: MAX_HP,
    enemyHp: MAX_HP,
    healsLeft: MAX_HEALS,
    guarding: false,
    lastMove: "",
    turns: 0,
    over: false,
    outcome: "",
    resultText: "",
    log: []
  };
}

const playerHpBar = document.getElementById("player-hp");
const enemyHpBar = document.getElementById("enemy-hp");
const playerHpText = document.getElementById("player-hp-text");
const enemyHpText = document.getElementById("enemy-hp-text");
const info = document.getElementById("info");
const message = document.getElementById("message");
const controls = document.getElementById("controls");
const result = document.getElementById("result");
const restartBtn = document.getElementById("restart");
const logList = document.getElementById("log");

function addLog(text) {
  state.log.push(text);
  if (state.log.length > LOG_SIZE) {
    state.log.shift();
  }
}

function showMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function playerTurn(move) {
  if (state.over) {
    return;
  }

  if (move === "heal" && (state.healsLeft === 0 || state.playerHp === MAX_HP)) {
    if (state.healsLeft === 0) {
      showMessage("No water breaks left.", true);
    } else {
      showMessage("You are at full HP.", true);
    }
    return;
  }
  if (move === "guard" && state.lastMove === "guard") {
    showMessage("You cannot guard twice in a row.", true);
    return;
  }

  showMessage("", false);
  state.lastMove = move;

  if (move === "jab") {
    const dmg = randInt(JAB_MIN, JAB_MAX);
    state.enemyHp -= dmg;
    addLog("You land a jab for " + dmg + ".");
  } else if (move === "kick") {
    if (chance(KICK_CHANCE)) {
      const dmg = randInt(KICK_MIN, KICK_MAX);
      state.enemyHp -= dmg;
      addLog("Power kick lands for " + dmg + "!");
    } else {
      addLog("You miss the power kick.");
    }
  } else if (move === "clinch") {
    const dmg = randInt(CLINCH_MIN, CLINCH_MAX);
    state.enemyHp -= dmg;
    state.playerHp = Math.min(MAX_HP, state.playerHp + CLINCH_HEAL);
    addLog("Clinch: " + dmg + " damage, you recover " + CLINCH_HEAL + " HP.");
  } else if (move === "guard") {
    state.guarding = true;
    addLog("You raise your guard.");
  } else if (move === "heal") {
    state.playerHp = Math.min(MAX_HP, state.playerHp + HEAL_AMOUNT);
    state.healsLeft -= 1;
    addLog("Water break: +" + HEAL_AMOUNT + " HP.");
  }

  if (state.enemyHp <= 0) {
    state.enemyHp = 0;
    finish("win", "Knockout! You win.");
    render();
    return;
  }

  enemyTurn();
  state.turns += 1;

  if (state.playerHp <= 0) {
    state.playerHp = 0;
    finish("loss", "You are knocked out. You lose.");
  } else if (state.turns === MAX_TURNS) {
    if (state.playerHp > state.enemyHp) {
      finish("win", "Judges' decision: you win on points.");
    } else if (state.playerHp < state.enemyHp) {
      finish("loss", "Judges' decision: the rival wins on points.");
    } else {
      finish("draw", "Judges' decision: draw.");
    }
  }

  render();
}

function enemyTurn() {
  let dmg = randInt(ENEMY_MIN, ENEMY_MAX);
  let text = "Rival hits you";

  if (chance(CRIT_CHANCE)) {
    dmg = dmg * CRIT_MULTIPLIER;
    text = "CRITICAL! Rival hits you";
  }
  if (state.guarding === true) {
    dmg = Math.floor(dmg * GUARD_FACTOR);
    state.guarding = false;
    text = text + " (guarded)";
  }

  state.playerHp -= dmg;
  addLog(text + " for " + dmg + ".");
}

function finish(outcome, text) {
  state.over = true;
  state.outcome = outcome;
  state.resultText = text;
  addLog(text);
}

function render() {
  playerHpBar.max = MAX_HP;
  enemyHpBar.max = MAX_HP;
  playerHpBar.value = state.playerHp;
  enemyHpBar.value = state.enemyHp;
  playerHpText.textContent = state.playerHp + "/" + MAX_HP;
  enemyHpText.textContent = state.enemyHp + "/" + MAX_HP;

  playerHpBar.classList.toggle("low", state.playerHp <= MAX_HP * LOW_HP_PERCENT);
  enemyHpBar.classList.toggle("low", state.enemyHp <= MAX_HP * LOW_HP_PERCENT);

  info.textContent = "Turn " + state.turns + " of " + MAX_TURNS +
    " | Water breaks left: " + state.healsLeft;

  const buttons = controls.querySelectorAll("button");
  for (const btn of buttons) {
    btn.disabled = state.over;
  }

  result.hidden = !state.over;
  result.textContent = state.resultText;
  result.classList.remove("win", "loss", "draw");
  if (state.over) {
    result.classList.add(state.outcome);
  }

  logList.textContent = "";
  for (let i = state.log.length - 1; i >= 0; i--) {
    const li = document.createElement("li");
    li.textContent = state.log[i];
    logList.appendChild(li);
  }
}

controls.addEventListener("click", function (event) {
  const btn = event.target.closest("button[data-move]");
  if (btn === null) {
    return;
  }
  playerTurn(btn.dataset.move);
});

restartBtn.addEventListener("click", function () {
  state = newState();
  showMessage("", false);
  render();
});

render();
