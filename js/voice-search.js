const SOUNDS_PATH = 'assets/sounds/';

// Sound effect placeholders
const SOUNDS = {
    START: `${SOUNDS_PATH}start.mp3`,
    STOP: `${SOUNDS_PATH}stop.mp3`,
    ERROR: `${SOUNDS_PATH}error.mp3`
};

class VoiceSearch {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.voiceButton = document.querySelector('.voice-search-btn');
        this.searchInput = document.querySelector('#search-input');
        this.sounds = {};
        
        this.initializeSpeechRecognition();
        this.initializeSoundEffects();
        this.setupEventListeners();
    }

    initializeSpeechRecognition() {
        // Check for all possible speech recognition APIs
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => this.handleRecognitionStart();
            this.recognition.onresult = (event) => this.handleRecognitionResult(event);
            this.recognition.onerror = (event) => this.handleRecognitionError(event);
            this.recognition.onend = () => this.handleRecognitionEnd();
        } else {
            this.voiceButton.style.display = 'none';
            console.log('Speech recognition not supported in this browser');
        }
    }

    initializeSoundEffects() {
        // Preload sound effects
        Object.entries(SOUNDS).forEach(([key, path]) => {
            this.sounds[key] = new Audio(path);
            this.sounds[key].preload = 'auto';
        });
    }

    setupEventListeners() {
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
        }
    }

    toggleVoiceInput() {
        if (!this.isListening) {
            this.startListening();
        } else {
            this.stopListening();
        }
    }

    startListening() {
        try {
            this.recognition.start();
            this.playSound('START');
        } catch (error) {
            console.error('Speech recognition error:', error);
            this.handleRecognitionError(error);
        }
    }

    stopListening() {
        this.recognition.stop();
        this.playSound('STOP');
    }

    handleRecognitionStart() {
        this.isListening = true;
        this.voiceButton.classList.add('listening');
        this.voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        
        // Add visual feedback
        document.body.classList.add('voice-active');
    }

    handleRecognitionResult(event) {
        const transcript = event.results[0][0].transcript;
        this.searchInput.value = transcript;
        
        // Find the form and submit
        const searchForm = this.searchInput.closest('form');
        if (searchForm && event.results[0][0].confidence > 0.8) {
            searchForm.submit();
        }
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.playSound('ERROR');
        this.resetVoiceInterface();
    }

    handleRecognitionEnd() {
        this.resetVoiceInterface();
    }

    resetVoiceInterface() {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        document.body.classList.remove('voice-active');
    }

    playSound(soundKey) {
        if (this.sounds[soundKey]) {
            this.sounds[soundKey].currentTime = 0;
            this.sounds[soundKey].play().catch(error => {
                console.log('Sound playback error:', error);
            });
        }
    }
}

// Initialize voice search when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const voiceSearch = new VoiceSearch();
});
