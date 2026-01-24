
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();

        console.log("--- Available Gemini Models ---");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`\nName: ${m.name}`);
                console.log(`Display Name: ${m.displayName}`);
                console.log(`Supported Methods: ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log("No models found in response.");
        }

    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

listModels();
