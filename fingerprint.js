const EXTENSION_ORIGINS = [
    "chrome-extension://ffjpelbfmecoidnkjapdhpcbeianmkpp",
    "chrome-extension://hjdegcejfgbcikdcgafigaoieicofada",
];
const MESSAGE_TYPE = "KANFAN_FP_RESULT";

function sendToExtension(payload) {
    for (const origin of EXTENSION_ORIGINS) {
        window.parent.postMessage({ type: MESSAGE_TYPE, ...payload }, origin);
    }
}

async function computeFingerprint() {
    if (window.parent === window) {
        return;
    }

    try {
        const FingerprintJS = await import("https://openfpcdn.io/fingerprintjs/v4");
        const agent = await FingerprintJS.load();
        const result = await agent.get();

        if (typeof result.visitorId !== "string" || result.visitorId.length < 16) {
            throw new Error("Fingerprint visitorId is missing");
        }

        sendToExtension({ visitorId: result.visitorId });
    } catch (error) {
        sendToExtension({
            error: error instanceof Error ? error.message : "Fingerprint failed",
        });
    }
}

computeFingerprint();
