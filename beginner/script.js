// Game Configuration
const GAME_DURATION_PER_QUESTION = 10; // seconds
const POINTS_PER_QUESTION = 100;

// Quiz Data - Station Bookstore Edition (Tourist Friendly)
// Quiz Data - Station Bookstore Edition (Tourist Friendly)
const QUESTIONS = [
    {
        text: "これ、免税になりますか？",
        audio: "Is this tax-free?",
        options: ["It's not a duty-free shop.", "Yes, certainly.", "It is a passport."],
        correct: 0
    },
    {
        text: "この価格は税込みですか？",
        audio: "Is tax included in this price?",
        options: ["Yes, tax is included.", "No, tax is extra.", "It is 10%."],
        correct: 0
    },
    {
        text: "プレゼント包装できますか？",
        audio: "Can you wrap this for a gift?",
        options: ["Certainly, free of charge.", "No, do it yourself.", "I like ribbons."],
        correct: 0
    },
    {
        text: "これ、いくら？",
        audio: "How much is this?",
        options: ["It is 1,200 yen.", "It is expensive.", "I am fine."],
        correct: 0
    },
    {
        text: "この本を探しているのですが…（スマホ画面を見せて）",
        audio: "I am looking for this book.",
        options: ["Let me check the stock.", "It is nice.", "Go to the library."],
        correct: 0
    },
    {
        text: "図書カードは使えますか？(訪日客)",
        audio: "Do you accept book gift cards?",
        options: ["Yes, we do.", "No, cash only.", "It is paper."],
        correct: 0
    },
    {
        text: "マンガ売り場はどこですか？",
        audio: "Where are the comics?",
        options: ["Go straight down this aisle and it's on your left.", "I don't know.", "It is Wednesday."],
        correct: 0
    },
    // New Questions for Station/Tourist Context
    {
        text: "ここは何階ですか？",
        audio: "What floor is this?",
        options: ["This is the third floor.", "It is the ground floor.", "Look at the map."],
        correct: 0
    },
    {
        text: "ここから新館に行けますか？",
        audio: "Can I go to the new building from here?",
        options: ["The third floor is not connected to the new building.", "Yes, go straight.", "It is far."],
        correct: 0
    },
    {
        text: "2階へはどう行けばいいですか？",
        audio: "How do I get to the 2nd floor?",
        options: ["Take the escalator down to the second floor.", "Jump.", "Take the elevator up."],
        correct: 0
    },
    {
        text: "エスカレーターはどこですか？",
        audio: "Where is the escalator?",
        options: ["The escalator is over there.", "I don't know.", "It is stopping."],
        correct: 0
    },
    {
        text: "（商品画像を見せて）これありますか？",
        audio: "Do you have this?",
        options: ["We don't have it.", "Yes, maybe.", "It is delicious."],
        correct: 0
    },
    {
        text: "電気屋さんはどこですか？",
        audio: "Where is the electronics store?",
        options: ["The electronics store is on the fourth floor of the new building.", "It is next door.", "It is in Akihabara."],
        correct: 0
    },
    // Kept some generic ones that fit
    {
        text: "荷物を預かってもらえますか？",
        audio: "Can I leave my luggage here?",
        options: ["Sorry, we don't have a cloakroom.", "Yes, 500 yen.", "Your bag is big."],
        correct: 0
    },
    {
        text: "営業時間は何時まで？",
        audio: "What time do you close?",
        options: ["We are open from 10 AM to 8 PM.", "It is 5 o'clock.", "Tomorrow."],
        correct: 0
    },
    {
        text: "クレジットカード使えますか？",
        audio: "Do you accept credit cards?",
        options: ["Yes, we do.", "No, cash only.", "It is expensive."],
        correct: 0
    },
    {
        text: "返品できますか？",
        audio: "Can I return this?",
        options: ["I'm sorry, we don't accept returns.", "Yes, anytime.", "Maybe tomorrow."],
        correct: 0
    }
];

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

    loadQuestion();
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

    // Create Buttons with Robust Shuffle
    const shuffledOptions = qData.options.map((opt, index) => ({ text: opt, originalIndex: index }));

    // Fisher-Yates Shuffle
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    shuffledOptions.forEach((optObj) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = optObj.text;
        btn.dataset.originalIndex = optObj.originalIndex; // Store index for timeout highlighting
        // Pass the element itself or let handleAnswer find the right buttons
        btn.addEventListener('click', (e) => handleAnswer(optObj.originalIndex, optObj.text, e.target));
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

function handleAnswer(selectedIndex, answerText, clickedBtn) {
    if (isAnswering) return;
    isAnswering = true;
    clearInterval(timerInterval);

    // Find correct button and answer text
    const qData = currentQuestions[currentQuestionIndex];
    const correctIndex = qData.correct;

    // Find all buttons to find the correct one visually
    const allButtons = document.querySelectorAll('.option-btn');
    let correctBtn = null;
    let correctAnswerText = ""; // To store the correct answer text

    allButtons.forEach(btn => {
        if (parseInt(btn.dataset.originalIndex) === correctIndex) {
            correctBtn = btn;
            correctAnswerText = btn.textContent; // Get text from correct button
        }
    });

    // ALWAYS speak the correct answer, regardless of what was clicked
    speak(correctAnswerText);

    const bonus = Math.ceil(timeLeft * 10);
    const gainedPoints = POINTS_PER_QUESTION + bonus;

    if (selectedIndex === correctIndex) {
        // Correct
        clickedBtn.classList.add('correct');
        score += gainedPoints;

        // Score Popup
        const popup = document.createElement('div');
        popup.classList.add('score-popup');
        popup.innerHTML = `<span style="color:#FF9EC7;">${POINTS_PER_QUESTION}</span> + <span style="color:#A8E6CF;">${bonus}</span>`;
        if (document.querySelector('.hud')) document.querySelector('.hud').appendChild(popup);
        setTimeout(() => popup.remove(), 1500);

        scoreDisplay.classList.add('animate');
        setTimeout(() => scoreDisplay.classList.remove('animate'), 500);

    } else {
        // Wrong
        clickedBtn.classList.add('wrong');
        if (correctBtn) correctBtn.classList.add('correct'); // Show correct answer

        // Push to retry queue
        currentQuestions.push(qData);
    }

    updateScoreUI();

    // Show Next Button instead of auto-advance
    nextBtnContainer.classList.remove('hidden');
}

function handleTimeout() {
    isAnswering = true;
    const qData = currentQuestions[currentQuestionIndex];
    const correctIndex = qData.correct;

    // Retry on timeout too
    currentQuestions.push(qData);

    // Find correct button visually
    const allButtons = document.querySelectorAll('.option-btn');
    let correctAnswerText = "";
    allButtons.forEach(btn => {
        if (parseInt(btn.dataset.originalIndex) === correctIndex) {
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
