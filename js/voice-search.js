const beepStart = new Audio('/sounds/start.mp3');
const beepEnd = new Audio('/sounds/end.mp3');
const beepError = new Audio('/sounds/error.mp3');

class VoiceSearch {
    constructor(inputId, buttonId) {
        this.input = document.getElementById(inputId);
        this.button = document.getElementById(buttonId);
        
        // Fix: Use only webkitSpeechRecognition for now as it's the most widely supported
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            this.button.style.display = 'none';
            return;
        }
        
        this.recognition = new webkitSpeechRecognition();
        this.isListening = false;
        
        this.setupRecognition();
        this.setupButton();
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.button.classList.add('listening');
            beepStart.play();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.button.classList.remove('listening');
            beepEnd.play();
        };

        this.recognition.onerror = () => {
            this.isListening = false;
            this.button.classList.remove('listening');
            beepError.play();
        };

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this.input.value = transcript;
            
            if (event.results[0].isFinal) {
                this.recognition.stop();
                if (this.input.form) {
                    this.input.form.submit();
                }
            }
        };
    }

    setupButton() {
        this.button.addEventListener('click', () => {
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        });
    }
}
