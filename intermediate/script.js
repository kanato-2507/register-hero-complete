const GAME_DURATION_PER_QUESTION = 20; // Longer time for building
const POINTS_PER_QUESTION = 100;
const SPEECH_RATE = 1.0;

// Quiz Data - Station Bookstore (Intermediate)
// Quiz Data - Use Shared Master List
const QUESTIONS = MASTER_QUESTIONS;

// Game State
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let currentWords = []; // Array of word objects {id, text, selected}
let selectedWordIds = []; // Order of Ids in the answer box

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const timerFill = document.getElementById('timer-fill');
const scoreDisplay = document.getElementById('score-display');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const poolContainer = document.getElementById('pool-container');
const answerContainer = document.getElementById('answer-container');
const checkBtn = document.getElementById('check-btn');
const clearBtn = document.getElementById('clear-btn');
const nextBtn = document.getElementById('next-btn');
const feedbackMsg = document.getElementById('feedback-msg');
const replayBtn = document.getElementById('replay-btn');
const finalScoreDisplay = document.getElementById('final-score-display');
const rankDisplay = document.getElementById('rank-display');

// Encouragement Messages
const ENCOURAGEMENT = [
    "完璧！🎉",
    "素晴らしい！⭐",
    "すごい！🌟",
    "よくできました！💯",
    "最高！✨",
    "その調子！🔥",
    "天才！💎",
    "パーフェクト！🏆"
];

// Audio Manager handles synthesis
// const synth... - REMOVED
// let currentUtterance... - REMOVED

// Function to delegate to AudioManager
function speak(text, rate = SPEECH_RATE) {
    AudioManager.speechRate = rate;
    AudioManager.speak(text);
}

// Safely assign onvoiceschanged - Handled by AudioManager internally (mostly)
// or we can remove this block if AudioManager doesn't expose it.
// AudioManager auto-inits.

// Init
function initGame() {
    // Unlock Audio Context immediately on user interaction
    // Unlock Audio Context immediately on user interaction
    AudioManager.unlock();

    score = 0;
    currentQuestionIndex = 0;
    // Select 10 random questions from the pool
    // Select 10 random questions from the pool
    // Fisher-Yates Shuffle for better randomness
    const shuffled = [...QUESTIONS];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Deep clone to track isRetry independently
    currentQuestions = shuffled.slice(0, 10).map(q => ({ ...q, isRetry: false }));
    updateScoreUI();

    // Check Audio Support and Warn if missing
    if (!window.speechSynthesis) {
        alert("Audio is not supported in this browser.\nPlease try Chrome or Safari for full experience.");
    }

    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    resultScreen.classList.remove('active');
    resultScreen.classList.add('hidden');

    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');

    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }

    const qData = currentQuestions[currentQuestionIndex];
    questionText.textContent = qData.text;

    // Update question counter
    // Retry Mode Detection
    const initialTotal = 10;
    const isRetry = currentQuestionIndex >= initialTotal;
    const appContainer = document.querySelector('.app-container');

    if (isRetry) {
        appContainer.classList.add('retry-mode');
        // Counter can just show "Retry Phase" or just keep the number
        // CSS adds "RETRY" prefix so we just keep "11/10" or similar
        questionCounter.textContent = `${currentQuestionIndex + 1}/${initialTotal}`;
    } else {
        appContainer.classList.remove('retry-mode');
        questionCounter.textContent = `${currentQuestionIndex + 1}/${initialTotal}`;
    }

    // Reset State
    selectedWordIds = [];
    nextBtn.classList.add('hidden');
    checkBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden'); // Show reset
    checkBtn.disabled = true;
    feedbackMsg.classList.add('hidden');
    feedbackMsg.className = 'feedback hidden'; // reset error class

    // Prepare Words
    // Remove punctuation for easier matching, or keep it?
    // Let's split by space.
    const rawWords = qData.sentence.split(' ');
    currentWords = rawWords.map((w, i) => ({
        id: i,
        text: w,
        selected: false
    }));

    // Shuffle words for pool
    // Need a separate shuffled array for display, but link back to IDs?
    renderUI();

    timeLeft = GAME_DURATION_PER_QUESTION;
    updateTimerUI();
    startTimer();

    // Speak prompt
    // On mobile, setTimeout might lose the 'user gesture' token, 
    // but since we primed it in initGame, it might be okay.
    // Reducing delay to ensure it feels responsive.
    // Reducing delay to ensure it feels responsive.
    // On mobile, reducing delay helps maintain "user gesture" context
    setTimeout(() => speak(qData.audio), 100);
}

function renderUI() {
    // 1. Render Pool (Show only unselected words)
    poolContainer.innerHTML = '';

    // We want the pool order to remain somewhat consistent or shuffled? 
    // Capturing initial shuffle order would be better.
    // For now, let's just filter unselected items.

    const unselectedWords = currentWords.filter(w => !w.selected);
    // Shuffle only on first load? Nay, shuffle always looks cleaner.
    // Ideally we shuffle ONCE per question.

    // Quick fix: Just show unselected words shuffled or in consistent ID order?
    // Let's Shuffle the DISPLAY list.
    const displayPool = [...unselectedWords].sort((a, b) => a.text.localeCompare(b.text)); // Alphabetical for extra challenge? Or Random?

    displayPool.forEach(word => {
        const card = createWordCard(word, false);
        poolContainer.appendChild(card);
    });

    // 2. Render Answer (Show selected words in order)
    answerContainer.innerHTML = '';
    selectedWordIds.forEach(id => {
        const word = currentWords.find(w => w.id === id);
        const card = createWordCard(word, true);
        answerContainer.appendChild(card);
    });

    // 3. Update Check Button
    checkBtn.disabled = selectedWordIds.length === 0;
}

function createWordCard(word, inAnswerBox) {
    const div = document.createElement('div');
    div.classList.add('word-card');
    div.textContent = word.text;

    div.addEventListener('click', () => {
        if (nextBtn.classList.contains('hidden') === false) return; // Game inactive

        if (inAnswerBox) {
            // Remove from answer, back to pool
            word.selected = false;
            selectedWordIds = selectedWordIds.filter(id => id !== word.id);
        } else {
            // Add to answer
            word.selected = true;
            selectedWordIds.push(word.id);
        }
        renderUI();
    });
    // Add touchstart logic from previous versions if needed or stick to click?
    // The previous version had separate addTouchListener for buttons but not necessarily here.
    // Actually the previous version did NOT add touchstart here.
    return div;
}

function checkAnswer() {
    try {
        const qData = currentQuestions[currentQuestionIndex];

        // Reconstruct sentence
        const builtSentence = selectedWordIds.map(id => currentWords.find(w => w.id === id).text).join(' ');
        const targetSentence = qData.sentence;

        // Normalize for comparison (remove punctuation, lower case)
        const normalize = (str) => str.replace(/[.,?!]/g, '').toLowerCase().trim();

        if (normalize(builtSentence) === normalize(targetSentence)) {
            // Correct - mark as answered correctly
            qData.answeredCorrectly = true;

            // Random encouragement message
            // Random encouragement message
            const randomMsg = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];

            // Bilingual Feedback Grid
            feedbackMsg.innerHTML = `
                <div style="text-align:center; font-weight:bold; margin-bottom:0.5rem;">${randomMsg}</div>
                <div class="feedback-grid">
                    <div class="row question">
                        <span class="label">Customer</span>
                        <div class="content">
                            <div class="en">🔊 ${qData.audio}</div>
                            <div class="jp">${qData.text}</div>
                        </div>
                    </div>
                    <div class="row answer">
                        <span class="label">You</span>
                        <div class="content">
                            <div class="en">💬 ${qData.sentence}</div>
                            <div class="jp">${qData.answer_jp || ''}</div>
                        </div>
                    </div>
                </div>
            `;

            feedbackMsg.classList.remove('hidden', 'error');
            feedbackMsg.classList.add('success');

            // Animate word cards
            document.querySelectorAll('.answer-box .word-card').forEach(card => {
                card.classList.add('success');
            });

            // Calculate Score
            // Calculate Score
            // User request: Round down to integer seconds (ignore decimals)
            // e.g. 9.1s -> 9s -> 90 points
            // Logic Change: Reduced Points for Retries

            let gainedPoints = 0;
            let timeBonus = 0;

            if (qData.isRetry) {
                gainedPoints = 50;
                timeBonus = 0;
            } else {
                timeBonus = Math.floor(timeLeft) * 10;
                gainedPoints = POINTS_PER_QUESTION + timeBonus;
            }

            score += gainedPoints;

            // Score Popup logic
            const popup = document.createElement('div');
            popup.classList.add('score-popup');

            if (qData.isRetry) {
                popup.innerHTML = `<span style="color:#FF9EC7;">${gainedPoints}</span>`;
            } else {
                popup.innerHTML = `<span style="color:#FF9EC7;">${POINTS_PER_QUESTION}</span> + <span style="color:#A8E6CF;">${timeBonus}</span>`;
            }

            document.querySelector('.hud').appendChild(popup);
            setTimeout(() => popup.remove(), 1500);

            scoreDisplay.classList.add('animate');
            setTimeout(() => scoreDisplay.classList.remove('animate'), 500);
            updateScoreUI();

            // Speak the built sentence
            speak(builtSentence);

            finishQuestion(true);
        } else {
            // Wrong
            feedbackMsg.textContent = "Try Again!";
            feedbackMsg.classList.add('error');
            feedbackMsg.classList.remove('hidden', 'success');
            setTimeout(() => {
                feedbackMsg.classList.add('hidden');
            }, 1000);
        }
    } catch (e) {
        console.error("Check Answer Error", e);
    }
}

function finishQuestion(isCorrect) {
    clearInterval(timerInterval);
    checkBtn.classList.add('hidden');
    clearBtn.classList.add('hidden'); // Hide reset

    // If wrong or timeout, add question back to queue
    // If wrong or timeout, add question back to queue
    if (!isCorrect) {
        // Flag for retry
        const qData = { ...currentQuestions[currentQuestionIndex], isRetry: true };
        // Add to end of queue for retry
        currentQuestions.push(qData);
    }

    nextBtn.classList.remove('hidden');
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 100);
}

function handleTimeout() {
    // Timeout = wrong answer, will retry
    // Make sure we flag it before calling finishQuestion
    // Actually finishQuestion handles the push if isCorrect is false.
    // BUT we need to ensure the object PUSHED is the retry version.

    // finishQuestion logic uses currentQuestionIndex which points to current OLD question.
    // So we need to modify the push logic inside finishQuestion, which we did above.
    // Wait, finishQuestion reads from array again.

    // finishQuestion logic uses currentQuestionIndex which points to current OLD question.
    // So we need to modify the push logic inside finishQuestion, which we did above.
    // Wait, finishQuestion reads from array again.

    // Timeout Feedback
    feedbackMsg.innerHTML = `
        <div style="text-align:center; font-weight:bold; margin-bottom:0.5rem;">Time's Up!</div>
         <div class="feedback-grid">
                <div class="row answer">
                <span class="label">Correct</span>
                <div class="content">
                    <div class="en">💬 ${currentQuestions[currentQuestionIndex].sentence}</div>
                    <div class="jp">${currentQuestions[currentQuestionIndex].answer_jp || ''}</div>
                </div>
            </div>
        </div>
    `;

    feedbackMsg.classList.remove('hidden', 'error');
    feedbackMsg.classList.add('error');
    speak(currentQuestions[currentQuestionIndex].sentence);
    finishQuestion(false); // Mark as incorrect to trigger retry
}

function updateTimerUI() {
    const percentage = (timeLeft / GAME_DURATION_PER_QUESTION) * 100;
    timerFill.style.width = `${Math.max(0, percentage)}%`;
}

function updateScoreUI() {
    scoreDisplay.textContent = score;
}

function showResults() {
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    setTimeout(() => resultScreen.classList.add('active'), 50);
    finalScoreDisplay.textContent = score;

    // High Score Logic
    const highScoreKey = 'highScore_intermediate';
    const currentHigh = parseInt(localStorage.getItem(highScoreKey)) || 0;

    // Create or find high score element
    let highScoreEl = document.getElementById('high-score-display');
    if (!highScoreEl) {
        highScoreEl = document.createElement('div');
        highScoreEl.id = 'high-score-display';
        highScoreEl.style.fontSize = "1.2rem";
        highScoreEl.style.color = "#FF9EC7";
        highScoreEl.style.marginBottom = "1rem";
        finalScoreDisplay.parentNode.insertBefore(highScoreEl, finalScoreDisplay.nextSibling);
    }

    if (score > currentHigh) {
        localStorage.setItem(highScoreKey, score);
        highScoreEl.innerHTML = `🏆 New Record! ${score}`;
        highScoreEl.style.animation = "pulse 1s infinite";
    } else {
        highScoreEl.textContent = `Best: ${currentHigh}`;
        highScoreEl.style.animation = "none";
    }

    // Rank Logic & Badges
    let rank = "Part-timer";
    let badge = "🔰";
    const maxScore = 10 * (POINTS_PER_QUESTION + (GAME_DURATION_PER_QUESTION * 10)); // Theoretical Max
    const percentage = score / maxScore;

    if (percentage > 0.9) { rank = "Store Manager (店長)"; badge = "👑"; }
    else if (percentage > 0.7) { rank = "Shift Leader (バイトリーダー)"; badge = "🥈"; }
    else if (percentage > 0.4) { rank = "Regular Staff (正社員)"; badge = "🥉"; }
    else { rank = "Newbie (新人)"; badge = "🔰"; }

    rankDisplay.innerHTML = `<span style="font-size: 2rem;">${badge}</span><br>Rank: ${rank}`;

    // Perfect Clear Stamp
    // Check if any retry occurred by checking length of history
    const retriesOccurred = currentQuestions.length > 10;

    if (!retriesOccurred && score > 0) {
        let stamp = document.getElementById('perfect-stamp');
        if (!stamp) {
            stamp = document.createElement('div');
            stamp.id = 'perfect-stamp';
            stamp.className = 'perfect-stamp';
            stamp.textContent = "PERFECT!!";
            resultScreen.querySelector('.hud').appendChild(stamp);
        }
    } else {
        const stamp = document.getElementById('perfect-stamp');
        if (stamp) stamp.remove();
    }
}

// Events
function addTouchListener(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', handler);
    el.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Stop double firing if click follows
        handler(e);
    }, { passive: false });
}

addTouchListener('start-btn', initGame);
addTouchListener('retry-btn', initGame);

// Check Button
const checkBtnEl = document.getElementById('check-btn');
checkBtnEl.addEventListener('click', checkAnswer);
checkBtnEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    checkAnswer();
}, { passive: false });

// Next Button
const nextHandler = () => {
    currentQuestionIndex++;
    loadQuestion();
};
const nextBtnEl = document.getElementById('next-btn');
nextBtnEl.addEventListener('click', nextHandler);
nextBtnEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    nextHandler();
}, { passive: false });

// Clear Button
const clearHandler = () => {
    // Reset current selection
    currentWords.forEach(w => w.selected = false);
    selectedWordIds = [];
    renderUI();
};
const clearBtnEl = document.getElementById('clear-btn');
clearBtnEl.addEventListener('click', clearHandler);
clearBtnEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    clearHandler();
}, { passive: false });

// Replay Button
const replayHandler = () => {
    const qData = currentQuestions[currentQuestionIndex];
    if (qData) {
        speak(qData.audio);
    }
};
const replayBtnEl = document.getElementById('replay-btn');
replayBtnEl.addEventListener('click', replayHandler);
replayBtnEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    replayHandler();
}, { passive: false });
