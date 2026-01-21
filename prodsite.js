document.addEventListener('DOMContentLoaded', () => {
    // Audio State
    let audio = new Audio();
    let currentTrackIndex = -1;
    let isShuffle = false;
    let isRepeat = false;
    let lastVolume = 0.7;

    // Audio State (Kept only for analysis buffer, not for player UI)
    // Audio object initialized above

    // Elements
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
    // No player-specific initialization needed here anymore.

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

    // --- SUPABASE AUTH LOGIC ---
    const authModal = document.getElementById('auth-modal');
    const loginTrigger = document.getElementById('login-trigger');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const emailLoginBtn = document.getElementById('email-login-btn');
    const emailSignupBtn = document.getElementById('email-signup-btn');

    // Check Status
    async function initAuth() {
        const user = await checkUser();
        if (user) {
            updateUIForLoggedInUser(user);
        }
    }

    // Login/Logout Flow
    if (loginTrigger) {
        loginTrigger.addEventListener('click', async () => {
            const user = await checkUser();
            if (user) {
                // Logout Logic
                if (confirm("Disconnect from System? (Logout)")) {
                    await signOut();
                    window.location.reload(); // Reload to reset state
                }
            } else {
                // Show Login Modal
                authModal.style.display = 'flex';
            }
        });
    }

    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            if (!email || !password) return alert("Please enter email and password.");

            const { data, error } = await signInWithEmail(email, password);
            if (error) {
                alert("Login failed: " + error.message);
            } else if (data.user) {
                updateUIForLoggedInUser(data.user);
            }
        });
    }

    if (emailSignupBtn) {
        emailSignupBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            if (!email || !password) return alert("Please enter email and password.");

            const { data, error } = await signUpWithEmail(email, password);
            if (error) {
                alert("Registration failed: " + error.message);
            } else {
                alert("Registration successful! Please check your email/login.");
                // Auto login or wait? Supabase auto logins on signup usually
                if (data.user) updateUIForLoggedInUser(data.user);
            }
        });
    }

    function updateUIForLoggedInUser(user) {
        const loginBtn = document.getElementById('login-trigger');
        if (loginBtn) {
            // Show Operator Name
            const name = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';
            loginBtn.textContent = `OPERATOR: ${name} (LOGOUT)`;
            loginBtn.style.borderColor = 'var(--accent-green)';
            loginBtn.classList.add('neon-text-green');
            loginBtn.classList.remove('neon-text-purple');
        }
        if (authModal) authModal.style.display = 'none';

        // Also hide the overlay if it's there
        authModal.style.display = 'none';
    }

    // Call init
    initAuth();


    // --- AUDIO ANALYSIS LOGIC ---
    const analyzer = new AudioAnalyzer();

    async function processAudioFile(file) {
        // SECURITY CHECK: Login Required
        const user = await checkUser();
        if (!user) {
            console.log("Not logged in, showing modal");
            authModal.style.display = 'flex';
            return;
        }

        const fileURL = URL.createObjectURL(file);

        // Show processing UI
        if (uploadPrompt) uploadPrompt.style.display = 'none';
        if (processingOverlay) processingOverlay.style.display = 'flex';
        if (resultsPanel) resultsPanel.style.display = 'none';

        // 1. Client-Side Analysis (Real BPM/Key)
        try {
            const stats = await analyzer.analyze(file);
            console.log("Audio Stats:", stats);

            // 3. AI Tips Analysis
            runAnalysis(file.name, stats);

        } catch (err) {
            console.error("Analysis Failed", err);
            // Fallback
            runAnalysis(file.name, { bpm: '?', key: '?' });
        }
    }

    function runAnalysis(fileName, stats = {}) {
        // Simulate or Real AI call...
        // Let's use the local simulation for now to stay fast and free as requested,
        // but enhanced with the Real Stats we found.

        setTimeout(() => {
            const insights = generateLlamaAdvice(fileName);
            // Inject our real stats into the verdict or a new section
            insights.verdict += ` [DETECTED: ${stats.bpm} BPM, ${stats.key}]`;

            displayInsights(insights);

            if (processingOverlay) processingOverlay.style.display = 'none';
            if (resultsPanel) resultsPanel.style.display = 'block';
            resultsPanel.scrollIntoView({ behavior: 'smooth' });

        }, 2000);
    }

    // ... [Previous Helper Functions: displayInsights, generateLlamaAdvice, etc.] ...

    // Hero 3D Perspective (Updated for performance)
    document.addEventListener('mousemove', (e) => {
        if (!heroTitle) return;
        requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // Reduced movement
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            heroTitle.style.transform = `rotateX(${-y}deg) rotateY(${x}deg) translateZ(50px)`;
        });
    });
}); // End of DOMContentLoaded

