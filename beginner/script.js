// Game Configuration
const GAME_DURATION_PER_QUESTION = 10; // seconds
const POINTS_PER_QUESTION = 100;

// Quiz Data - Station Bookstore Edition (Tourist Friendly)
// Quiz Data - Station Bookstore Edition (Tourist Friendly)
// Quiz Data - Use Shared Master List
const QUESTIONS = MASTER_QUESTIONS;

// Game State
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 0;
let isAnswering = false; // Prevents double clicking

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');

const timerFill = document.getElementById('timer-fill');
const scoreDisplay = document.getElementById('score-display');
const characterAvatar = document.querySelector('.customer-avatar');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const replayBtn = document.getElementById('replay-btn');
const nextBtnContainer = document.getElementById('next-btn-container'); // NEW
const questionCounter = document.getElementById('question-counter'); // NEW
const feedbackMsg = document.getElementById('feedback-msg'); // NEW

// Encouragement Messages
const ENCOURAGEMENT = [
    "完璧！🎉", "素晴らしい！⭐", "すごい！🌟", "よくできました！💯",
    "最高！✨", "その調子！🔥", "天才！💎", "パーフェクト！🏆"
];

const finalScoreDisplay = document.getElementById('final-score-display');
const rankDisplay = document.getElementById('rank-display');

// Audio handled by AudioManager

function speak(text) {
    AudioManager.speechRate = 0.7; // Slower for beginners
    AudioManager.speak(text);
}

// Functions
function initGame() {
    score = 0;
    currentQuestionIndex = 0;
    // Select 10 random questions from the pool
    const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
    // Deep clone to track isRetry independently for each game session
    currentQuestions = shuffled.slice(0, 10).map(q => ({ ...q, isRetry: false }));
    updateScoreUI();

    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    resultScreen.classList.remove('active');
    resultScreen.classList.add('hidden');

    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active'); // Wait for transition if needed, but simple block display switch is safer for logic

    // Reset speech synth
    AudioManager.unlock();

    // Dynamic Start logic if needed
    // ...
    loadQuestion();
}

function generateOptions(correctAnswer, allQuestions) {
    // 1. Correct Answer
    const options = [correctAnswer];

    // 2. Distractors (Pick 2 random different answers)
    const otherQuestions = allQuestions.filter(q => q.sentence !== correctAnswer);
    // Shuffle others
    const shuffledOthers = [...otherQuestions].sort(() => 0.5 - Math.random());

    if (shuffledOthers[0]) options.push(shuffledOthers[0].sentence);
    if (shuffledOthers[1]) options.push(shuffledOthers[1].sentence);

    // Fallback if not enough questions (shouldn't happen with 20+)
    while (options.length < 3) {
        options.push("Secondary Check");
    }

    return options;
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }

    const qData = currentQuestions[currentQuestionIndex];

    // UI Update
    questionText.textContent = qData.text;
    optionsContainer.innerHTML = '';
    optionsContainer.classList.remove('hidden'); // Show options
    nextBtnContainer.classList.add('hidden'); // Hide Next button
    feedbackMsg.classList.add('hidden');
    feedbackMsg.className = 'feedback hidden'; // Reset classes
    feedbackMsg.classList.add('hidden');
    feedbackMsg.className = 'feedback hidden'; // Reset classes



    // ... (Existing Counter Logic) ...

    // Retry Mode & Counter Logic
    const initialTotal = 10;
    const isRetry = currentQuestionIndex >= initialTotal;
    const appContainer = document.querySelector('.app-container');

    if (isRetry) {
        appContainer.classList.add('retry-mode');
        questionCounter.textContent = `${currentQuestionIndex + 1}/${initialTotal}`;
    } else {
        appContainer.classList.remove('retry-mode');
        questionCounter.textContent = `${currentQuestionIndex + 1}/${initialTotal}`;
    }

    // Dynamic Options Generation
    // We need to generate options on the fly for THIS question
    const correctSentence = qData.sentence;
    const optionTexts = generateOptions(correctSentence, QUESTIONS);

    // Map to objects with index tracking
    // We need to know which one is correct. 
    // Let's assign originalIndex: 0=Correct, 1=Wrong, 2=Wrong (Before shuffle)
    // Actually, generateOptions returns [Correct, Wrong1, Wrong2]

    const rawOptions = optionTexts.map((text, idx) => ({
        text: text,
        isCorrect: text === correctSentence
    }));

    // Robust Shuffle
    const shuffledOptions = [...rawOptions];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    shuffledOptions.forEach((optObj, displayIndex) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = optObj.text;

        // Pass the object data directly to handler
        btn.addEventListener('click', (e) => handleAnswer(optObj, e.target));
        optionsContainer.appendChild(btn);
    });

    isAnswering = false;

    // Reset Timer
    timeLeft = GAME_DURATION_PER_QUESTION;
    updateTimerUI();
    startTimer();

    // Auto speak
    setTimeout(() => speak(qData.audio), 500);
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

function updateTimerUI() {
    const percentage = (timeLeft / GAME_DURATION_PER_QUESTION) * 100;
    timerFill.style.width = `${Math.max(0, percentage)}%`;

    if (percentage < 30) {
        timerFill.style.backgroundColor = '#E94560'; // Red alert
    } else {
        timerFill.style.backgroundColor = '#4EA8DE'; // Normal blue
    }
}

function handleAnswer(selectedOption, clickedBtn) {
    if (isAnswering) return;
    try {
        isAnswering = true;
        clearInterval(timerInterval);

        const qData = currentQuestions[currentQuestionIndex];

        // Find correct button visually
        const allButtons = document.querySelectorAll('.option-btn');
        let correctBtn = null;
        let correctAnswerText = "";

        allButtons.forEach(btn => {
            // We match by text content since we don't have stable IDs anymore
            // (Assuming unique sentences)
            if (btn.textContent === currentQuestions[currentQuestionIndex].sentence) {
                correctBtn = btn;
                correctAnswerText = btn.textContent;
            }
        });

        // ALWAYS speak the correct answer, regardless of what was clicked
        speak(correctAnswerText);

        // Score Calculation (Reduced Points for Retries)
        // If Retry: Fixed 50 points (No bonus)
        // If First Try: 100 points + Time Bonus

        let gainedPoints = 0;
        let timeBonus = 0;
        const currentQ = currentQuestions[currentQuestionIndex];

        if (currentQ.isRetry) {
            gainedPoints = 50;
            timeBonus = 0; // No speed bonus for retry
        } else {
            timeBonus = Math.floor(timeLeft) * 10;
            gainedPoints = POINTS_PER_QUESTION + timeBonus;
        }

        if (selectedOption.isCorrect) {
            // Correct
            clickedBtn.classList.add('correct');
            score += gainedPoints;

            // Feedback Message
            const randomMsg = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];

            // Bilingual Feedback Grid
            feedbackMsg.innerHTML = `
                <div class="msg-box success">
                    ${randomMsg}
                </div>
                <div class="feedback-grid">
                    <div class="row question">
                        <span class="label">Customer</span>
                        <div class="content">
                            <div class="en">🔊 ${currentQ.audio}</div>
                            <div class="jp">${currentQ.text}</div>
                        </div>
                    </div>
                    <div class="row answer">
                        <span class="label">You</span>
                        <div class="content">
                            <div class="en">💬 ${currentQ.sentence}</div>
                            <div class="jp">${currentQ.answer_jp || ''}</div>
                        </div>
                    </div>
                </div>
            `;

            feedbackMsg.classList.remove('hidden', 'error', 'success');

            // Layout Toggle: Hide Options to show Feedback

            // Layout Toggle: Hide Options to show Feedback
            optionsContainer.classList.add('hidden');

            // Score Popup
            const popup = document.createElement('div');
            popup.classList.add('score-popup');

            if (currentQ.isRetry) {
                // Simplified popup for retry
                popup.innerHTML = `<span style="color:#FF9EC7;">${gainedPoints}</span>`;
            } else {
                popup.innerHTML = `<span style="color:#FF9EC7;">${POINTS_PER_QUESTION}</span> + <span style="color:#A8E6CF;">${timeBonus}</span>`;
            }

            if (document.querySelector('.hud')) document.querySelector('.hud').appendChild(popup);
            setTimeout(() => popup.remove(), 1500);

            scoreDisplay.classList.add('animate');
            setTimeout(() => scoreDisplay.classList.remove('animate'), 500);

        } else {
            // Wrong
            clickedBtn.classList.add('wrong');
            if (correctBtn) correctBtn.classList.add('correct'); // Show correct answer

            // Wrong Answer Feedback
            feedbackMsg.innerHTML = `
                <div class="msg-box error">Try Again!</div>
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

            feedbackMsg.classList.remove('hidden', 'error', 'success');
            // Timeout increased for readability
            setTimeout(() => {
                feedbackMsg.classList.add('hidden');
            }, 8000);

            // Push to retry queue with retry flag
            const retryQ = { ...currentQuestions[currentQuestionIndex], isRetry: true };
            currentQuestions.push(retryQ);
        }

        updateScoreUI();

        // Show Next Button instead of auto-advance
        nextBtnContainer.classList.remove('hidden');
    } catch (e) {
        console.error("handleAnswer Error:", e);
        isAnswering = false; // Reset lock
        alert("エラーが発生しました: " + e.message);
        nextBtnContainer.classList.remove('hidden'); // Try to show next anyway
    }
}

function handleTimeout() {
    isAnswering = true;
    const qData = currentQuestions[currentQuestionIndex];
    const correctIndex = qData.correct;

    // Retry on timeout too
    const retryQ = { ...currentQuestions[currentQuestionIndex], isRetry: true };
    currentQuestions.push(retryQ);

    // Timeout Feedback
    feedbackMsg.innerHTML = `
        <div class="msg-box error">Time's Up!</div>
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

    feedbackMsg.classList.remove('hidden', 'error', 'success');

    // Layout Toggle: Hide Options to show Feedback
    optionsContainer.classList.add('hidden');

    // Find correct button visually
    const allButtons = document.querySelectorAll('.option-btn');
    let correctAnswerText = "";
    allButtons.forEach(btn => {
        if (btn.textContent === currentQuestions[currentQuestionIndex].sentence) {
            btn.classList.add('correct');
            correctAnswerText = btn.textContent;
        }
    });

    // Speak correct answer on timeout too
    speak(correctAnswerText);

    nextBtnContainer.classList.remove('hidden');
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
    const highScoreKey = 'highScore_beginner';
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
    let badge = "🔰"; // Beginner
    const maxScore = 10 * (POINTS_PER_QUESTION + (GAME_DURATION_PER_QUESTION * 10)); // Theoretical Max
    const percentage = score / maxScore;

    if (percentage > 0.9) { rank = "Store Manager (店長)"; badge = "👑"; }
    else if (percentage > 0.7) { rank = "Shift Leader (バイトリーダー)"; badge = "🥈"; }
    else if (percentage > 0.4) { rank = "Regular Staff (正社員)"; badge = "🥉"; }
    else { rank = "Newbie (新人)"; badge = "🔰"; }

    rankDisplay.innerHTML = `<span style="font-size: 2rem;">${badge}</span><br>Rank: ${rank}`;

    // Perfect Clear Stamp
    // Check if any retry occurred (isRetry in currentQuestions history?)
    // Actually, simple way: if score is very high? No, Reduced points handles that.
    // If user never retried, they hit max potential.
    // Let's rely on percentage or just check if score >= max possible for NO retries?
    // Actually, let's look at the original questions. If currentQuestions.length == 10, no retries occurred!

    // Check functionality:
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
        // Stamp Animation controlled by CSS
    } else {
        const stamp = document.getElementById('perfect-stamp');
        if (stamp) stamp.remove();
    }
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', initGame);
document.getElementById('retry-btn').addEventListener('click', initGame);
replayBtn.addEventListener('click', () => {
    if (currentQuestionIndex < currentQuestions.length) {
        speak(currentQuestions[currentQuestionIndex].audio);
    }
});

// Next Button Listener
document.getElementById('next-btn').addEventListener('click', () => {
    currentQuestionIndex++;
    loadQuestion();
});
