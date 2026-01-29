const synth = window.speechSynthesis;
const textInput = document.querySelector('#text-input');
const voiceSelect = document.querySelector('#voice-select');
const speakBtn = document.querySelector('#speak-btn');
const yearSpan = document.querySelector('#year');

// New DOM elements for enhanced features
const pauseBtn = document.querySelector('#pause-btn');
const stopBtn = document.querySelector('#stop-btn');
const clearBtn = document.querySelector('#clear-btn');
const sampleBtn = document.querySelector('#sample-btn');
const themeToggle = document.querySelector('#theme-toggle');
const charCount = document.querySelector('#char-count');
const rateControl = document.querySelector('#rate-control');
const pitchControl = document.querySelector('#pitch-control');
const volumeControl = document.querySelector('#volume-control');
const rateValue = document.querySelector('#rate-value');
const pitchValue = document.querySelector('#pitch-value');
const volumeValue = document.querySelector('#volume-value');
const previewText = document.querySelector('#preview-text');
const statusText = document.querySelector('#status-text');
const currentYear = document.querySelector('#current-year');
const waveform = document.querySelector('.waveform');

let voices = [];
let isSpeaking = false;
let isPaused = false;
let currentUtterance = null;

// 1. Set the dynamic year automatically
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}
if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

// Initialize the app
function init() {
    // Load available voices
    populateVoiceList();
    
    // If voices aren't loaded yet, wait for them
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Update character count
    updateCharCount();
    
    // Set sample text
    setSampleText();
    
    // Load saved theme preference
    loadThemePreference();
    
    // Set initial control values
    updateControlValues();
}

function populateVoiceList() {
    voices = synth.getVoices();
    
    // Clear only if voiceSelect exists
    if (voiceSelect) {
        voiceSelect.innerHTML = '';
        
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
        
        // Set default voice (English if available)
        const defaultVoiceIndex = voices.findIndex(voice => 
            voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        if (defaultVoiceIndex !== -1) {
            // Find the option with matching data-name
            const options = voiceSelect.querySelectorAll('option');
            options.forEach((option, index) => {
                if (index === defaultVoiceIndex) {
                    option.selected = true;
                }
            });
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Text input events
    if (textInput) {
        textInput.addEventListener('input', updateCharCount);
    }
    
    // Control sliders
    if (rateControl) {
        rateControl.addEventListener('input', () => {
            rateValue.textContent = `${rateControl.value}x`;
        });
    }
    
    if (pitchControl) {
        pitchControl.addEventListener('input', () => {
            pitchValue.textContent = pitchControl.value;
        });
    }
    
    if (volumeControl) {
        volumeControl.addEventListener('input', () => {
            volumeValue.textContent = `${Math.round(volumeControl.value * 100)}%`;
        });
    }
    
    // Action buttons
    if (speakBtn) {
        speakBtn.addEventListener('click', speakText);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopSpeaking);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearText);
    }
    
    if (sampleBtn) {
        sampleBtn.addEventListener('click', setSampleText);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Speak the text
function speakText() {
    if (synth.speaking && !isPaused) {
        statusText.textContent = "Already speaking...";
        return;
    }
    
    if (!textInput.value.trim()) {
        statusText.textContent = "Please enter some text first";
        textInput.focus();
        return;
    }
    
    if (isPaused) {
        // Resume if paused
        synth.resume();
        updateUIForSpeaking();
        statusText.textContent = "Speaking...";
    } else {
        // Start new speech
        const utterThis = new SpeechSynthesisUtterance(textInput.value);
        currentUtterance = utterThis;
        
        // Set voice if selected
        if (voiceSelect) {
            const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
            voices.forEach((voice) => {
                if (voice.name === selectedOption) {
                    utterThis.voice = voice;
                    utterThis.lang = voice.lang;
                }
            });
        }
        
        // Set Nepali as default for Nepali text detection
        if (textInput.value.match(/[\u0900-\u097F]/)) {
            utterThis.lang = 'ne-NP';
        }
        
        // Apply controls if they exist
        if (rateControl) utterThis.rate = parseFloat(rateControl.value);
        if (pitchControl) utterThis.pitch = parseFloat(pitchControl.value);
        if (volumeControl) utterThis.volume = parseFloat(volumeControl.value);
        
        // Speech event handlers
        utterThis.onstart = () => {
            isSpeaking = true;
            updateUIForSpeaking();
            animateWaveform(true);
            statusText.textContent = "Speaking...";
        };
        
        utterThis.onend = () => {
            isSpeaking = false;
            isPaused = false;
            updateUIForStopped();
            animateWaveform(false);
            statusText.textContent = "Finished speaking";
            
            // Reset status after 3 seconds
            setTimeout(() => {
                if (!isSpeaking && statusText) {
                    statusText.textContent = "Ready to speak";
                }
            }, 3000);
        };
        
        utterThis.onpause = () => {
            isPaused = true;
            if (statusText) statusText.textContent = "Paused";
        };
        
        utterThis.onresume = () => {
            isPaused = false;
            if (statusText) statusText.textContent = "Speaking...";
        };
        
        utterThis.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            if (statusText) statusText.textContent = "Error occurred";
            updateUIForStopped();
            animateWaveform(false);
        };
        
        synth.speak(utterThis);
    }
}

// Toggle pause/resume
function togglePause() {
    if (isSpeaking) {
        if (isPaused) {
            synth.resume();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            }
            if (statusText) statusText.textContent = "Speaking...";
        } else {
            synth.pause();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
            }
            if (statusText) statusText.textContent = "Paused";
        }
    }
}

// Stop speaking
function stopSpeaking() {
    synth.cancel();
    isSpeaking = false;
    isPaused = false;
    updateUIForStopped();
    animateWaveform(false);
    
    if (statusText) {
        statusText.textContent = "Stopped";
        
        // Reset status after 3 seconds
        setTimeout(() => {
            if (!isSpeaking && statusText) {
                statusText.textContent = "Ready to speak";
            }
        }, 3000);
    }
}

// Update character count
function updateCharCount() {
    if (charCount && textInput) {
        const count = textInput.value.length;
        charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
        
        // Update preview text with first 100 characters
        if (previewText) {
            if (textInput.value.trim()) {
                const preview = textInput.value.substring(0, 100);
                previewText.textContent = preview + (textInput.value.length > 100 ? '...' : '');
            } else {
                previewText.textContent = "Ready to convert your text to natural sounding speech.";
            }
        }
    }
}

// Clear text input
function clearText() {
    if (textInput) {
        textInput.value = '';
        updateCharCount();
        textInput.focus();
        if (statusText) statusText.textContent = "Text cleared";
    }
}

// Set sample text
function setSampleText() {
    const sampleTexts = [
        "Hello! Welcome to VoiceFlow. This is a text-to-speech converter that can transform written text into spoken words. Try it out with your own text!",
        "नमस्ते! भ्वाइसफ्लोमा स्वागत छ। यो टेक्स्ट-टु-स्पीच कन्भर्टर हो जसले लेखिएको पाठलाई बोलिएको शब्दमा परिवर्तन गर्न सक्छ। आफ्नै पाठसंग यसलाई प्रयोग गरेर हेर्नुहोस्!",
        "VoiceFlow supports multiple languages and voice settings. You can adjust the speed, pitch, and volume to create the perfect voice for your needs.",
        "This tool is designed with accessibility in mind. It can help people with visual impairments or reading difficulties to access digital content."
    ];
    
    if (textInput) {
        const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        textInput.value = randomText;
        updateCharCount();
        if (statusText) statusText.textContent = "Sample text loaded";
    }
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('voiceflow-theme', isLight ? 'light' : 'dark');
    
    // Update status
    if (statusText) {
        statusText.textContent = isLight ? "Switched to light theme" : "Switched to dark theme";
    }
}

// Load saved theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('voiceflow-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

// Update UI for speaking state
function updateUIForSpeaking() {
    if (speakBtn) {
        speakBtn.disabled = true;
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speaking...</span>';
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    }
    
    if (stopBtn) {
        stopBtn.disabled = false;
    }
    
    if (textInput) {
        textInput.disabled = true;
    }
    
    if (voiceSelect) {
        voiceSelect.disabled = true;
    }
}

// Update UI for stopped state
function updateUIForStopped() {
    if (speakBtn) {
        speakBtn.disabled = false;
        speakBtn.innerHTML = '<i class="fas fa-play"></i><span>Convert to Speech</span>';
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    }
    
    if (stopBtn) {
        stopBtn.disabled = true;
    }
    
    if (textInput) {
        textInput.disabled = false;
    }
    
    if (voiceSelect) {
        voiceSelect.disabled = false;
    }
}

// Animate waveform
function animateWaveform(animate) {
    if (waveform) {
        const waveBars = waveform.querySelectorAll('.wave-bar');
        
        if (animate) {
            waveBars.forEach(bar => {
                bar.style.animationPlayState = 'running';
            });
        } else {
            waveBars.forEach(bar => {
                bar.style.animationPlayState = 'paused';
                bar.style.transform = 'scaleY(0.8)';
            });
        }
    }
}

// Update control values display
function updateControlValues() {
    if (rateValue && rateControl) {
        rateValue.textContent = `${rateControl.value}x`;
    }
    
    if (pitchValue && pitchControl) {
        pitchValue.textContent = pitchControl.value;
    }
    
    if (volumeValue && volumeControl) {
        volumeValue.textContent = `${Math.round(volumeControl.value * 100)}%`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);