/**
 * Audio Manager for Register Hero
 * Handles robust speech synthesis across PC and Mobile (iOS/Android)
 * Fixes: GC issues, language enforcement fallback, user interaction timing
 */

const AudioManager = {
    synth: window.speechSynthesis,
    currentUtterance: null, // Prevent GC
    isSpeaking: false,

    // Default config
    speechRate: 1.0,

    init() {
        if (!this.synth) {
            console.warn("Speech Synthesis not supported");
            return;
        }

        // Mobile Unlock Trigger (call this on user interaction like 'Start')
        this.unlock = () => {
            if (this.synth) {
                const u = new SpeechSynthesisUtterance("");
                u.volume = 0;
                this.synth.resume();
                this.synth.speak(u);
            }
        };
    },

    speak(text, onEndCallback = null) {
        if (!this.synth) return;

        try {
            this.synth.cancel();

            // Store in global/object property to prevent GC
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            const utterThis = this.currentUtterance;

            // Flags for UI checking if needed
            this.isSpeaking = true;

            // Visual feedback trigger (if element exists)
            const app = document.querySelector('.app-container');
            if (app) app.classList.add('speaking');

            utterThis.rate = this.speechRate;

            // Intelligent Voice Selection
            // 1. Try en-US (Best)
            // 2. Try en-GB (Good)
            // 3. Try any 'en' (Fallback)
            // 4. Fallback to System Default (Safety)
            const voices = this.synth.getVoices();
            let selectedVoice = null;

            if (voices.length > 0) {
                selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en_US');
                if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
                if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en'));
            }

            if (selectedVoice) {
                utterThis.voice = selectedVoice;
                utterThis.lang = 'en-US'; // Force English ONLY if we found a compatible voice
            } else {
                // If no English voice found, DO NOT set lang='en-US'
                // This lets Android/iOS use the default voice instead of being silent
                console.warn('AudioManager: No English voice found, using default.');
            }

            utterThis.onend = () => {
                this.isSpeaking = false;
                if (app) app.classList.remove('speaking');
                if (onEndCallback) onEndCallback();
            };

            utterThis.onerror = (e) => {
                console.error("AudioManager Error:", e);
                this.isSpeaking = false;
                if (app) app.classList.remove('speaking');
            };

            this.synth.speak(utterThis);

        } catch (e) {
            console.error("AudioManager Exception:", e);
        }
    }
};

// Auto-init if loaded
AudioManager.init();
