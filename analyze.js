export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { trackName, genre } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192", // Using Llama 3 70B for high quality
                messages: [
                    {
                        role: "system",
                        content: `You are a world-class mixing and mastering engineer (like Dave Pensado or Bob Katz) operating a futuristic AI Analyzer named 'DES ANALYZER'. 
                        
                        Your task is to analyze the metadata of a user-uploaded track (Name, Genre context) and provide 3 specific, high-level technical tips for that style.
                        
                        Output MUST be a valid JSON object with exactly these keys:
                        {
                            "tonal": ["Tip 1 about EQ/Balance", "Tip 2 about Frequency"],
                            "dynamic": ["Tip 1 about Compression", "Tip 2 about Transient Shaping"],
                            "stereo": ["Tip 1 about Width/Panning", "Tip 2 about Phase"],
                            "verdict": "A brief, 1-sentence professional summary of the track's potential."
                        }
                        
                        Keep the tone futuristic, professional, and encouraging. Avoid generic advice like "use your ears". Be specific to the genre if guessed from the track name.`
                    },
                    {
                        role: "user",
                        content: `Analyze this track: "${trackName}". Genre/Context: ${genre || 'Unknown'}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const aiContent = data.choices[0].message.content;

        // Ensure we parse the JSON correctly from the AI response
        let insights;
        try {
            insights = JSON.parse(aiContent);
        } catch (e) {
            // Fallback if AI didn't return strict JSON (sometimes happens)
            console.error("AI JSON Parse Error", e);
            return res.status(500).json({ error: 'Failed to parse AI signal' });
        }

        return res.status(200).json(insights);

    } catch (error) {
        console.error("Groq API Error:", error);
        return res.status(500).json({ error: 'Analysis transmission failed.' });
    }
}
