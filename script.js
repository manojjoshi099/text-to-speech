const synth = window.speechSynthesis;
const textInput = document.querySelector('#text-input');
const voiceSelect = document.querySelector('#voice-select');
const speakBtn = document.querySelector('#speak-btn');

let voices = [];

// Function to fill the dropdown with available browser voices
function populateVoiceList() {
    voices = synth.getVoices();
    
    voiceSelect.innerHTML = '';
    voices.forEach((voice, i) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

// Fixed for Chrome: voices are loaded asynchronously
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

speakBtn.addEventListener('click', () => {
    if (synth.speaking) {
        console.error('Already speaking...');
        return;
    }

    if (textInput.value !== '') {
        const utterThis = new SpeechSynthesisUtterance(textInput.value);
        
        // Find the selected voice object
        const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
        voices.forEach((voice) => {
            if (voice.name === selectedOption) {
                utterThis.voice = voice;
            }
        });

        utterThis.pitch = 1;
        utterThis.rate = 1;
        
        synth.speak(utterThis);
    }
});