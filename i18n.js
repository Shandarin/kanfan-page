(function () {
    const LANGS = [
        ["zh_CN", "简体中文"],["zh_TW", "繁體中文"],["en", "English"],["ja", "日本語"],["ko", "한국어"],["de", "Deutsch"],["es", "Español"],["fr", "Français"],["it", "Italiano"],["pl", "Polski"],["pt", "Português"],["pt_BR", "Português (Brasil)"],["ru", "Русский"],["th", "ไทย"],["vi", "Tiếng Việt"],["id", "Bahasa Indonesia"],["ar", "العربية"],["hi", "हिन्दी"]
    ];

    const I18N = {
        en: {
            "nav.signin": "Sign In", "nav.install": "Install Extension",
            "home.heroLine1": "Read Manga in", "home.heroLine2": "Your Language", "home.heroDesc": "The smartest AI-powered manga translator extension. Translate raw manga directly in your browser with zero friction.", "home.chromeStore": "Chrome Web Store", "home.edgeAddons": "Edge Add-ons", "home.pricing": "Pricing", "home.perMonth": "/month", "home.install": "Install", "home.popular": "POPULAR", "home.plan.free": "Free", "home.plan.freeFeature": "200 Images Weekly", "home.plan.flex": "Flex", "home.plan.flexF1": "No monthly fees", "home.plan.flexF2": "Pay only for usage", "home.plan.flexF3": "Billed monthly", "home.plan.startFlex": "Start Flex", "home.plan.proFeature": "2,000 Weekly Images", "home.plan.subscribePro": "Subscribe Pro", "home.plan.maxFeature": "Unlimited Images", "home.plan.subscribeMax": "Subscribe Max", "home.feature.ocrTitle": "⚡ Smart OCR", "home.feature.ocrDesc": "High-speed text recognition optimized for manga fonts.", "home.feature.cleanTitle": "🎨 In-paint Cleaning", "home.feature.cleanDesc": "Automatically removes original text and restores art.", "home.feature.langTitle": "🌍 Multi-Language", "home.feature.langDesc": "Instant translation into 20+ other languages.", "home.footer.copyright": "© 2026 Kanfan Project.", "home.footer.contact": "Contact", "home.footer.terms": "Terms", "home.footer.refunds": "Refunds", "home.modal.termsTitle": "Terms", "home.modal.termsBody": "User agreement text...", "home.modal.refundTitle": "Refund Policy", "home.modal.refundBody": "Refund policy text...",
            "login.title": "Welcome Back", "login.subtitle": "Sign in to manage your subscription", "login.google": "Continue with Google", "login.or": "or", "login.email": "Email", "login.password": "Password", "login.submitIn": "Sign In", "login.submitUp": "Sign Up", "login.noAccount": "Don't have an account?", "login.haveAccount": "Already have an account?", "login.create": "Create one", "login.forgot": "Forgot Password?", "login.successTitle": "Successfully Signed In", "login.successDesc": "You have successfully logged in. Your extension is now synced.", "login.successTip": "You can verify your status in the extension popup.", "login.close": "Close Window",
            "account.title": "Account Settings", "account.signout": "Sign Out", "account.profile": "Profile", "account.profileDesc": "Manage your login information", "account.email": "Email", "account.password": "Password", "account.change": "Change", "account.billing": "Subscription & Billing", "account.billingDesc": "Manage your plan, payment methods, and invoices via Stripe", "account.billingHint": "You will be redirected to our secure billing portal hosted by Stripe.", "account.manage": "Manage Subscription", "account.syncTitle": "Extension Connected", "account.syncDesc": "Your account is now synced with the Kanfan browser extension.",
            "reset.verifying": "Verifying link...", "reset.title": "Reset Password", "reset.subtitle": "Enter your new password below.", "reset.new": "New Password", "reset.confirm": "Confirm Password", "reset.pwPlaceholder": "At least 6 characters", "reset.pw2Placeholder": "Confirm new password", "reset.update": "Update Password", "reset.updating": "Updating...", "reset.doneTitle": "Password Updated", "reset.doneDesc": "You can now close this page and log in with your new password.", "reset.gotoLogin": "Go to Login",
            "pay.successTitle": "Payment Successful!", "pay.successDesc": "Thank you for supporting Kanfan. Your account has been upgraded.", "pay.cancelTitle": "Payment Cancelled", "pay.cancelDesc": "No charges were made. If you encountered an error or have questions about our plans, feel free to contact us.", "pay.returnHome": "Return Home",
            "uninstall.title": "We're sorry to see you go", "uninstall.desc": "Could you tell us why you uninstalled Kanfan?", "uninstall.reason.performance": "Too slow", "uninstall.reason.pricing": "Too expensive", "uninstall.reason.translation": "Translation quality", "uninstall.reason.ocr_accuracy": "Image recognition accuracy", "uninstall.reason.display_quality": "Display quality", "uninstall.reason.missing_feature": "Missing features", "uninstall.reason.site_not_supported": "Some websites are not supported", "uninstall.reason.alternative": "Found an alternative", "uninstall.reason.bug": "Bug", "uninstall.reason.not_needed": "No longer needed", "uninstall.reason.other": "Other", "uninstall.commentPlaceholder": "How can we make it better?", "uninstall.submit": "Submit feedback", "uninstall.success": "Thank you! You can safely close this tab.", "uninstall.error": "Failed to submit. Please try again later."
        },
        zh_CN: {
            "nav.signin": "登录", "nav.install": "安装扩展",
            "home.heroLine1": "阅读漫画，", "home.heroLine2": "用你的语言", "home.heroDesc": "最智能的 AI 漫画翻译扩展，直接在浏览器中翻译生肉漫画，丝滑无阻。", "home.chromeStore": "Chrome 商店", "home.edgeAddons": "Edge 插件", "home.pricing": "价格", "home.perMonth": "/月", "home.install": "安装", "home.popular": "热门", "home.plan.free": "免费", "home.plan.freeFeature": "每周 200 张图片", "home.plan.flex": "灵活包", "home.plan.flexF1": "无需月费", "home.plan.flexF2": "按量付费", "home.plan.flexF3": "按月结算", "home.plan.startFlex": "开始使用灵活包", "home.plan.proFeature": "每周 2,000 张图片", "home.plan.subscribePro": "订阅 Pro", "home.plan.maxFeature": "无限图片", "home.plan.subscribeMax": "订阅 Max", "home.feature.ocrTitle": "⚡ 智能 OCR", "home.feature.ocrDesc": "针对漫画字体优化的高速文字识别。", "home.feature.cleanTitle": "🎨 智能修复", "home.feature.cleanDesc": "自动去除原文并修复画面。", "home.feature.langTitle": "🌍 多语言", "home.feature.langDesc": "一键翻译为 20+ 种语言。", "home.footer.copyright": "© 2026 Kanfan 项目。", "home.footer.contact": "联系我们", "home.footer.terms": "条款", "home.footer.refunds": "退款", "home.modal.termsTitle": "服务条款", "home.modal.termsBody": "用户协议内容...", "home.modal.refundTitle": "退款政策", "home.modal.refundBody": "退款政策内容...",
            "login.title": "欢迎回来", "login.subtitle": "登录以管理你的订阅", "login.google": "使用 Google 继续", "login.or": "或", "login.email": "邮箱", "login.password": "密码", "login.submitIn": "登录", "login.submitUp": "注册", "login.noAccount": "还没有账号？", "login.haveAccount": "已有账号？", "login.create": "立即创建", "login.forgot": "忘记密码？", "login.successTitle": "登录成功", "login.successDesc": "你已成功登录，扩展账号已同步。", "login.successTip": "你可以在扩展弹窗中查看状态。", "login.close": "关闭窗口",
            "account.title": "账户设置", "account.signout": "退出登录", "account.profile": "个人资料", "account.profileDesc": "管理你的登录信息", "account.email": "邮箱", "account.password": "密码", "account.change": "修改", "account.billing": "订阅与账单", "account.billingDesc": "通过 Stripe 管理套餐、支付方式与账单", "account.billingHint": "你将跳转到 Stripe 托管的安全账单门户。", "account.manage": "管理订阅", "account.syncTitle": "扩展已连接", "account.syncDesc": "你的账户已与 Kanfan 浏览器扩展同步。",
            "reset.verifying": "正在验证链接...", "reset.title": "重置密码", "reset.subtitle": "请输入你的新密码。", "reset.new": "新密码", "reset.confirm": "确认密码", "reset.pwPlaceholder": "至少 6 个字符", "reset.pw2Placeholder": "再次输入新密码", "reset.update": "更新密码", "reset.updating": "更新中...", "reset.doneTitle": "密码已更新", "reset.doneDesc": "现在你可以关闭本页，并使用新密码登录。", "reset.gotoLogin": "前往登录",
            "pay.successTitle": "支付成功！", "pay.successDesc": "感谢你支持 Kanfan。你的账号已升级。", "pay.cancelTitle": "支付已取消", "pay.cancelDesc": "本次未产生扣费。如果遇到错误或对套餐有疑问，欢迎联系我们。", "pay.returnHome": "返回首页",
            "uninstall.title": "很遗憾看到你离开", "uninstall.desc": "可以告诉我们你为什么卸载 Kanfan 吗？", "uninstall.reason.performance": "速度太慢", "uninstall.reason.pricing": "价格太贵", "uninstall.reason.translation": "翻译质量", "uninstall.reason.ocr_accuracy": "图像识别准确率", "uninstall.reason.display_quality": "显示效果", "uninstall.reason.missing_feature": "功能缺失", "uninstall.reason.site_not_supported": "部分网站不支持", "uninstall.reason.alternative": "找到了替代品", "uninstall.reason.bug": "存在 Bug", "uninstall.reason.not_needed": "不再需要", "uninstall.reason.other": "其他", "uninstall.commentPlaceholder": "我们怎样可以做得更好？", "uninstall.submit": "提交反馈", "uninstall.success": "感谢反馈！期待与你再见。", "uninstall.error": "提交失败，请稍后重试。"
        },
        zh_TW: {
            "nav.signin": "登入", "nav.install": "安裝擴充",
            "home.heroLine1": "閱讀漫畫，", "home.heroLine2": "用你的語言", "home.heroDesc": "最聰明的 AI 漫畫翻譯擴充，直接在瀏覽器翻譯生肉漫畫，流暢零阻力。", "home.chromeStore": "Chrome 商店", "home.edgeAddons": "Edge 附加元件", "home.pricing": "價格", "home.perMonth": "/月", "home.install": "安裝", "home.popular": "熱門", "home.plan.free": "免費", "home.plan.freeFeature": "每週 200 張圖片", "home.plan.flex": "彈性包", "home.plan.flexF1": "免月費", "home.plan.flexF2": "按用量付費", "home.plan.flexF3": "每月結算", "home.plan.startFlex": "開始使用彈性包", "home.plan.proFeature": "每週 2,000 張圖片", "home.plan.subscribePro": "訂閱 Pro", "home.plan.maxFeature": "無限圖片", "home.plan.subscribeMax": "訂閱 Max", "home.feature.ocrTitle": "⚡ 智慧 OCR", "home.feature.ocrDesc": "針對漫畫字體優化的高速文字辨識。", "home.feature.cleanTitle": "🎨 智慧修復", "home.feature.cleanDesc": "自動移除原文並修復畫面。", "home.feature.langTitle": "🌍 多語言", "home.feature.langDesc": "即時翻譯成 20+ 種語言。", "home.footer.copyright": "© 2026 Kanfan 專案。", "home.footer.contact": "聯絡我們", "home.footer.terms": "條款", "home.footer.refunds": "退款", "home.modal.termsTitle": "服務條款", "home.modal.termsBody": "使用者協議內容...", "home.modal.refundTitle": "退款政策", "home.modal.refundBody": "退款政策內容...",
            "login.title": "歡迎回來", "login.subtitle": "登入以管理你的訂閱", "login.google": "使用 Google 繼續", "login.or": "或", "login.email": "Email", "login.password": "密碼", "login.submitIn": "登入", "login.submitUp": "註冊", "login.noAccount": "還沒有帳號？", "login.haveAccount": "已有帳號？", "login.create": "立即建立", "login.forgot": "忘記密碼？", "login.successTitle": "登入成功", "login.successDesc": "你已成功登入，擴充套件帳號已同步。", "login.successTip": "你可以在擴充套件彈窗中查看狀態。", "login.close": "關閉視窗", "account.title": "帳戶設定", "account.signout": "登出", "account.profile": "個人資料", "account.profileDesc": "管理你的登入資訊", "account.email": "Email", "account.password": "密碼", "account.change": "修改", "account.billing": "訂閱與帳單", "account.billingDesc": "透過 Stripe 管理方案、付款方式與帳單", "account.billingHint": "你將被導向 Stripe 託管的安全帳單入口。", "account.manage": "管理訂閱", "account.syncTitle": "擴充套件已連線", "account.syncDesc": "你的帳戶已與 Kanfan 瀏覽器擴充套件同步。", "reset.verifying": "正在驗證連結...", "reset.title": "重設密碼", "reset.subtitle": "請輸入你的新密碼。", "reset.new": "新密碼", "reset.confirm": "確認密碼", "reset.pwPlaceholder": "至少 6 個字元", "reset.pw2Placeholder": "再次輸入新密碼", "reset.update": "更新密碼", "reset.updating": "更新中...", "reset.doneTitle": "密碼已更新", "reset.doneDesc": "你現在可以關閉此頁，並使用新密碼登入。", "reset.gotoLogin": "前往登入", "pay.successTitle": "付款成功！", "pay.successDesc": "感謝你支持 Kanfan。你的帳號已升級。", "pay.cancelTitle": "付款已取消", "pay.cancelDesc": "本次未扣款。若你遇到錯誤或對方案有疑問，歡迎聯絡我們。", "pay.returnHome": "返回首頁", "uninstall.title": "很遺憾看到你離開", "uninstall.desc": "可以告訴我們你為什麼解除安裝 Kanfan 嗎？", "uninstall.reason.performance": "速度太慢", "uninstall.reason.pricing": "價格太高", "uninstall.reason.translation": "翻譯品質", "uninstall.reason.ocr_accuracy": "影像辨識準確度", "uninstall.reason.display_quality": "顯示品質", "uninstall.reason.missing_feature": "缺少功能", "uninstall.reason.site_not_supported": "部分網站不支援", "uninstall.reason.alternative": "找到替代方案", "uninstall.reason.bug": "有 Bug", "uninstall.reason.not_needed": "不再需要", "uninstall.reason.other": "其他", "uninstall.commentPlaceholder": "我們可以如何做得更好？", "uninstall.submit": "提交回饋", "uninstall.success": "感謝你的回饋！期待與你再見。", "uninstall.error": "提交失敗，請稍後再試。"
        },

    };

    const SUPPORTED_LANGS = new Set(LANGS.map(([code]) => code));

    function normalizeLang(lang) {
        if (!lang) return '';
        const clean = String(lang).replace('-', '_');
        if (SUPPORTED_LANGS.has(clean)) return clean;
        const lower = clean.toLowerCase();
        const exact = [...SUPPORTED_LANGS].find((code) => code.toLowerCase() === lower);
        return exact || '';
    }

    function getLang() { return normalizeLang(localStorage.getItem('kanfan_lang')) || 'en'; }
    function setLang(lang) {
        const normalized = normalizeLang(lang) || 'en';
        localStorage.setItem('kanfan_lang', normalized);
        return normalized;
    }

    function initLangFromUrl() {
        const urlLang = normalizeLang(new URLSearchParams(window.location.search).get('lang'));
        if (!urlLang) return;
        setLang(urlLang);
    }

    function tr(key) {
        const lang = getLang();
        return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    }

    function apply() {
        document.documentElement.lang = getLang();
        document.querySelectorAll('[data-i18n]').forEach((el)=>{ el.textContent = tr(el.dataset.i18n); });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((el)=>{ el.placeholder = tr(el.dataset.i18nPlaceholder); });
        document.querySelectorAll('[data-i18n-title]').forEach((el)=>{ el.title = tr(el.dataset.i18nTitle); });
    }

    function renderSelect(host) {
        if (!host) return;
        const sel = document.createElement('select');
        sel.className = 'lp-language-select';
        LANGS.forEach(([value, label]) => {
            const opt = document.createElement('option'); opt.value = value; opt.textContent = label; sel.appendChild(opt);
        });
        sel.value = getLang();
        sel.addEventListener('change', () => { setLang(sel.value); apply(); });
        host.appendChild(sel);
    }

    initLangFromUrl();

    window.KanfanI18n = { LANGS, getLang, setLang, t: tr, apply, renderSelect, initLangFromUrl };
})();