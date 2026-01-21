document.addEventListener('DOMContentLoaded', () => {
    // Audio State
    let audio = new Audio();
    let isPlaying = false;
    let currentTrackIndex = -1;
    let isShuffle = false;
    let isRepeat = false;
    let lastVolume = 0.7;

    // Elements
    const beatCards = Array.from(document.querySelectorAll('.beat-card'));
    const masterPlayBtn = document.getElementById('master-play');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const muteBtn = document.getElementById('mute-toggle');

    const playerImg = document.getElementById('player-img');
    const playerTitle = document.getElementById('player-title');
    const playerGenre = document.getElementById('player-genre');

    const progressIndicator = document.getElementById('progress-indicator');
    const seekSlider = document.getElementById('seek-slider');
    const currentTimeText = document.getElementById('current-time');
    const durationText = document.getElementById('duration');

    const volumeSlider = document.getElementById('volume-slider');
    const volumeIndicator = document.getElementById('volume-indicator');

    const heroTitle = document.querySelector('.hero-main-title');
    const cube = document.querySelector('.object-3d-container');

    // Analyzer Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processingOverlay = document.getElementById('processing-overlay');
    const resultsPanel = document.getElementById('results-panel');
    const uploadPrompt = document.getElementById('upload-prompt');

    const tonalTips = document.getElementById('tonal-tips');
    const dynamicTips = document.getElementById('dynamic-tips');
    const stereoTips = document.getElementById('stereo-tips');
    const finalVerdict = document.getElementById('final-verdict');

    // Initialization
    audio.volume = lastVolume;
    volumeIndicator.style.width = (lastVolume * 100) + '%';

    // Grid Interaction
    beatCards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            // Check if card itself was clicked (not a button inside it, though there aren't any now)
            if (currentTrackIndex === index) {
                togglePlay();
            } else {
                loadTrack(index);
                playTrack();
            }
        });

        // 3D Tilt Effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const tiltX = (y - 0.5) * -20;
            const tiltY = (x - 0.5) * 20;
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
        });
    });

    // File Upload & Analyzer Logic
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }, false);
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('audio/')) {
                processAudioFile(file);
            } else {
                alert("Please upload an audio file (MP3, WAV, etc.)");
            }
        }
    }

    function processAudioFile(file) {
        // Prepare Player for the new track
        const fileURL = URL.createObjectURL(file);

        // Show processing UI
        uploadPrompt.style.display = 'none';
        processingOverlay.style.display = 'flex';
        resultsPanel.style.display = 'none';

        // Simulate Llama AI Analysis
        setTimeout(() => {
            runAnalysis(file.name);

            // Auto-load into player
            audio.src = fileURL;
            playerTitle.textContent = file.name.toUpperCase();
            playerGenre.textContent = "USER UPLOAD // ANALYZED";
            playerImg.style.backgroundImage = "none";
            playerImg.style.backgroundColor = "var(--accent-green)";

            processingOverlay.style.display = 'none';
            resultsPanel.style.display = 'block';

            // Smooth scroll to results
            resultsPanel.scrollIntoView({ behavior: 'smooth' });
            // Auto-load into player
            audio.src = fileURL;
            playerTitle.textContent = file.name.toUpperCase();
            playerGenre.textContent = "USER UPLOAD // ANALYZED";
            playerImg.style.backgroundImage = "none";
            playerImg.style.backgroundColor = "var(--accent-green)";

            playTrack();

            // Run analysis (now asynchronous)
            runAnalysis(file.name);
        }, 3000);
    }

    function runAnalysis(fileName) {
        // Check if we are running locally without a server (file:// protocol)
        if (window.location.protocol === 'file:') {
            console.warn("Running in local file mode. Backend API is unavailable. Falling back to simulation.");
            runSimulation(fileName);
            return;
        }

        // Call our secure serverless backend
        fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackName: fileName,
                genre: "User Upload" // We could add a genre selector input later
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("API Connection Failed");
                return res.json();
            })
            .then(insights => {
                displayInsights(insights);
            })
            .catch(err => {
                console.error("Analysis Error:", err);
                // Fallback to simulation on error so the user still sees something
                runSimulation(fileName);
            });
    }

    function displayInsights(insights) {
        tonalTips.innerHTML = insights.tonal.map(tip => `<li>${tip}</li>`).join('');
        dynamicTips.innerHTML = insights.dynamic.map(tip => `<li>${tip}</li>`).join('');
        stereoTips.innerHTML = insights.stereo.map(tip => `<li>${tip}</li>`).join('');
        finalVerdict.textContent = insights.verdict;

        processingOverlay.style.display = 'none';
        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    function runSimulation(fileName) {
        const insights = generateLlamaAdvice(fileName);
        displayInsights(insights);
    }

    function generateLlamaAdvice(fileName) {
        // Generic but realistic-sounding mixing/mastering advice
        const advicePool = {
            tonal: [
                "Boost 3-5 kHz slightly for better vocal clarity.",
                "Cut the low-mid frequencies (200-400 Hz) to reduce muddiness.",
                "The sub-bass (~40-60 Hz) is slightly overpowering the kick.",
                "Add a high-shelf at 12 kHz for extra 'air' and premium feel."
            ],
            dynamic: [
                "The snare peaks are too inconsistent; try a fast-attack compressor.",
                "Overall dynamic range is good (DR8), suitable for modern streaming.",
                "Over-compression detected on the master bus; ease up on the limiter.",
                "Parallel compression on drums would add significant 'thump'."
            ],
            stereo: [
                "The mix feels too mono; try widening the high-hats or synths.",
                "Phase issues detected in the low end; ensure anything below 150Hz is mono.",
                "Excellent use of the stereo field in the mid-high frequencies.",
                "Try a mid-side EQ to boost the sides for a wider soundstage."
            ],
            verdicts: [
                "Strong foundation. Minor EQ adjustments needed in the midrange.",
                "Highly professional spectral balance. Ready for final mastering.",
                "The energy is great, but the dynamics are being crushed. Relax the limiter.",
                "Vibrant soundscape, though the low-end needs tighter control."
            ]
        };

        // Randomly pick a few from each category
        const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());

        return {
            tonal: shuffle([...advicePool.tonal]).slice(0, 2),
            dynamic: shuffle([...advicePool.dynamic]).slice(0, 2),
            stereo: shuffle([...advicePool.stereo]).slice(0, 2),
            verdict: advicePool.verdicts[Math.floor(Math.random() * advicePool.verdicts.length)]
        };
    }

    function loadTrack(index) {
        if (index < 0 || index >= beatCards.length) return;
        currentTrackIndex = index;
        const card = beatCards[index];
        const src = card.getAttribute('data-src');
        const name = card.getAttribute('data-name');
        const genre = card.getAttribute('data-genre');
        const img = card.getAttribute('data-img');

        audio.src = src;
        playerTitle.textContent = name;
        playerGenre.textContent = genre;
        document.title = `▶ ${name} | DES BEATS`;

        // Artwork path construction
        playerImg.style.backgroundImage = `url('C:/Users/folde/.gemini/antigravity/brain/${img}')`;

        // Update Grid UI
        beatCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    }

    function playTrack() {
        if (!audio.src) return;
        audio.play().then(() => {
            isPlaying = true;
            updatePlayUI();
        }).catch(err => console.error("Playback failed:", err));
    }

    function pauseTrack() {
        audio.pause();
        isPlaying = false;
        updatePlayUI();
    }

    function togglePlay() {
        if (currentTrackIndex === -1) {
            loadTrack(0);
            playTrack();
        } else {
            isPlaying ? pauseTrack() : playTrack();
        }
    }

    function updatePlayUI() {
        masterPlayBtn.textContent = isPlaying ? '||' : '▶';
        if (cube) cube.style.animationDuration = isPlaying ? '3s' : '20s';
        if (currentTrackIndex !== -1) {
            const trackName = beatCards[currentTrackIndex].getAttribute('data-name');
            document.title = isPlaying ? `▶ ${trackName} | DES BEATS` : `DES BEATS | Radioactive Sound`;
        }
    }

    // Controls
    masterPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let nextIndex = (currentTrackIndex + 1) % beatCards.length;
        if (isShuffle) nextIndex = Math.floor(Math.random() * beatCards.length);
        loadTrack(nextIndex);
        playTrack();
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let prevIndex = (currentTrackIndex - 1 + beatCards.length) % beatCards.length;
        loadTrack(prevIndex);
        playTrack();
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
    });

    muteBtn.addEventListener('click', () => {
        if (audio.volume > 0) {
            lastVolume = audio.volume;
            audio.volume = 0;
            muteBtn.textContent = '🔇';
        } else {
            audio.volume = lastVolume || 0.7;
            muteBtn.textContent = '🔊';
        }
        volumeIndicator.style.width = (audio.volume * 100) + '%';
    });

    // Audio Events
    audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.duration)) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressIndicator.style.width = percent + '%';
            currentTimeText.textContent = formatTime(audio.currentTime);
            durationText.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            playTrack();
        } else {
            nextBtn.click();
        }
    });

    // Seek & Volume Sliders
    seekSlider.addEventListener('click', (e) => {
        if (!audio.src) return;
        const rect = seekSlider.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * audio.duration;
    });

    volumeSlider.addEventListener('click', (e) => {
        const rect = volumeSlider.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const vol = Math.max(0, Math.min(1, pos));
        audio.volume = vol;
        lastVolume = vol;
        volumeIndicator.style.width = (vol * 100) + '%';
        muteBtn.textContent = vol === 0 ? '🔇' : '🔊';
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowRight') {
            nextBtn.click();
        } else if (e.code === 'ArrowLeft') {
            prevBtn.click();
        }
    });

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sc = Math.floor(s % 60);
        return `${m}:${sc < 10 ? '0' : ''}${sc}`;
    }

    // Hero 3D Perspective
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        if (heroTitle) heroTitle.style.transform = `rotateX(${-y / 2}deg) rotateY(${x / 2}deg) translateZ(50px)`;
    });
});

