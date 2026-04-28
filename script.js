'use strict';

const CONFIG = {
    BASE_GUNMAN_TIME: 1.2,
    TIME_DECREMENT: 0.2,
    REWARD_STEP: 100,
    MAX_LEVELS: 5
};

let state = {
    level: 1,
    charIndex: 0,
    score: 0,
    isGameOver: false,
    duelStarted: false,
    playerShot: false,
    gunmanSpeed: CONFIG.BASE_GUNMAN_TIME,
    startTime: 0,
    gunmanTimeout: null
};

const sounds = {
    intro: new Audio('help-files/sfx/intro.m4a'),
    wait: new Audio('help-files/sfx/wait.m4a'),
    fire: new Audio('help-files/sfx/fire.m4a'),
    shot: new Audio('help-files/sfx/shot.m4a'),
    win: new Audio('help-files/sfx/win.m4a'),
    death: new Audio('help-files/sfx/death.m4a'),
    foul: new Audio('help-files/sfx/foul.m4a')
};

const el = {
    menu: document.querySelector('.game-menu'),
    wrapper: document.querySelector('.wrapper'),
    screen: document.querySelector('.game-screen'),
    gunman: document.querySelector('.gunman'),
    score: document.querySelector('.score-panel__score_num'),
    level: document.querySelector('.score-panel__level'),
    timerPlayer: document.querySelector('.time-panel__you'),
    timerGunman: document.querySelector('.time-panel__gunman'),
    msgContainer: document.querySelector('.message'),
    btnStart: document.querySelector('.button-start-game'),
    btnRestart: document.querySelector('.button-restart'),
    btnNext: document.querySelector('.button-next-level'),
    winScreen: document.querySelector('.win-screen'),
    finalScore: document.getElementById('final-score')
};

function init() {
    el.btnStart.addEventListener('click', startGame);
    el.btnRestart.addEventListener('click', restartGame);
    el.btnNext.addEventListener('click', nextLevel);
    el.gunman.addEventListener('mousedown', playerShootsGunman);

    el.wrapper.style.display = 'none';
    el.winScreen.style.display = 'none';
    el.btnRestart.style.display = 'none';
    el.btnNext.style.display = 'none';
}

function startGame() {
    el.menu.style.display = 'none';
    el.wrapper.style.display = 'block';
    state.level = 1;
    state.charIndex = 0;
    state.score = 0;
    state.gunmanSpeed = CONFIG.BASE_GUNMAN_TIME;
    startRound();
}

function startRound() {
    state.isGameOver = false;
    state.duelStarted = false;
    state.playerShot = false;
    resetVisuals();

    const chars = ['char-1', 'char-2', 'char-3', 'char-4', 'char-5'];
    const activeChar = chars[state.charIndex];

    if (state.charIndex === 0) {
        sounds.intro.play();
        el.gunman.className = `gunman ${activeChar} is-walking`;

        setTimeout(() => {
            el.gunman.classList.add('move-to-center');
        }, 100);

        setTimeout(() => {
            if (state.isGameOver) return;
            el.gunman.classList.remove('is-walking');
            el.gunman.classList.add('is-standing');
            prepareForDuel(activeChar);
        }, 3100);
    } else {
        el.gunman.style.transition = 'none';
        el.gunman.className = `gunman ${activeChar} move-to-center is-standing`;

        void el.gunman.offsetWidth;
        el.gunman.style.transition = '';

        prepareForDuel(activeChar);
    }
}


function prepareForDuel(charClass) {
    sounds.wait.play();
    const delay = Math.random() * 2000 + 1500;

    setTimeout(() => {
        if (state.isGameOver || state.playerShot) return;
        state.duelStarted = true;
        state.startTime = Date.now();
        el.gunman.className = `gunman ${charClass} move-to-center is-ready`;
        el.msgContainer.className = 'message message--fire';
        sounds.fire.play();
        state.gunmanTimeout = setTimeout(() => gunmanShootsPlayer(charClass), state.gunmanSpeed * 1000);
    }, delay);
}

function playerShootsGunman(e) {
    if(e) e.preventDefault();
    if (!state.duelStarted || state.playerShot || state.isGameOver) {
        if (!state.duelStarted && !state.isGameOver) {
            sounds.foul.play();
            showMessage('FOUL!', 'message--dead');
            state.isGameOver = true;
            state.charIndex = 0;
            state.level = 1;
            el.btnRestart.style.display = 'block';
        }
        return;
    }
    state.playerShot = true;
    clearTimeout(state.gunmanTimeout);
    const reactionTime = (Date.now() - state.startTime) / 1000;
    el.timerPlayer.innerText = reactionTime.toFixed(2);
    el.timerGunman.innerText = state.gunmanSpeed.toFixed(2);
    sounds.shot.play();
    const charClass = Array.from(el.gunman.classList).find(c => c.startsWith('char-'));
    el.gunman.className = `gunman ${charClass} move-to-center is-dead`;
    showMessage('YOU WIN!', 'message--win');
    state.score += (state.level * CONFIG.REWARD_STEP);
    updateUI();
    setTimeout(() => sounds.win.play(), 600);
    if (state.level >= CONFIG.MAX_LEVELS) {
        setTimeout(showFinalWin, 2500);
    } else {
        el.btnNext.style.display = 'block';
    }
}

function gunmanShootsPlayer(charClass) {
    if (state.playerShot) return;
    state.isGameOver = true;
    state.charIndex = 0;
    state.level = 1;
    sounds.shot.play();
    el.screen.classList.add('game-screen--death');
    el.gunman.className = `gunman ${charClass} move-to-center is-shooting`;
    showMessage('YOU LOSE!', 'message--dead');
    el.timerGunman.innerText = state.gunmanSpeed.toFixed(2);
    el.timerPlayer.innerText = "LOST";
    setTimeout(() => sounds.death.play(), 500);
    el.btnRestart.style.display = 'block';
}

function nextLevel() {
    state.level++;
    state.charIndex = (state.charIndex + 1) % 5;
    state.gunmanSpeed = Math.max(0.3, state.gunmanSpeed - CONFIG.TIME_DECREMENT);
    el.btnNext.style.display = 'none';
    startRound();
}

function restartGame() {
    el.btnRestart.style.display = 'none';
    el.screen.classList.remove('game-screen--death');
    startGame();
}

function updateUI() {
    el.score.innerText = state.score;
    el.level.innerText = `Level ${state.level}`;
}

function resetVisuals() {
    el.msgContainer.className = 'message';
    el.msgContainer.innerText = '';
    el.timerPlayer.innerText = '0.00';
    el.timerGunman.innerText = '0.00';

    el.gunman.style.transition = 'none';
    el.gunman.className = 'gunman';
    void el.gunman.offsetWidth;
    el.gunman.style.transition = '';

    el.btnRestart.style.display = 'none';
    el.btnNext.style.display = 'none';
    updateUI();
}

function showMessage(text, typeClass) {
    el.msgContainer.className = `message ${typeClass}`;
    el.msgContainer.innerText = text;
}

function showFinalWin() {
    el.wrapper.style.display = 'none';
    el.winScreen.style.display = 'block';
    el.finalScore.innerText = state.score;
}

init();
const scope = document.querySelector('.aim-scope');

el.screen.addEventListener('mousemove', (e) => {
    scope.style.display = 'block';

    const rect = el.screen.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    scope.style.left = `${x}px`;
    scope.style.top = `${y}px`;
});

el.screen.addEventListener('mouseleave', () => {
    scope.style.display = 'none';
});