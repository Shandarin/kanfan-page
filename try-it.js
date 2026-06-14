(function () {
    const API_ENDPOINT = "https://api.kanfan.site/test";
    const SUPABASE_URL = "https://ikriqgjylpbwqihwpsho.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_xdQsvfTfJEwfNjF5KYvxLA_y4QiKqFo";
    const STORAGE_KEYS = {
        anonToken: "kanfan_web_anon_token",
        uuid: "kanfan_web_uuid",
        deviceFp: "kanfan_web_device_fp",
    };
    const MAX_DIM = 2048;
    const JPEG_QUALITY = 0.92;
    const FIT_MIN_PX = 12;
    const FIT_MAX_PX = 40;
    const FIT_PADDING_PX = 4;
    const BORDER_RADIUS = 12;

    const LANG_TO_SCRIPT = {
        en: "latin", de: "latin", es: "latin", fr: "latin", it: "latin", pl: "latin", pt: "latin", pt_BR: "latin", id: "latin",
        zh_CN: "cjk_sc", zh_TW: "cjk_tc", ja: "cjk_ja", ko: "cjk_ko",
        ru: "cyrillic", th: "thai", ar: "arabic", hi: "devanagari", vi: "vietnamese",
    };
    const SCRIPT_CONFIGS = {
        latin: { scaleFactor: 1.0, lineHeight: 1.1, fontStack: "Inter, Arial, sans-serif" },
        cjk_sc: { scaleFactor: 0.85, lineHeight: 1.48, fontStack: "Noto Sans SC, Microsoft YaHei, sans-serif" },
        cjk_tc: { scaleFactor: 0.85, lineHeight: 1.48, fontStack: "Noto Sans TC, Microsoft JhengHei, sans-serif" },
        cjk_ja: { scaleFactor: 0.85, lineHeight: 1.48, fontStack: "Meiryo, Yu Gothic, sans-serif" },
        cjk_ko: { scaleFactor: 0.88, lineHeight: 1.44, fontStack: "Noto Sans KR, Malgun Gothic, sans-serif" },
        cyrillic: { scaleFactor: 0.85, lineHeight: 1.2, fontStack: "Noto Sans, Arial, sans-serif" },
        thai: { scaleFactor: 0.85, lineHeight: 1.52, fontStack: "Noto Sans Thai, Tahoma, sans-serif" },
        arabic: { scaleFactor: 0.8, lineHeight: 1.3, fontStack: "Noto Sans Arabic, Tahoma, sans-serif" },
        devanagari: { scaleFactor: 0.85, lineHeight: 1.58, fontStack: "Noto Sans, Nirmala UI, sans-serif" },
        vietnamese: { scaleFactor: 0.95, lineHeight: 1.34, fontStack: "Inter, Arial, sans-serif" },
    };

    const state = {
        file: null,
        originalDataUrl: "",
        compressedDataUrl: "",
        rawHash: "",
        renderedDataUrl: "",
        response: null,
        working: false,
    };

    const els = {};
    const t = (key) => window.KanfanI18n?.t?.(key) || key;

    function dataUrlToBlob(dataUrl) {
        const [header, b64 = ""] = String(dataUrl || "").split(",");
        const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function computeSha256HexFromBytes(buffer) {
        const buf = await crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    async function fileToPreparedImage(file) {
        const bytes = await file.arrayBuffer();
        const rawHash = await computeSha256HexFromBytes(bytes);
        const originalDataUrl = await blobToDataUrl(new Blob([bytes], { type: file.type || "image/png" }));
        const compressedDataUrl = await compressDataUrl(originalDataUrl);
        return { originalDataUrl, compressedDataUrl, rawHash };
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Image failed to load"));
            img.src = src;
        });
    }

    async function canvasToBlob(canvas, type, quality) {
        if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
        return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    }

    async function compressDataUrl(dataUrl, { maxDim = MAX_DIM, quality = JPEG_QUALITY } = {}) {
        const blob = dataUrlToBlob(dataUrl);
        const bitmap = await createImageBitmap(blob);
        let sw = bitmap.width;
        let sh = bitmap.height;
        if (Math.min(bitmap.width, bitmap.height) > maxDim) {
            const scale = maxDim / Math.min(bitmap.width, bitmap.height);
            sw = Math.round(bitmap.width * scale);
            sh = Math.round(bitmap.height * scale);
        }

        const canvas = typeof OffscreenCanvas !== "undefined"
            ? new OffscreenCanvas(sw, sh)
            : Object.assign(document.createElement("canvas"), { width: sw, height: sh });
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(bitmap, 0, 0, sw, sh);
        if (bitmap.close) bitmap.close();

        const outBlob = await canvasToBlob(canvas, "image/jpeg", quality);
        if (!outBlob) throw new Error("Image compression failed");
        return blobToDataUrl(outBlob);
    }

    function getOrCreateUuid() {
        let uuid = localStorage.getItem(STORAGE_KEYS.uuid);
        if (!uuid) {
            uuid = crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            localStorage.setItem(STORAGE_KEYS.uuid, uuid);
        }
        return uuid;
    }

    async function getDeviceFingerprint() {
        const cached = localStorage.getItem(STORAGE_KEYS.deviceFp);
        if (cached && cached.length >= 16) return cached;
        try {
            const FingerprintJS = await import("https://openfpcdn.io/fingerprintjs/v4");
            const agent = await FingerprintJS.load();
            const result = await agent.get();
            if (typeof result.visitorId === "string" && result.visitorId.length >= 16) {
                localStorage.setItem(STORAGE_KEYS.deviceFp, result.visitorId);
                return result.visitorId;
            }
        } catch (error) {
            console.warn("[Kanfan] try-it fingerprint failed:", error);
        }
        return null;
    }

    async function getAccessToken() {
        try {
            const client = window.KanfanSupabaseClient
                || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
            const session = await client?.auth?.getSession?.();
            return session?.data?.session?.access_token || null;
        } catch {
            return null;
        }
    }

    async function buildHeaders() {
        const accessToken = await getAccessToken();
        const anonToken = localStorage.getItem(STORAGE_KEYS.anonToken);
        const deviceFp = await getDeviceFingerprint();
        return {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(anonToken ? { "X-Anon-Token": anonToken } : {}),
            ...(deviceFp ? { "X-Device-Fp": deviceFp } : {}),
        };
    }

    function normalizeLangForApi(lang) {
        return String(lang || "zh_CN").replace("-", "_");
    }

    async function translateImage({ image, rawHash, targetLangCode }) {
        const body = {
            action: "translate",
            image,
            rawHash,
            targetLangCode: normalizeLangForApi(targetLangCode),
            sourceUrl: window.location.href,
            mangaTitle: "kanfan-web-try-it",
            uuid: getOrCreateUuid(),
            translationProvider: "openai",
            translationModel: "gpt-4o-mini",
        };
        const res = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: await buildHeaders(),
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.anonToken) localStorage.setItem(STORAGE_KEYS.anonToken, data.anonToken);
        return { ...data, _httpStatus: res.status };
    }

    function parseHexToRgb(hex) {
        let clean = String(hex || "#000").replace(/^#/, "");
        if (clean.length === 3) clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
        const n = Number.parseInt(clean, 16);
        if (!Number.isFinite(n)) return [0, 0, 0];
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function srgbToLinear(c) {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(rgb) {
        return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
    }

    function rgbToHsl(rgb) {
        let [r, g, b] = rgb.map((x) => x / 255);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (max === min) return [0, 0, l];
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h = 0;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
        return [h * 360, s, l];
    }

    function areColorsContrasting(color1, color2) {
        const rgb1 = parseHexToRgb(color1);
        const rgb2 = parseHexToRgb(color2);
        const l1 = relativeLuminance(rgb1);
        const l2 = relativeLuminance(rgb2);
        if ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) >= 2.5) return true;
        const [h1, s1] = rgbToHsl(rgb1);
        const [h2, s2] = rgbToHsl(rgb2);
        if (s1 > 0.15 && s2 > 0.15) {
            const diff = Math.abs(h1 - h2);
            return Math.min(diff, 360 - diff) >= 90;
        }
        return false;
    }

    function getTypographyConfig(tgtLang) {
        const script = LANG_TO_SCRIPT[tgtLang] || "latin";
        return SCRIPT_CONFIGS[script] || SCRIPT_CONFIGS.latin;
    }

    function fitFontSizeForBlock({ w, h, text, fontFamily, vertical = false, minPx = FIT_MIN_PX, maxPx = FIT_MAX_PX, lineHeight = 1.15 }) {
        const box = document.createElement("div");
        Object.assign(box.style, {
            position: "fixed",
            left: "-99999px",
            top: "-99999px",
            width: `${Math.max(1, Math.floor(w - FIT_PADDING_PX * 2))}px`,
            height: `${Math.max(1, Math.floor(h - FIT_PADDING_PX * 2))}px`,
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            hyphens: "auto",
            textAlign: "center",
            fontFamily,
            lineHeight: String(lineHeight),
            writingMode: vertical ? "vertical-rl" : "horizontal-tb",
            textOrientation: vertical ? "upright" : "mixed",
        });
        box.textContent = text || "";
        document.body.appendChild(box);
        let lo = minPx;
        let hi = maxPx;
        let best = minPx;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            box.style.fontSize = `${mid}px`;
            if (box.scrollHeight <= box.clientHeight && box.scrollWidth <= box.clientWidth) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        box.remove();
        return best;
    }

    function drawRoundedRect(ctx, x, y, w, h, radius) {
        const r = Math.min(radius, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function wrapText(ctx, text, maxWidth) {
        const raw = String(text || "").trim();
        const hasSpaces = /\s/.test(raw);
        const words = hasSpaces ? raw.split(/\s+/).filter(Boolean) : Array.from(raw);
        const joiner = hasSpaces ? " " : "";
        const lines = [];
        let line = "";
        if (!words.length) return [String(text || "")];
        const pushBrokenToken = (token) => {
            let chunk = "";
            for (const char of Array.from(token)) {
                const test = chunk ? `${chunk}${char}` : char;
                if (ctx.measureText(test).width <= maxWidth || !chunk) {
                    chunk = test;
                } else {
                    lines.push(chunk);
                    chunk = char;
                }
            }
            return chunk;
        };
        for (const word of words) {
            const test = line ? `${line}${joiner}${word}` : word;
            if (ctx.measureText(test).width <= maxWidth || !line) {
                if (ctx.measureText(test).width <= maxWidth || Array.from(test).length === 1) {
                    line = test;
                } else {
                    line = pushBrokenToken(word);
                }
            } else {
                lines.push(line);
                line = ctx.measureText(word).width <= maxWidth ? word : pushBrokenToken(word);
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    function drawTextBlock(ctx, item, rect, targetLangCode) {
        const typo = getTypographyConfig(targetLangCode);
        const text = item.translatedText || "";
        const vertical = !!item.vertical || item.writingMode === "vertical-rl";
        const dynamicMax = item.fontHeightPx
            ? Math.max(FIT_MIN_PX, Math.min(72, Math.round(item.fontHeightPx)))
            : Math.max(FIT_MIN_PX, Math.min(FIT_MAX_PX, Math.floor(Math.min(rect.w, rect.h) * 0.72)));
        const fontSize = fitFontSizeForBlock({
            w: rect.w,
            h: rect.h,
            text,
            fontFamily: typo.fontStack,
            vertical,
            maxPx: Math.max(FIT_MIN_PX, Math.round(dynamicMax * typo.scaleFactor)),
            lineHeight: typo.lineHeight,
        });
        const fontColor = item.fontColor || "#111827";
        const strokeRaw = item.fontStrokeColor || "#ffffff";
        const strokeColor = areColorsContrasting(fontColor, strokeRaw) ? strokeRaw : "transparent";

        ctx.save();
        ctx.font = `${fontSize}px ${typo.fontStack}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = fontColor;
        ctx.lineWidth = Math.max(2, Math.round(fontSize / 9));
        ctx.strokeStyle = strokeColor;
        const lineHeight = fontSize * typo.lineHeight;

        if (vertical) {
            const chars = Array.from(text);
            const startY = rect.y + (rect.h - (chars.length - 1) * lineHeight) / 2;
            chars.forEach((char, idx) => {
                const x = rect.x + rect.w / 2;
                const y = startY + idx * lineHeight;
                if (strokeColor !== "transparent") ctx.strokeText(char, x, y);
                ctx.fillText(char, x, y);
            });
        } else {
            const lines = wrapText(ctx, text, Math.max(1, rect.w - FIT_PADDING_PX * 2));
            const startY = rect.y + rect.h / 2 - ((lines.length - 1) * lineHeight) / 2;
            lines.forEach((line, idx) => {
                const x = rect.x + rect.w / 2;
                const y = startY + idx * lineHeight;
                if (strokeColor !== "transparent") ctx.strokeText(line, x, y);
                ctx.fillText(line, x, y);
            });
        }
        ctx.restore();
    }

    async function renderTranslatedImage(responseData, baseDataUrl, targetLangCode) {
        const translations = responseData?.images?.[0] || [];
        const baseImg = await loadImage(responseData?.base64_image || baseDataUrl);
        const canvas = document.createElement("canvas");
        const srcW = baseImg.naturalWidth || baseImg.width;
        const srcH = baseImg.naturalHeight || baseImg.height;
        canvas.width = srcW;
        canvas.height = srcH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(baseImg, 0, 0, srcW, srcH);

        for (const item of translations) {
            const minX = Math.round(Number(item.minX) || 0);
            const minY = Math.round(Number(item.minY) || 0);
            const maxX = Math.round(Number(item.maxX) || minX + 1);
            const maxY = Math.round(Number(item.maxY) || minY + 1);
            const rect = { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
            if (item.background) {
                try {
                    const bg = await loadImage(item.background);
                    ctx.drawImage(bg, 0, 0, bg.width || rect.w, bg.height || rect.h, rect.x, rect.y, rect.w, rect.h);
                } catch {
                    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, BORDER_RADIUS);
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                }
            } else {
                drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, BORDER_RADIUS);
                ctx.fillStyle = "#fff";
                ctx.fill();
            }
            drawTextBlock(ctx, item, rect, targetLangCode);
        }

        return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    }

    function setMessage(type, text) {
        if (!els.status) return;
        els.status.className = `try-status ${type || ""}`.trim();
        els.status.textContent = text || "";
        els.status.hidden = !text;
    }

    function setWorking(working) {
        state.working = working;
        if (els.file) els.file.disabled = working;
        if (els.dropzone) els.dropzone.classList.toggle("is-working", working);
        if (els.uploadLabel) {
            els.uploadLabel.textContent = working ? t("try.status.translating") : t("try.dropTitle");
        }
        if (els.submit) {
            els.submit.disabled = working || !state.file;
            els.submit.innerHTML = working ? `<span class="spinner"></span>${t("try.status.translating")}` : t("try.button");
        }
    }

    function formatResetTime(value) {
        if (!value) return "";
        try {
            return new Date(Number(value) * 1000).toLocaleString();
        } catch {
            return "";
        }
    }

    function renderQuota(quota) {
        if (!els.quota) return;
        if (!quota) {
            els.quota.hidden = true;
            els.quota.textContent = "";
            return;
        }
        const reset = formatResetTime(quota.resetAt);
        els.quota.hidden = false;
        els.quota.textContent = `${t("try.quota")}: ${quota.remaining ?? "-"} / ${quota.limit ?? "-"} (${quota.plan || "free"})${reset ? ` - ${t("try.reset")}: ${reset}` : ""}`;
    }

    function setQuotaActions(visible) {
        if (els.actions) els.actions.hidden = !visible;
    }

    function renderTextList(items) {
        if (!els.textList) return;
        els.textList.innerHTML = "";
        const list = Array.isArray(items) ? items : [];
        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "try-text-empty";
            empty.textContent = t("try.noText");
            els.textList.appendChild(empty);
            return;
        }
        list.slice(0, 20).forEach((item) => {
            const row = document.createElement("div");
            row.className = "try-text-row";
            const ocr = document.createElement("span");
            ocr.textContent = item.ocrText || "";
            const translated = document.createElement("strong");
            translated.textContent = item.translatedText || "";
            row.append(ocr, translated);
            els.textList.appendChild(row);
        });
    }

    function showResult(response, renderedDataUrl) {
        const items = response?.data?.images?.[0] || [];
        const hasResultImage = Boolean(renderedDataUrl);
        if (els.resultPanel) els.resultPanel.hidden = !hasResultImage;
        if (els.resultImg) {
            if (hasResultImage) els.resultImg.src = renderedDataUrl;
            else els.resultImg.removeAttribute("src");
            els.resultImg.hidden = !hasResultImage;
        }
        if (els.download) {
            els.download.hidden = !hasResultImage;
            els.download.href = renderedDataUrl || "#";
        }
        renderTextList(items);
        renderQuota(response?.quota);
        if (els.actions) els.actions.hidden = !hasResultImage;
        if (response?.data?.noText || !items.length) setMessage("success", t("try.noText"));
        else setMessage("success", t("try.status.done"));
    }

    function showQuotaError(response) {
        renderQuota(response?.quota);
        setQuotaActions(false);
        setMessage("error", t("try.error.quota"));
        renderTextList([]);
    }

    function showRetryableError(response) {
        setQuotaActions(false);
        const retry = response?.retryAfter ? ` ${t("try.retryAfter")} ${response.retryAfter}s.` : "";
        setMessage("error", `${t("try.error.retryable")}${retry}`);
    }

    function classifyTryItResponse(response) {
        if (response?.error === "WEEKLY_QUOTA_EXCEEDED" || response?.error === "DAILY_QUOTA_EXCEEDED") return "quota";
        if (["CONCURRENT_LIMIT", "IMAGE_IN_FLIGHT", "MAX_PLAN_THROTTLED"].includes(response?.error)) return "retryable";
        if (!response?.success || !response?.data) return "error";
        const items = response.data.images?.[0] || [];
        if (response.data.noText || !items.length) return "no-text";
        return "success";
    }

    function isSupportedFile(file) {
        return !!file && ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    }

    async function handleFile(file) {
        if (!isSupportedFile(file)) {
            state.file = null;
            setMessage("error", t("try.error.file"));
            return false;
        }
        state.file = file;
        const { originalDataUrl, compressedDataUrl, rawHash } = await fileToPreparedImage(file);
        state.originalDataUrl = originalDataUrl;
        state.compressedDataUrl = compressedDataUrl;
        state.rawHash = rawHash;
        if (els.originalImg) {
            els.originalImg.src = originalDataUrl;
            els.originalImg.hidden = false;
        }
        if (els.placeholder) els.placeholder.hidden = true;
        if (els.resultImg) {
            els.resultImg.hidden = true;
            els.resultImg.removeAttribute("src");
        }
        if (els.resultPanel) els.resultPanel.hidden = true;
        if (els.download) els.download.hidden = true;
        renderTextList([]);
        renderQuota(null);
        setQuotaActions(false);
        setMessage("", t("try.status.ready"));
        setWorking(false);
        return true;
    }

    async function runTryIt(event) {
        event?.preventDefault?.();
        if (!state.file || state.working) return;
        setWorking(true);
        setQuotaActions(false);
        setMessage("", t("try.status.translating"));
        try {
            const targetLangCode = els.lang?.value || window.KanfanI18n?.getLang?.() || "zh_CN";
            const response = await translateImage({
                image: state.compressedDataUrl,
                rawHash: state.rawHash,
                targetLangCode,
            });
            state.response = response;
            const responseKind = classifyTryItResponse(response);
            if (responseKind === "quota") {
                showQuotaError(response);
                return;
            }
            if (responseKind === "retryable") {
                showRetryableError(response);
                return;
            }
            if (responseKind === "error") {
                throw new Error(response?.error || t("try.error.generic"));
            }
            const items = response.data.images?.[0] || [];
            const rendered = items.length ? await renderTranslatedImage(response.data, response.data.base64_image || state.compressedDataUrl, targetLangCode) : "";
            state.renderedDataUrl = rendered;
            showResult(response, rendered);
        } catch (error) {
            console.error("[Kanfan] try-it failed:", error);
            setQuotaActions(false);
            setMessage("error", error?.message || t("try.error.generic"));
        } finally {
            setWorking(false);
        }
    }

    async function processSelectedFile(file) {
        if (!file || state.working) return;
        const ready = await handleFile(file);
        if (!ready) return;
        await runTryIt();
    }

    function bindDropzone() {
        if (!els.dropzone) return;
        els.dropzone.addEventListener("dragover", (event) => {
            event.preventDefault();
            els.dropzone.classList.add("dragging");
        });
        els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragging"));
        els.dropzone.addEventListener("drop", (event) => {
            event.preventDefault();
            els.dropzone.classList.remove("dragging");
            const file = event.dataTransfer?.files?.[0];
            if (file) void processSelectedFile(file);
        });
    }

    function initTryIt() {
        const root = document.getElementById("try-it");
        if (!root) return;
        els.root = root;
        els.form = root.querySelector("[data-try-form]");
        els.file = root.querySelector("[data-try-file]");
        els.dropzone = root.querySelector("[data-try-dropzone]");
        els.submit = root.querySelector("[data-try-submit]");
        els.lang = root.querySelector("[data-try-lang]");
        els.status = root.querySelector("[data-try-status]");
        els.quota = root.querySelector("[data-try-quota]");
        els.actions = root.querySelector("[data-try-actions]");
        els.originalImg = root.querySelector("[data-try-original]");
        els.resultImg = root.querySelector("[data-try-result]");
        els.resultPanel = root.querySelector("[data-try-result-panel]");
        els.placeholder = root.querySelector("[data-try-placeholder]");
        els.textList = root.querySelector("[data-try-text-list]");
        els.download = root.querySelector("[data-try-download]");
        els.uploadLabel = root.querySelector("[data-try-upload-label]");

        if (els.lang && window.KanfanI18n) els.lang.value = window.KanfanI18n.getLang();
        els.form?.addEventListener("submit", runTryIt);
        els.file?.addEventListener("change", () => {
            const file = els.file.files?.[0];
            if (file) void processSelectedFile(file);
        });
        bindDropzone();
        setWorking(false);
    }

    window.KanfanTryIt = {
        init: initTryIt,
        _test: {
            buildHeaders,
            translateImage,
            renderTranslatedImage,
            compressDataUrl,
            fileToPreparedImage,
            areColorsContrasting,
            fitFontSizeForBlock,
            wrapText,
            classifyTryItResponse,
            STORAGE_KEYS,
        },
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTryIt, { once: true });
    } else {
        initTryIt();
    }
})();

(function () {
    if (!document.querySelector(".landing-page")) return;

    const SUPABASE_URL = "https://ikriqgjylpbwqihwpsho.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_xdQsvfTfJEwfNjF5KYvxLA_y4QiKqFo";
    const AUTH_API_URL = "https://api.kanfan.site/auth";
    const PLANS = {
        plus: {
            quarterly: { price: "$11.99", unitKey: "home.unit.quarter", equivKey: "home.equiv.plus.quarterly" },
            yearly: { price: "$44.99", unitKey: "home.unit.year", equivKey: "home.equiv.plus.yearly", saveKey: "home.save6" },
            _fallbackPeriod: "quarterly",
        },
        pro: {
            monthly: { price: "$7.99", unitKey: "home.unit.mo", equivKey: "" },
            quarterly: { price: "$22.99", unitKey: "home.unit.quarter", equivKey: "home.equiv.pro.quarterly", equivPrice: "7.66", saveKey: "home.save6" },
            yearly: { price: "$86.99", unitKey: "home.unit.year", equivKey: "home.equiv.pro.yearly", equivPrice: "7.25", saveKey: "home.save10" },
        },
        max: {
            monthly: { price: "$16.99", unitKey: "home.unit.mo", equivKey: "" },
            quarterly: { price: "$47.99", unitKey: "home.unit.quarter", equivKey: "home.equiv.max.quarterly", equivPrice: "16.00", saveKey: "home.save6" },
            yearly: { price: "$177.99", unitKey: "home.unit.year", equivKey: "home.equiv.max.yearly", equivPrice: "14.83", saveKey: "home.save13" },
        },
    };

    const t = (key) => window.KanfanI18n ? window.KanfanI18n.t(key) : key;
    function formatEquivNote(cfg) {
        if (!cfg?.equivKey) return "";
        let note = t(cfg.equivKey);
        if (cfg.equivPrice) {
            const localizedPrice = `$${note.includes(",") ? cfg.equivPrice.replace(".", ",") : cfg.equivPrice}`;
            note = note.replace(/\$\d+[.,]\d{2}/, localizedPrice);
        }
        return note;
    }
    const sb = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (sb) window.KanfanSupabaseClient = sb;

    let selectedPeriod = "monthly";
    let userProfile = null;
    let userSession = null;
    let userTier = "free";
    let userPeriod = null;
    let userCountry = null;

    function broadcastAuthToExtension(session) {
        if (!session) return;
        window.postMessage({
            type: "KANFAN_WEB_AUTH",
            payload: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_in: session.expires_in,
                user: session.user,
            },
        }, "*");
    }

    function parseUserPlan(planStr) {
        if (!planStr) return { tier: "free", period: null };
        const value = String(planStr).toLowerCase();
        let tier = "free";
        if (value.includes("max")) tier = "max";
        else if (value.includes("pro")) tier = "pro";
        else if (value.includes("plus")) tier = "plus";

        let period = null;
        if (value.includes("monthly")) period = "monthly";
        else if (value.includes("quarterly")) period = "quarterly";
        else if (value.includes("yearly") || value.includes("annual")) period = "yearly";
        return { tier, period };
    }

    function getCheckoutCurrency() {
        const lang = window.KanfanI18n?.getLang?.();
        return (lang === "zh_CN" || lang === "zh_TW" || userCountry === "CN") ? "cny" : "usd";
    }

    function setButtonBusy(button, busy) {
        if (!button) return;
        if (busy) {
            button.dataset.originalText = button.textContent;
            button.textContent = t("home.processing");
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
        }
    }

    async function getSession() {
        if (!sb) return null;
        const { data: { session } } = await sb.auth.getSession();
        return session || null;
    }

    async function openStripePortal(button) {
        const session = await getSession();
        if (!session) {
            window.location.href = "login.html";
            return;
        }
        setButtonBusy(button, true);
        try {
            const resp = await fetch(AUTH_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: "createStripePortal", payload: {} }),
            });
            const data = await resp.json();
            if (data.success && data.portal_url) {
                window.location.href = data.portal_url;
                return;
            }
            alert(`Error: ${data.error || "Could not open billing portal"}`);
        } catch (error) {
            console.error("Portal error:", error);
            alert("Network error. Please try again.");
        } finally {
            setButtonBusy(button, false);
        }
    }

    async function handlePlanCheckout(plan, period, button) {
        const session = await getSession();
        if (!session) {
            window.location.href = "login.html";
            return;
        }
        if (userProfile?.subscription_status === "active" && userTier !== "free") {
            await openStripePortal(button);
            return;
        }
        setButtonBusy(button, true);
        try {
            const resp = await fetch(AUTH_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    action: "createStripeCheckout",
                    payload: {
                        tier: plan,
                        period,
                        currency: getCheckoutCurrency(),
                        product_type: "subscription",
                    },
                }),
            });
            const data = await resp.json();
            if (data.success && (data.checkout_url || data.portal_url)) {
                window.location.href = data.checkout_url || data.portal_url;
                return;
            }
            alert(`Error: ${data.error || "Could not init checkout"}`);
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Network error. Please try again.");
        } finally {
            setButtonBusy(button, false);
        }
    }

    function renderCta(container, plan, period, state) {
        container.innerHTML = "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = `lp-plan-cta ${state.className}`;
        button.textContent = t(state.labelKey);
        button.dataset.plan = plan;
        button.dataset.period = period;
        button.dataset.action = state.action;
        if (state.disabled) button.disabled = true;
        container.appendChild(button);
    }

    function renderPricing() {
        const isSubscribed = userProfile?.subscription_status === "active" && userTier !== "free";
        const samePeriod = userPeriod === selectedPeriod;

        ["plus", "pro", "max"].forEach((plan) => {
            const card = document.querySelector(`[data-plan-card="${plan}"]`);
            const cta = document.getElementById(`cta-${plan}`);
            if (!card || !cta) return;

            card.classList.remove("current-plan");
            card.querySelector(".badge-current")?.remove();

            const fallbackPeriod = PLANS[plan]._fallbackPeriod;
            const period = PLANS[plan][selectedPeriod] ? selectedPeriod : fallbackPeriod;
            const cfg = period ? PLANS[plan][period] : null;
            document.getElementById(`price-${plan}`).textContent = cfg?.price || "-";
            document.getElementById(`price-unit-${plan}`).textContent = cfg?.unitKey ? t(cfg.unitKey) : "";
            const note = document.getElementById(`price-note-${plan}`);
            note.innerHTML = formatEquivNote(cfg);
            if (cfg?.saveKey) {
                note.insertAdjacentHTML("beforeend", `${note.textContent ? " " : ""}<span class="lp-save-badge">${t(cfg.saveKey)}</span>`);
            }

            if (!cfg) {
                renderCta(cta, plan, selectedPeriod, { className: "lp-cta-blocked", labelKey: "home.periodNotSupported", action: "none", disabled: true });
                return;
            }
            if (!userSession || !isSubscribed) {
                renderCta(cta, plan, period, { className: "lp-cta-subscribe", labelKey: "home.subscribe", action: "checkout" });
                return;
            }
            if (samePeriod && plan === userTier) {
                card.classList.add("current-plan");
                const badge = document.createElement("span");
                badge.className = "lp-plan-badge badge-current";
                badge.textContent = t("home.currentPlan");
                card.appendChild(badge);
                renderCta(cta, plan, period, { className: "lp-cta-current", labelKey: "home.currentPlan", action: "portal" });
                return;
            }
            renderCta(cta, plan, period, { className: "lp-cta-subscribe", labelKey: "home.managePlan", action: "portal" });
        });
    }

    function bindLanguage() {
        const select = document.querySelector(".lp-nav-language");
        if (!select || !window.KanfanI18n) return;
        select.value = window.KanfanI18n.getLang();
        select.addEventListener("change", () => {
            window.KanfanI18n.setLang(select.value);
            window.KanfanI18n.apply();
            const tryLang = document.querySelector("[data-try-lang]");
            if (tryLang) tryLang.value = select.value;
            renderPricing();
        });
        window.KanfanI18n.apply();
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }

    function bindUi() {
        document.getElementById("period-toggle")?.addEventListener("click", (event) => {
            const button = event.target.closest(".lp-period-toggle-btn");
            if (!button) return;
            selectedPeriod = button.dataset.period;
            document.querySelectorAll(".lp-period-toggle-btn").forEach((item) => item.classList.toggle("active", item === button));
            renderPricing();
        });

        document.addEventListener("click", (event) => {
            const cta = event.target.closest("[data-action]");
            if (cta?.dataset.action === "checkout") handlePlanCheckout(cta.dataset.plan, cta.dataset.period, cta);
            if (cta?.dataset.action === "portal") openStripePortal(cta);

            const openTarget = event.target.closest("[data-modal-open]")?.dataset.modalOpen;
            if (openTarget) openModal(openTarget);
            const closeTarget = event.target.closest("[data-modal-close]")?.dataset.modalClose;
            if (closeTarget) closeModal(closeTarget);
            if (event.target.classList.contains("modal")) closeModal(event.target.id);
        });
    }

    async function detectCountry() {
        try {
            const resp = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
            const data = await resp.json();
            userCountry = data.country_code;
        } catch (error) {
            console.warn("IP geolocation failed:", error);
        }
    }

    async function initAuth() {
        if (!sb) {
            renderPricing();
            return;
        }
        userSession = await getSession();
        if (userSession) {
            broadcastAuthToExtension(userSession);
            const navButton = document.getElementById("nav-login-btn");
            if (navButton) {
                navButton.dataset.i18n = "nav.myAccount";
                navButton.textContent = t("nav.myAccount");
                navButton.href = "account.html";
            }
            try {
                const { data: profile } = await sb
                    .from("profiles")
                    .select("plan, subscription_status, credits, quota_tier")
                    .eq("id", userSession.user.id)
                    .single();
                if (profile) {
                    userProfile = profile;
                    const parsed = parseUserPlan(profile.plan);
                    userTier = parsed.tier;
                    userPeriod = parsed.period;
                    if (profile.subscription_status === "active" && userTier !== "free" && userPeriod) {
                        selectedPeriod = userPeriod;
                        document.querySelectorAll(".lp-period-toggle-btn").forEach((button) => {
                            button.classList.toggle("active", button.dataset.period === selectedPeriod);
                        });
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch profile:", error);
            }
        }
        sb.auth.onAuthStateChange((event, session) => {
            if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) broadcastAuthToExtension(session);
            if (event === "SIGNED_OUT") window.postMessage({ type: "KANFAN_WEB_SIGNED_OUT" }, "*");
        });
        renderPricing();
    }

    bindLanguage();
    bindUi();
    renderPricing();
    detectCountry();
    initAuth();
})();
