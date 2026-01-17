/* ---------------- UI ---------------- */
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");

const balanceEl = document.getElementById("balance");
const historyList = document.getElementById("history-list");

const spinBtn = document.getElementById("spin-btn");
const injectBtn = document.getElementById("inject-btn");
const slowmoBtn = document.getElementById("slowmo-btn");
const toggleNumbersBtn = document.getElementById("toggle-numbers-btn");

const numbersContainer = document.getElementById("numbers-container");
const numbersGrid = document.getElementById("numbers-grid");
const betAmountInput = document.getElementById("bet-amount");
const placeNumberBetBtn = document.getElementById("place-number-bet");

const colorBetAmountInput = document.getElementById("color-bet-amount");
const betRedBtn = document.getElementById("bet-red-btn");
const betBlackBtn = document.getElementById("bet-black-btn");
const betGreenBtn = document.getElementById("bet-green-btn");
const closeNumbersBtn = document.getElementById("close-numbers-btn");

const currentBetDisplay = document.getElementById("current-bet");

const canvas = document.getElementById("roulette");
const ctx = canvas.getContext("2d");
const resultDisplay = document.getElementById("result-display");

/* ---------------- State ---------------- */
let balance = 500;
balanceEl.textContent = balance;

let slowMo = false;

/* currentBet supports separate stakes for number and color */
let currentBet = {
  number: null,
  numberAmount: 0,
  color: null,
  colorAmount: 0
};

const W = canvas.width;
const H = canvas.height;
const CENTER = W/2;
const RADIUS = Math.min(W,H)/2 - 20;

/* roleta europeia */
const numbers = [
  {n:0,c:"green"},{n:32,c:"red"},{n:15,c:"black"},{n:19,c:"red"},
  {n:4,c:"black"},{n:21,c:"red"},{n:2,c:"black"},{n:25,c:"red"},
  {n:17,c:"black"},{n:34,c:"red"},{n:6,c:"black"},{n:27,c:"red"},
  {n:13,c:"black"},{n:36,c:"red"},{n:11,c:"black"},{n:30,c:"red"},
  {n:8,c:"black"},{n:23,c:"red"},{n:10,c:"black"},{n:5,c:"red"},
  {n:24,c:"black"},{n:16,c:"red"},{n:33,c:"black"},{n:1,c:"red"},
  {n:20,c:"black"},{n:14,c:"red"},{n:31,c:"black"},{n:9,c:"red"},
  {n:22,c:"black"},{n:18,c:"red"},{n:29,c:"black"},{n:7,c:"red"},
  {n:28,c:"black"},{n:12,c:"red"},{n:35,c:"black"},{n:3,c:"red"},
  {n:26,c:"black"}
];

/* rotation / animation state */
let wheelAngle = 0;
let ballAngle = 0;
let animating = false;

let animStart = 0;
let animDuration = 0;
let wheelStart = 0, wheelEnd = 0;
let ballStart = 0, ballEnd = 0;

let finishScheduled = false; // evita múltiplos finishes
let lastSelectedBtn = null;
let lastColorBtn = null;

/* ---------------- Helpers ---------------- */
function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }
function lerp(a,b,t){ return a + (b-a)*t; }
function mod(a,m){ return ((a % m) + m) % m; }

function showResultMessage(text, colorClass){
  resultDisplay.textContent = text;
  resultDisplay.className = "";
  resultDisplay.classList.remove('hidden');
  resultDisplay.style.background = colorClass === 'red' ? 'rgba(192,30,39,0.95)' :
                                      colorClass === 'black' ? 'rgba(10,10,10,0.9)' :
                                      'rgba(32,160,90,0.95)';
  // hide after 3s
  setTimeout(()=> resultDisplay.classList.add('hidden'), 3000);
}

/* ---------------- UI wiring ---------------- */
startBtn.onclick = () => {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
};

toggleNumbersBtn.onclick = () => {
  const isNowHidden = numbersContainer.classList.toggle('hidden');
  numbersContainer.setAttribute('aria-hidden', isNowHidden ? 'true' : 'false');
};

closeNumbersBtn.onclick = () => {
  numbersContainer.classList.add('hidden');
  numbersContainer.setAttribute('aria-hidden', 'true');
};

injectBtn.onclick = () => { balance += 500; balanceEl.textContent = balance; };
slowmoBtn.onclick = () => { slowMo = !slowMo; slowmoBtn.textContent = slowMo ? 'Câmara normal' : 'Câmara lenta'; };

/* ---------------- Numbers grid ---------------- */
function createNumbersGrid(){
  numbersGrid.innerHTML = '';
  numbers.forEach(num => {
    const btn = document.createElement('div');
    btn.className = 'number-btn ' + num.c;
    btn.textContent = num.n;

    btn.onclick = () => {
      // allow betting on 0 as number
      const amount = parseInt(betAmountInput.value, 10);
      if (isNaN(amount) || amount <= 0) { showResultMessage('Aposta inválida', 'black'); return; }
      if (amount > balance) { showResultMessage('Saldo insuficiente', 'black'); return; }

      currentBet.number = num.n;
      currentBet.numberAmount = amount;

      // visually highlight selected
      if (lastSelectedBtn) lastSelectedBtn.style.boxShadow = 'inset 0 -3px rgba(0,0,0,0.25)';
      btn.style.boxShadow = '0 0 10px 3px gold inset';
      lastSelectedBtn = btn;

      updateCurrentBetDisplay();
    };

    numbersGrid.appendChild(btn);
  });
}
createNumbersGrid();

/* ---------------- Color bets ---------------- */
function clearColorSelection(){
  if (lastColorBtn) { lastColorBtn.style.boxShadow = 'inset 0 -3px rgba(0,0,0,0.25)'; lastColorBtn = null; }
}

function placeColorBet(color){
  const amount = parseInt(colorBetAmountInput.value, 10);
  if (isNaN(amount) || amount <= 0) { showResultMessage('Aposta inválida', 'black'); return; }
  if (amount > balance) { showResultMessage('Saldo insuficiente', 'black'); return; }

  currentBet.color = color;
  currentBet.colorAmount = amount;

  // visually highlight
  clearColorSelection();
  const btn = color === 'red' ? betRedBtn : color === 'black' ? betBlackBtn : betGreenBtn;
  btn.style.boxShadow = '0 0 10px 3px gold inset';
  lastColorBtn = btn;

  updateCurrentBetDisplay();
}

betRedBtn.onclick = () => placeColorBet('red');
betBlackBtn.onclick = () => placeColorBet('black');
betGreenBtn.onclick = () => placeColorBet('green');

/* ---------------- place number bet button (guidance) ---------------- */
placeNumberBetBtn.onclick = () => {
  showResultMessage('Insere valor e clica no número que queres no grid', 'black');
};

/* ---------------- Current bet display ---------------- */
function updateCurrentBetDisplay(){
  const fragments = [];
  if (currentBet.number !== null){
    const span = document.createElement('span');
    span.className = 'bet-pill number';
    span.innerHTML = `<span class="chip" style="background:#fff"></span> Nº ${currentBet.number} (${currentBet.numberAmount}€)`;
    fragments.push(span.outerHTML);
  }
  if (currentBet.color !== null){
    const span = document.createElement('span');
    span.className = 'bet-pill ' + currentBet.color;
    span.innerHTML = `<span class="chip" style="background:${currentBet.color==='red'?'#fff':currentBet.color==='black'?'#fff':'#fff'}"></span> Cor ${currentBet.color.toUpperCase()} (${currentBet.colorAmount}€)`;
    fragments.push(span.outerHTML);
  }

  if (fragments.length === 0){
    currentBetDisplay.classList.add('hidden');
    currentBetDisplay.innerHTML = '';
  } else {
    currentBetDisplay.innerHTML = fragments.join('');
    currentBetDisplay.classList.remove('hidden');
  }
}

/* ---------------- Spin: pick random winner (independent) ---------------- */
spinBtn.onclick = () => {
  if (animating) return;

  // must have at least one stake
  if (!currentBet.number && !currentBet.color) { showResultMessage('Escolhe um número ou cor', 'black'); return; }

  // pick winner randomly
  const winnerIndex = Math.floor(Math.random() * numbers.length);
  scheduleAnimationForWinner(winnerIndex);
};

/* prepare animation to land on specific index (visual) */
function scheduleAnimationForWinner(winnerIndex){
  const slice = 2 * Math.PI / numbers.length;
  const wheelRot = 4 + Math.floor(Math.random() * 3);
  const ballExtra = 2 + Math.floor(Math.random() * 3);

  wheelStart = wheelAngle;
  ballStart = ballAngle;

  wheelEnd = wheelStart + wheelRot * 2 * Math.PI + (Math.random() * slice - slice/2);
  const targetCenter = winnerIndex * slice + slice/2;
  ballEnd = wheelEnd + targetCenter + ballExtra * 2 * Math.PI;

  animDuration = slowMo ? 8000 : 4500;
  animStart = performance.now();
  animating = true;
  finishScheduled = false;

  // ensure display updated
  updateCurrentBetDisplay();

  // store the winner index for later reference (not strictly needed)
  window.__roulette_winner_index = winnerIndex;
}

/* ---------------- Drawing helpers ---------------- */
function drawWheel(){
  const slice = 2 * Math.PI / numbers.length;
  for (let i = 0; i < numbers.length; i++){
    const num = numbers[i];
    const angle = wheelAngle + i * slice;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, angle, angle + slice);
    ctx.fillStyle = num.c === 'red' ? '#c0392b' : num.c === 'black' ? '#0b0b0b' : '#2ecc71';
    ctx.fill();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(angle + slice/2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(num.n, RADIUS - 12, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#8a8a8a';
  ctx.fill();

  // pointer
  ctx.beginPath();
  ctx.moveTo(CENTER + 6, 12);
  ctx.lineTo(CENTER - 6, 12);
  ctx.lineTo(CENTER, 30);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
}

let ballRadius = 210;
function drawBall(){
  const x = CENTER + Math.cos(ballAngle) * ballRadius;
  const y = CENTER + Math.sin(ballAngle) * ballRadius;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ---------------- Finish & payout - only once ---------------- */
function finishSpinAndPayout(){
  // guard
  if (!finishScheduled) finishScheduled = true;

  const slice = 2 * Math.PI / numbers.length;
  const rel = mod(ballAngle - wheelAngle, 2 * Math.PI);
  const idx = Math.floor(rel / slice) % numbers.length;
  const result = numbers[idx];

  // push history
  const div = document.createElement('div');
  div.className = 'history-item ' + result.c;
  div.textContent = result.n;
  historyList.prepend(div);
  if (historyList.children.length > 60) historyList.removeChild(historyList.lastChild);

  // calculate stake and payout
  const stake = (currentBet.numberAmount || 0) + (currentBet.colorAmount || 0);
  let payout = 0;

  if (currentBet.number !== null && currentBet.number === result.n){
    payout += (currentBet.numberAmount || 0) * 36;
  }

  if (currentBet.color !== null){
    if (currentBet.color === 'green'){
      // betting green equals betting zero (special payout)
      if (result.c === 'green') payout += (currentBet.colorAmount || 0) * 36;
    } else {
      if (currentBet.color === result.c) payout += (currentBet.colorAmount || 0) * 2;
    }
  }

  // update balance in one atomic op
  balance = balance - stake + payout;
  balanceEl.textContent = balance;

  if (payout > 0){
    showResultMessage(`ACERTOU: ${result.n} → +${payout}€`, result.c);
  } else {
    showResultMessage(`Saiu: ${result.n} — Perdeu ${stake}€`, result.c);
  }

  // reset visual highlights and state
  if (lastSelectedBtn){ lastSelectedBtn.style.boxShadow = 'inset 0 -3px rgba(0,0,0,0.25)'; lastSelectedBtn = null; }
  if (lastColorBtn){ lastColorBtn.style.boxShadow = 'inset 0 -3px rgba(0,0,0,0.25)'; lastColorBtn = null; }

  currentBet = { number: null, numberAmount: 0, color: null, colorAmount: 0 };
  currentBetDisplay.classList.add('hidden');
  animating = false;
  finishScheduled = false;
}

/* ---------------- Animation update ---------------- */
function updateAnimation(now){
  if (!animating) return;
  const elapsed = now - animStart;
  const tRaw = Math.min(1, elapsed / animDuration);
  const t = easeOutCubic(tRaw);

  wheelAngle = lerp(wheelStart, wheelEnd, t);
  ballAngle = lerp(ballStart, ballEnd, t);

  if (tRaw >= 1 && !finishScheduled){
    finishScheduled = true;
    setTimeout(() => finishSpinAndPayout(), 80);
  }
}

/* ---------------- Main render loop ---------------- */
function draw(){
  ctx.clearRect(0, 0, W, H);
  updateAnimation(performance.now());
  drawWheel();
  drawBall();
  requestAnimationFrame(draw);
}
draw();
