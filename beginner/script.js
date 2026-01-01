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
    currentQuestions = shuffled.slice(0, 10);
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

        // Score Calculation (Aligned with Intermediate)
        // Intermediate: floor(timeLeft) * 10
        // Beginner was: timeLeft * 10 (with decimals?)
        const timeBonus = Math.floor(timeLeft) * 10;
        const gainedPoints = POINTS_PER_QUESTION + timeBonus;

        if (selectedOption.isCorrect) {
            // Correct
            clickedBtn.classList.add('correct');
            score += gainedPoints;

            // Feedback Message
            const randomMsg = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
            feedbackMsg.textContent = randomMsg;
            feedbackMsg.classList.remove('hidden', 'error');
            feedbackMsg.classList.add('success');

            // Score Popup
            const popup = document.createElement('div');
            popup.classList.add('score-popup');
            popup.innerHTML = `<span style="color:#FF9EC7;">${POINTS_PER_QUESTION}</span> + <span style="color:#A8E6CF;">${timeBonus}</span>`;
            if (document.querySelector('.hud')) document.querySelector('.hud').appendChild(popup);
            setTimeout(() => popup.remove(), 1500);

            scoreDisplay.classList.add('animate');
            setTimeout(() => scoreDisplay.classList.remove('animate'), 500);

        } else {
            // Wrong
            clickedBtn.classList.add('wrong');
            if (correctBtn) correctBtn.classList.add('correct'); // Show correct answer

            feedbackMsg.textContent = "Try Again!";
            feedbackMsg.classList.add('error');
            feedbackMsg.classList.remove('hidden', 'success');
            setTimeout(() => {
                feedbackMsg.classList.add('hidden');
            }, 1000);

            // Push to retry queue
            currentQuestions.push(currentQuestions[currentQuestionIndex]);
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
    currentQuestions.push(currentQuestions[currentQuestionIndex]);

    feedbackMsg.textContent = "Time's Up! Correct: " + currentQuestions[currentQuestionIndex].sentence;
    feedbackMsg.classList.remove('hidden', 'error');
    feedbackMsg.classList.add('error');

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

    // Rank Logic
    let rank = "Part-timer";
    const maxScore = currentQuestions.length * (POINTS_PER_QUESTION + (GAME_DURATION_PER_QUESTION * 10));
    const percentage = score / maxScore;

    if (percentage > 0.9) rank = "Store Manager (店長)";
    else if (percentage > 0.7) rank = "Shift Leader (バイトリーダー)";
    else if (percentage > 0.4) rank = "Regular Staff (正社員)";
    else rank = "Newbie (新人)";

    rankDisplay.textContent = `Rank: ${rank}`;
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
