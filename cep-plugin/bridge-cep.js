/**
 * NovaCut AI Studio Bridge (CEP)
 * Universal AI Video Editing Automation Bridge for Adobe Premiere Pro.
 * Supports ChatGPT, Google Gemini, xAI Grok, Claude, Cursor & Windsurf.
 * Features English & Persian (فارسی) bilingual interface.
 */

(function() {
    var hasNode = typeof require !== 'undefined';
    var fs = hasNode ? require('fs') : null;
    var child_process = hasNode ? require('child_process') : null;
    var path = hasNode ? require('path') : {
        join: function() { return Array.prototype.slice.call(arguments).join('/'); },
        resolve: function(p) { return p; }
    };
    var os = hasNode ? require('os') : {
        platform: function() { return 'win32'; },
        homedir: function() { return 'C:/Users/User'; },
        tmpdir: function() { return 'C:/Temp'; }
    };

    var EXTENDSCRIPT_COMPAT_HELPERS = [
        'function __mcpEscapeString(value) {',
        '    var text = String(value);',
        '    var backslash = String.fromCharCode(92);',
        '    var out = "";',
        '    for (var i = 0; i < text.length; i++) {',
        '        var code = text.charCodeAt(i);',
        '        if (code === 34) { out += backslash + String.fromCharCode(34); }',
        '        else if (code === 92) { out += backslash + backslash; }',
        '        else if (code === 8) { out += backslash + "b"; }',
        '        else if (code === 9) { out += backslash + "t"; }',
        '        else if (code === 10) { out += backslash + "n"; }',
        '        else if (code === 12) { out += backslash + "f"; }',
        '        else if (code === 13) { out += backslash + "r"; }',
        '        else if (code < 32 || code === 0x2028 || code === 0x2029) {',
        '            var hex = code.toString(16);',
        '            while (hex.length < 4) { hex = "0" + hex; }',
        '            out += backslash + "u" + hex;',
        '        }',
        '        else { out += text.charAt(i); }',
        '    }',
        '    return out;',
        '}',
        'var __mcpOwnProperty = Object.prototype.hasOwnProperty;',
        'function __mcpStringify(value) {',
        '    if (value === null) return "null";',
        '    var valueType = typeof value;',
        '    if (valueType === "string") return "\\"" + __mcpEscapeString(value) + "\\"";',
        '    if (valueType === "number") return isFinite(value) ? String(value) : "null";',
        '    if (valueType === "boolean") return value ? "true" : "false";',
        '    if (value instanceof Array) {',
        '        var arrayParts = [];',
        '        for (var i = 0; i < value.length; i++) {',
        '            arrayParts.push(__mcpStringify(value[i]));',
        '        }',
        '        return "[" + arrayParts.join(",") + "]";',
        '    }',
        '    if (valueType === "object") {',
        '        var objectParts = [];',
        '        for (var key in value) {',
        '            var isOwn = true;',
        '            try { isOwn = __mcpOwnProperty.call(value, key); } catch (ownError) { isOwn = true; }',
        '            if (!isOwn) continue;',
        '            var member;',
        '            try { member = value[key]; } catch (readError) { continue; }',
        '            if (typeof member === "undefined" || typeof member === "function") continue;',
        '            objectParts.push(__mcpStringify(String(key)) + ":" + __mcpStringify(member));',
        '        }',
        '        return "{" + objectParts.join(",") + "}";',
        '    }',
        '    return "null";',
        '}',
        'if (typeof JSON === "undefined") { JSON = {}; }',
        'JSON.stringify = __mcpStringify;',
        'function __mcpParse(text) {',
        '  var source = String(text);',
        '  var at = 0;',
        '  function fail(what) {',
        '    throw new Error("JSON.parse: " + what + " at position " + at);',
        '  }',
        '  function skipWhitespace() {',
        '    while (at < source.length) {',
        '      var code = source.charCodeAt(at);',
        '      if (code === 32 || code === 9 || code === 10 || code === 13) { at++; } else { break; }',
        '    }',
        '  }',
        '  function expect(code) {',
        '    if (source.charCodeAt(at) !== code) fail("expected character " + code);',
        '    at++;',
        '  }',
        '  function parseString() {',
        '    expect(34);',
        '    var out = "";',
        '    while (at < source.length) {',
        '      var code = source.charCodeAt(at);',
        '      if (code === 34) { at++; return out; }',
        '      if (code === 92) {',
        '        at++;',
        '        var esc = source.charCodeAt(at);',
        '        at++;',
        '        if (esc === 34) { out += String.fromCharCode(34); }',
        '        else if (esc === 92) { out += String.fromCharCode(92); }',
        '        else if (esc === 47) { out += "/"; }',
        '        else if (esc === 98) { out += "\\b"; }',
        '        else if (esc === 102) { out += "\\f"; }',
        '        else if (esc === 110) { out += "\\n"; }',
        '        else if (esc === 114) { out += "\\r"; }',
        '        else if (esc === 116) { out += "\\t"; }',
        '        else if (esc === 117) {',
        '          var hexStr = source.substring(at, at + 4);',
        '          if (!/^[0-9a-fA-F]{4}$/.test(hexStr)) fail("malformed unicode escape");',
        '          out += String.fromCharCode(parseInt(hexStr, 16));',
        '          at += 4;',
        '        }',
        '        else { fail("illegal escape character: " + esc); }',
        '      } else {',
        '        out += source.charAt(at);',
        '        at++;',
        '      }',
        '    }',
        '    fail("unterminated string");',
        '  }',
        '  function parseNumber() {',
        '    var start = at;',
        '    if (source.charCodeAt(at) === 45) at++;',
        '    while (at < source.length) {',
        '      var c = source.charCodeAt(at);',
        '      if ((c >= 48 && c <= 57) || c === 46 || c === 101 || c === 69 || c === 43 || c === 45) { at++; } else { break; }',
        '    }',
        '    var num = Number(source.substring(start, at));',
        '    if (isNaN(num)) fail("invalid number: " + source.substring(start, at));',
        '    return num;',
        '  }',
        '  function parseWord() {',
        '    if (source.substring(at, at + 4) === "true") { at += 4; return true; }',
        '    if (source.substring(at, at + 5) === "false") { at += 5; return false; }',
        '    if (source.substring(at, at + 4) === "null") { at += 4; return null; }',
        '    fail("unexpected token: " + source.substring(at, at + 10));',
        '  }',
        '  function parseValue() {',
        '    skipWhitespace();',
        '    if (at >= source.length) fail("unexpected end of input");',
        '    var code = source.charCodeAt(at);',
        '    if (code === 34) return parseString();',
        '    if (code === 123) {',
        '      at++;',
        '      var object = {};',
        '      skipWhitespace();',
        '      if (source.charCodeAt(at) === 125) { at++; return object; }',
        '      for (;;) {',
        '        skipWhitespace();',
        '        var key = parseString();',
        '        skipWhitespace();',
        '        expect(58);',
        '        var member = parseValue();',
        '        if (key === "__proto__") {',
        '          if (typeof Object.defineProperty === "function") {',
        '            try { Object.defineProperty(object, key, { value: member, enumerable: true, writable: true, configurable: true }); } catch (e) {}',
        '          }',
        '        } else {',
        '          object[key] = member;',
        '        }',
        '        skipWhitespace();',
        '        if (source.charCodeAt(at) === 44) { at++; continue; }',
        '        expect(125);',
        '        return object;',
        '      }',
        '    }',
        '    if (code === 91) {',
        '      at++;',
        '      var array = [];',
        '      skipWhitespace();',
        '      if (source.charCodeAt(at) === 93) { at++; return array; }',
        '      for (;;) {',
        '        array.push(parseValue());',
        '        skipWhitespace();',
        '        if (source.charCodeAt(at) === 44) { at++; continue; }',
        '        expect(93);',
        '        return array;',
        '      }',
        '    }',
        '    if (code === 45 || (code >= 48 && code <= 57)) return parseNumber();',
        '    return parseWord();',
        '  }',
        '  var result = parseValue();',
        '  skipWhitespace();',
        '  if (at < source.length) fail("unexpected trailing content");',
        '  return result;',
        '}',
        'JSON.parse = __mcpParse;'
    ].join('\n');

    var I18N = {
        fa: {
            title: "NovaCut AI Studio",
            langLabel: "English",
            langFlag: "🇬🇧",
            connected: "بریج فعال و متصل است",
            disconnected: "بریج متوقف است",
            premiereReady: "پریمیر پرو: متصل و آماده",
            premiereWaiting: "پریمیر پرو: در انتظار ارتباط",
            hostMetric: "نسخه پریمیر",
            projectMetric: "پروژه فعال",
            hostDetecting: "در حال بررسی...",
            noProject: "پروژه‌ای باز نیست",
            tabDashboard: "میز کار",
            tabAi: "هوش مصنوعی",
            tabQueue: "صف فرامین",
            tabConsole: "کنسول",
            tabSettings: "تنظیمات",
            controlsTitle: "کنترل‌های ارتباطی بریج",
            startBtn: "شروع بریج",
            stopBtn: "توقف بریج",
            pingBtn: "تست اتصال",
            diagBtn: "عیب‌یابی هوشمند",
            recentTitle: "آخرین وضعیت زنده",
            clearBtn: "پاک‌سازی",
            emptyQueue: "دستوری در صف قرار ندارد",
            queueTitle: "صف دستورات دریافتی",
            consoleTitle: "کنسول لاگ زنده سیستم",
            settingsTitle: "تنظیمات و پیکربندی بریج",
            tempDirLabel: "مسیر تبادل فرامین (Temp Directory)",
            toolsetLabel: "پروفایل ابزارهای هوش مصنوعی (AI Toolset)",
            telemetryLabel: "ارسال ناشناس گزارش خطاها و سلامت عملکرد جهت بهبود عملکرد افزونه",
            saveConfigBtn: "ذخیره تنظیمات",
            copied: "کپی شد!",
            copyConfig: "کپی کانفیگ",
            aiTitle: "راهنمای اتصال مدل‌های هوش مصنوعی",
            aiSubtitle: "کانفیگ مربوط به کلاینت خود را کپی کنید و در تنظیمات MCP آن قرار دهید:",
            updateTitle: "وضعیت و به‌روزرسانی (Updates)",
            updateDesc: "بررسی انتشار نسخه‌های جدیدتر و ارتقای ۱-کلیکه از مخزن رسمی گیت‌هاب:",
            checkUpdatesBtn: "بررسی نسخه جدید",
            doUpdateBtn: "آپدیت ۱-کلیکه",
            checkingUpdates: "در حال بررسی گیت‌هاب...",
            upToDate: "✓ شما از آخرین نسخه نوواکات استفاده می‌کنید (v2.0.0)",
            updateAvailable: "🚀 نسخه جدید در دسترس است! روی آپدیت ۱-کلیکه بزنید.",
            startingUpdate: "در حال اجرای پروسه به‌روزرسانی..."
        },
        en: {
            title: "NovaCut AI Studio",
            langLabel: "فارسی",
            langFlag: "🇮🇷",
            connected: "Bridge Connected & Ready",
            disconnected: "Bridge Stopped",
            premiereReady: "Premiere Pro: Ready",
            premiereWaiting: "Premiere Pro: Waiting",
            hostMetric: "Premiere Host",
            projectMetric: "Active Project",
            hostDetecting: "Detecting...",
            noProject: "No project open",
            tabDashboard: "Dashboard",
            tabAi: "AI Models",
            tabQueue: "Command Queue",
            tabConsole: "Console",
            tabSettings: "Settings",
            controlsTitle: "Bridge Link Controls",
            startBtn: "Start Bridge",
            stopBtn: "Stop Bridge",
            pingBtn: "Test Link",
            diagBtn: "Smart Diagnostics",
            recentTitle: "Live Activity Status",
            clearBtn: "Clear",
            emptyQueue: "No pending commands",
            queueTitle: "Incoming Command Queue",
            consoleTitle: "Live System Console",
            settingsTitle: "Bridge Settings & Config",
            tempDirLabel: "Command Exchange Path (Temp Directory)",
            toolsetLabel: "AI Toolset Profile (Standard/Full/Search)",
            telemetryLabel: "Share anonymous diagnostic health data to improve stability",
            saveConfigBtn: "Save Settings",
            copied: "Copied!",
            copyConfig: "Copy Config",
            aiTitle: "AI Assistants Connection Guide",
            aiSubtitle: "Copy the configuration for your client and paste it into its MCP configuration:",
            updateTitle: "Updates & Release Status",
            updateDesc: "Check for newer releases and 1-click update from official GitHub repository:",
            checkUpdatesBtn: "Check for Updates",
            doUpdateBtn: "1-Click Update",
            checkingUpdates: "Checking GitHub...",
            upToDate: "✓ NovaCut AI Studio is up to date (v2.0.0)",
            updateAvailable: "🚀 A new version is available! Click 1-Click Update.",
            startingUpdate: "Starting update process in a new window..."
        }
    };

    function getDefaultTempPath() {
        if (typeof process !== 'undefined' && process.env && process.env.PREMIERE_TEMP_DIR) {
            return sanitizeTempDirectoryInput(process.env.PREMIERE_TEMP_DIR);
        }
        var base = (os.platform() === 'win32') ? ((typeof process !== 'undefined' && process.env && (process.env.TEMP || process.env.TMP)) || 'C:\\Temp') : '/tmp';
        return path.join(base, 'novacut-bridge');
    }

    function getPanelConfigPath() {
        var configDir = path.join(os.homedir(), '.novacut-bridge');
        if (fs && !fs.existsSync(configDir)) {
            try { fs.mkdirSync(configDir, { recursive: true }); } catch (e) {}
        }
        return path.join(configDir, 'config.json');
    }

    function readExistingPanelConfig() {
        if (!fs) return {};
        try {
            var configPath = getPanelConfigPath();
            if (!fs.existsSync(configPath)) {
                var oldPath = path.join(os.homedir(), '.premiere-mcp-bridge', 'config.json');
                if (fs.existsSync(oldPath)) configPath = oldPath;
            }
            if (!fs.existsSync(configPath)) return {};
            var parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {}
        return {};
    }

    function ensureDirectory(dirPath) {
        if (!dirPath) return null;
        if (!fs) return dirPath;
        var resolvedPath = path.resolve(dirPath);
        if (!fs.existsSync(resolvedPath)) {
            fs.mkdirSync(resolvedPath, { recursive: true });
        }
        return resolvedPath;
    }

    function sanitizeTempDirectoryInput(value) {
        if (!value || typeof value !== 'string') return '';
        var trimmed = value.trim();
        return trimmed.replace(/^["']|["']$/g, '');
    }

    function NovaCutBridge() {
        this.isConnected = false;
        this.tempDirectory = '';
        this.commandQueue = [];
        this.isProcessing = false;
        this.evalScriptBusy = false;
        this.evalScriptQueue = [];
        this.lastScriptOkAt = 0;
        this.telemetryEnabled = true;
        this.currentLang = 'fa';
        this.toolsetMode = 'standard';
        this.csInterface = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;
        this.init();
    }

    NovaCutBridge.prototype.init = function() {
        this.log('NovaCut AI Studio Initializing...', 'info');

        // Restore language preference
        try {
            var savedLang = localStorage.getItem('novacut_lang');
            if (savedLang === 'en' || savedLang === 'fa') {
                this.currentLang = savedLang;
            }
        } catch (e) {}

        this.applyLanguage();
        this.loadConfig();
        this.updateUI();
        this.populateAiSnippets();
        this.startCommandPolling();
        this.startBridge();
        this.detectHostAndProject();
    };

    NovaCutBridge.prototype.applyLanguage = function() {
        var t = I18N[this.currentLang] || I18N.fa;
        document.documentElement.dir = (this.currentLang === 'fa') ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;

        var setElemText = function(id, text) {
            var el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setElemText('txtTitle', t.title);
        setElemText('langFlag', t.langFlag);
        setElemText('langLabel', t.langLabel);
        setElemText('txtHostMetric', t.hostMetric);
        setElemText('txtProjectMetric', t.projectMetric);
        setElemText('tabBtnDashboard', t.tabDashboard);
        setElemText('tabBtnAi', t.tabAi);
        setElemText('tabBtnQueue', t.tabQueue);
        setElemText('tabBtnConsole', t.tabConsole);
        setElemText('tabBtnSettings', t.tabSettings);
        setElemText('txtControlsTitle', t.controlsTitle);
        setElemText('lblStart', t.startBtn);
        setElemText('lblStop', t.stopBtn);
        setElemText('lblPing', t.pingBtn);
        setElemText('lblDiag', t.diagBtn);
        setElemText('txtRecentTaskTitle', t.recentTitle);
        setElemText('clearButton', t.clearBtn);
        setElemText('txtEmptyQueue', t.emptyQueue);
        setElemText('txtQueueTitle', t.queueTitle);
        setElemText('txtConsoleTitle', t.consoleTitle);
        setElemText('txtSettingsTitle', t.settingsTitle);
        setElemText('lblTempDir', t.tempDirLabel);
        setElemText('lblToolset', t.toolsetLabel);
        setElemText('lblTelemetry', t.telemetryLabel);
        setElemText('lblSaveConfig', t.saveConfigBtn);
        setElemText('txtAiTitle', t.aiTitle);
        setElemText('txtAiSubtitle', t.aiSubtitle);
        setElemText('txtUpdateTitle', t.updateTitle);
        setElemText('txtUpdateStatusDesc', t.updateDesc);
        setElemText('lblCheckUpdates', t.checkUpdatesBtn);
        setElemText('lblDoUpdate', t.doUpdateBtn);

        this.updateUI();
    };

    NovaCutBridge.prototype.toggleLanguage = function() {
        this.currentLang = (this.currentLang === 'fa') ? 'en' : 'fa';
        try { localStorage.setItem('novacut_lang', this.currentLang); } catch (e) {}
        this.applyLanguage();
        this.log(this.currentLang === 'fa' ? 'زبان به فارسی تغییر یافت.' : 'Language changed to English.', 'info');
    };

    NovaCutBridge.prototype.getTempDirectory = function() {
        var targetPath = this.tempDirectory || getDefaultTempPath();
        try {
            this.tempDirectory = ensureDirectory(targetPath);
            return this.tempDirectory;
        } catch (e) {
            this.log('Error creating temp directory: ' + e.message, 'error');
            return null;
        }
    };

    NovaCutBridge.prototype.populateAiSnippets = function() {
        var tempDir = this.getTempDirectory() || getDefaultTempPath();
        var nodeBin = (os.platform() === 'win32') ? 'node.exe' : 'node';

        var baseSnippet = {
            mcpServers: {
                "novacut-premiere": {
                    command: nodeBin,
                    args: ["<path-to-repo>/dist/index.js"],
                    env: {
                        PREMIERE_TEMP_DIR: tempDir,
                        NOVACUT_TOOLSET: this.toolsetMode || "standard"
                    }
                }
            }
        };

        var jsonStr = JSON.stringify(baseSnippet, null, 2);

        var fillSnippet = function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = jsonStr;
        };

        fillSnippet('code-chatgpt');
        fillSnippet('code-gemini');
        fillSnippet('code-grok');
        fillSnippet('code-claude');
        fillSnippet('code-cursor');
    };

    NovaCutBridge.prototype.copySnippet = function(client) {
        var el = document.getElementById('code-' + client);
        if (!el) return;
        var text = el.textContent || '';
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                this.log('Config copied for ' + client, 'info');
                return;
            }
        } catch (e) {}

        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.log('Config copied for ' + client, 'info');
    };

    NovaCutBridge.prototype.detectHostAndProject = function() {
        var self = this;
        if (!this.csInterface) return;

        try {
            var hostEnv = this.csInterface.getHostEnvironment();
            if (hostEnv) {
                var env = (typeof hostEnv === 'string') ? JSON.parse(hostEnv) : hostEnv;
                var hostVersionEl = document.getElementById('valHostVersion');
                if (hostVersionEl && env.appVersion) {
                    hostVersionEl.textContent = 'v' + env.appVersion + ' (' + (env.appName || 'Premiere') + ')';
                }
            }
        } catch (e) {}

        this.executeExtendScript(
            '(function(){ try { return app.project && app.project.name ? app.project.name : ""; } catch(e){ return ""; } })()',
            function(err, res) {
                var projectEl = document.getElementById('valProjectName');
                if (projectEl) {
                    projectEl.textContent = (res && String(res).trim()) ? String(res).trim() : (I18N[self.currentLang].noProject);
                }
            }
        );
    };

    NovaCutBridge.prototype.watchDirectory = function(dirPath) {
        if (!fs) return;
        try {
            var watchedPath = ensureDirectory(dirPath);
            var files = fs.readdirSync(watchedPath);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.indexOf('command-') === 0 && file.indexOf('.json') === file.length - 5) {
                    this.processCommandFile(path.join(watchedPath, file));
                    return;
                }
            }
        } catch (e) {
            this.log('Directory read error: ' + e.message, 'error');
        }
    };

    NovaCutBridge.prototype.writeResponseAtomic = function(responseFile, payload) {
        var staging = responseFile + '.part';
        fs.writeFileSync(staging, JSON.stringify(payload, null, 2));
        fs.renameSync(staging, responseFile);
    };

    NovaCutBridge.prototype.processCommandFile = function(filePath) {
        var self = this;
        try {
            var fileContent = fs.readFileSync(filePath, 'utf8');
            var command = JSON.parse(fileContent);
            this.log('Running: ' + command.id, 'info');
            this.addToQueue(command);
            this.isProcessing = true;

            this.executeCommand(command, function(result) {
                var responseFile = filePath.replace('command-', 'response-');
                try {
                    self.writeResponseAtomic(responseFile, result);
                    try { fs.unlinkSync(filePath); } catch (eUnlink) {}
                    self.log('Done: ' + command.id, 'info');
                    self.updateCommandStatus(command.id, 'completed');
                } catch (e) {
                    self.log('Response write error: ' + e.message, 'error');
                }
            });
        } catch (e) {
            this.log('Command read error: ' + e.message, 'error');
            this.isProcessing = false;
        }
    };

    NovaCutBridge.prototype.executeCommand = function(command, done) {
        this.updateCommandStatus(command.id, 'executing');
        this.executeExtendScript(command.script, function(err, result) {
            if (err) {
                done({ success: false, error: err.message });
                return;
            }
            done({ success: true, result: result, timestamp: new Date().toISOString() });
        }, command.timeoutMs);
    };

    NovaCutBridge.prototype.ensureEvalScriptQueue = function() {
        if (!this.evalScriptQueue) this.evalScriptQueue = [];
        if (typeof this.evalScriptBusy !== 'boolean') this.evalScriptBusy = false;
    };

    NovaCutBridge.prototype.releaseEvalScript = function() {
        this.evalScriptBusy = false;
        this.isProcessing = false;
        this.pumpEvalScript();
    };

    NovaCutBridge.prototype.pumpEvalScript = function() {
        this.ensureEvalScriptQueue();
        if (this.evalScriptBusy || this.evalScriptQueue.length === 0) return;
        this.evalScriptBusy = true;
        var job = this.evalScriptQueue.shift();
        this.runEvalScriptJob(job);
    };

    NovaCutBridge.prototype.executeExtendScript = function(script, callback, requestedTimeoutMs) {
        this.ensureEvalScriptQueue();
        this.evalScriptQueue.push({
            script: script,
            callback: callback,
            requestedTimeoutMs: requestedTimeoutMs
        });
        this.pumpEvalScript();
    };

    NovaCutBridge.prototype.runEvalScriptJob = function(job) {
        var self = this;
        var callback = job.callback;
        var requestedTimeoutMs = job.requestedTimeoutMs;

        try {
            if (!this.csInterface) {
                callback(new Error('CSInterface unavailable.'));
                this.releaseEvalScript();
                return;
            }

            var fullScript = EXTENDSCRIPT_COMPAT_HELPERS + '\n' + job.script;
            var waiterSettled = false;
            var nativeSettled = false;
            var timeoutMs = (typeof requestedTimeoutMs === 'number' && requestedTimeoutMs > 45000) ? requestedTimeoutMs : 45000;

            function notifyWaiter(err, result) {
                if (waiterSettled) return;
                waiterSettled = true;
                callback(err, result);
            }

            function releaseAfterNative() {
                if (nativeSettled) return;
                nativeSettled = true;
                self.releaseEvalScript();
            }

            var timeoutId = setTimeout(function() {
                notifyWaiter(new Error('ExtendScript execution timed out after ' + timeoutMs + 'ms.'));
            }, timeoutMs);

            this.csInterface.evalScript(fullScript, function(result) {
                self.lastScriptOkAt = Date.now();
                clearTimeout(timeoutId);
                setTimeout(function() {
                    if (!waiterSettled) {
                        if (result === 'EvalScript error.' || result === 'EvalScript error') {
                            notifyWaiter(new Error('ExtendScript evaluation failed via CSInterface.'));
                        } else if (typeof result === 'string' && result.indexOf('Error') === 0) {
                            notifyWaiter(new Error(result));
                        } else {
                            try {
                                notifyWaiter(null, JSON.parse(result));
                            } catch (e) {
                                notifyWaiter(null, result);
                            }
                        }
                    }
                    releaseAfterNative();
                }, 0);
            });
        } catch (e) {
            callback(e);
            this.releaseEvalScript();
        }
    };

    NovaCutBridge.prototype.writeHeartbeat = function() {
        if (!fs) return;
        try {
            var tempPath = this.getTempDirectory();
            if (!tempPath) return;
            fs.writeFileSync(path.join(tempPath, 'bridge-heartbeat.json'), JSON.stringify({
                t: Date.now(),
                started: !!this.isConnected,
                scriptOkAt: this.lastScriptOkAt || null
            }));
        } catch (e) {}
    };

    NovaCutBridge.prototype.pingHost = function() {
        var self = this;
        if (this.evalScriptBusy || !this.isConnected || !this.csInterface) return;
        this.evalScriptBusy = true;
        this.csInterface.evalScript('app.version', function(result) {
            self.evalScriptBusy = false;
            if (result && result !== 'EvalScript error.' && result !== 'EvalScript error') {
                self.lastScriptOkAt = Date.now();
                self.detectHostAndProject();
            }
        });
    };

    NovaCutBridge.prototype.startCommandPolling = function() {
        var self = this;
        this.lastPingAt = 0;
        setInterval(function() {
            self.writeHeartbeat();
            var now = Date.now();
            if (!self.isProcessing && !self.evalScriptBusy && self.isConnected && now - self.lastPingAt >= 2500) {
                self.lastPingAt = now;
                self.pingHost();
            }
            if (!self.isProcessing && !self.evalScriptBusy && self.isConnected) {
                var tempPath = self.getTempDirectory();
                if (tempPath) self.watchDirectory(tempPath);
            }
        }, 200);
    };

    NovaCutBridge.prototype.addToQueue = function(command) {
        this.commandQueue.push({ id: command.id, status: 'pending', script: (command.script || '').substring(0, 40) + '...' });
        this.updateCommandQueueUI();
    };

    NovaCutBridge.prototype.updateCommandStatus = function(commandId, status) {
        for (var i = 0; i < this.commandQueue.length; i++) {
            if (this.commandQueue[i].id === commandId) {
                this.commandQueue[i].status = status;
                break;
            }
        }
        this.updateCommandQueueUI();
    };

    NovaCutBridge.prototype.updateCommandQueueUI = function() {
        var el = document.getElementById('commandQueue');
        var countEl = document.getElementById('queueCount');
        if (!el) return;
        if (countEl) countEl.textContent = this.commandQueue.length + (this.currentLang === 'fa' ? ' دستور' : ' commands');

        if (this.commandQueue.length === 0) {
            el.innerHTML = '<div class="queue-entry"><span class="queue-cmd-text" id="txtEmptyQueue">' + (I18N[this.currentLang].emptyQueue) + '</span></div>';
            return;
        }

        var html = this.commandQueue.slice(-6).map(function(cmd) {
            return '<div class="queue-entry">' +
                   '<span class="queue-cmd-text">' + cmd.script + '</span>' +
                   '<span class="badge-status ' + cmd.status + '">' + cmd.status + '</span>' +
                   '</div>';
        }).join('');
        el.innerHTML = html;
    };

    NovaCutBridge.prototype.loadConfig = function() {
        try {
            var panelConfig = readExistingPanelConfig();
            if (panelConfig.tempDirectory) {
                this.tempDirectory = sanitizeTempDirectoryInput(panelConfig.tempDirectory);
            }
            if (typeof panelConfig.telemetry === 'boolean') {
                this.telemetryEnabled = panelConfig.telemetry;
            }
            if (panelConfig.toolset) {
                this.toolsetMode = panelConfig.toolset;
            }

            var tempEl = document.getElementById('tempDirectory');
            if (tempEl) tempEl.value = this.tempDirectory || getDefaultTempPath();

            var telemetryEl = document.getElementById('telemetryEnabled');
            if (telemetryEl) telemetryEl.checked = this.telemetryEnabled !== false;

            var selToolset = document.getElementById('selToolset');
            if (selToolset && this.toolsetMode) selToolset.value = this.toolsetMode;
        } catch (e) {}
    };

    NovaCutBridge.prototype.saveConfig = function() {
        try {
            var tempEl = document.getElementById('tempDirectory');
            var tempDir = tempEl ? sanitizeTempDirectoryInput(tempEl.value) : '';
            if (tempDir) this.tempDirectory = tempDir;
            var ensuredTempDir = this.getTempDirectory();
            if (!ensuredTempDir) throw new Error('Could not access temp directory');

            var panelConfig = readExistingPanelConfig();
            panelConfig.tempDirectory = this.tempDirectory;
            panelConfig.telemetry = this.telemetryEnabled;
            panelConfig.toolset = this.toolsetMode;

            fs.writeFileSync(getPanelConfigPath(), JSON.stringify(panelConfig, null, 2));
            this.populateAiSnippets();
            this.log(this.currentLang === 'fa' ? 'تنظیمات با موفقیت ذخیره شد.' : 'Configuration saved successfully.', 'info');
        } catch (e) {
            this.log('Save error: ' + e.message, 'error');
        }
    };

    NovaCutBridge.prototype.saveTelemetryPreference = function() {
        var el = document.getElementById('telemetryEnabled');
        if (el) this.telemetryEnabled = !!el.checked;
        this.saveConfig();
    };

    NovaCutBridge.prototype.saveToolsetPreference = function() {
        var el = document.getElementById('selToolset');
        if (el) this.toolsetMode = el.value;
        var badge = document.getElementById('profileBadge');
        if (badge) badge.textContent = this.toolsetMode.toUpperCase() + ' AI';
        this.saveConfig();
    };

    NovaCutBridge.prototype.startBridge = function() {
        this.isConnected = true;
        this.updateUI();
        this.log(this.currentLang === 'fa' ? 'اتصال بریج نوواکات آغاز شد.' : 'NovaCut Bridge started.', 'info');
    };

    NovaCutBridge.prototype.stopBridge = function() {
        this.isConnected = false;
        this.updateUI();
        this.log(this.currentLang === 'fa' ? 'بریج متوقف شد.' : 'NovaCut Bridge stopped.', 'info');
    };

    NovaCutBridge.prototype.updateUI = function() {
        var t = I18N[this.currentLang] || I18N.fa;
        var hero = document.getElementById('statusHero');
        var connectionText = document.getElementById('connectionText');
        var serverText = document.getElementById('serverText');
        var startBtn = document.getElementById('startButton');
        var stopBtn = document.getElementById('stopButton');

        if (this.isConnected) {
            if (hero) hero.className = 'status-deck connected';
            if (connectionText) connectionText.textContent = t.connected;
            if (serverText) serverText.textContent = t.premiereReady;
        } else {
            if (hero) hero.className = 'status-deck';
            if (connectionText) connectionText.textContent = t.disconnected;
            if (serverText) serverText.textContent = t.premiereWaiting;
        }

        if (startBtn) startBtn.disabled = this.isConnected;
        if (stopBtn) stopBtn.disabled = !this.isConnected;
    };

    NovaCutBridge.prototype.log = function(message, level) {
        level = level || 'info';
        var logContainer = document.getElementById('logContainer');
        var quickPreview = document.getElementById('quickLogPreview');
        var timestamp = new Date().toLocaleTimeString();

        var entry = document.createElement('div');
        entry.className = 'log-line ' + level;
        entry.textContent = '[' + timestamp + '] ' + message;

        if (logContainer) {
            logContainer.appendChild(entry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }

        if (quickPreview) {
            var quickEntry = entry.cloneNode(true);
            quickPreview.appendChild(quickEntry);
            quickPreview.scrollTop = quickPreview.scrollHeight;
            if (quickPreview.children.length > 5) quickPreview.removeChild(quickPreview.children[0]);
        }

        console.log('[' + level + '] ' + message);
    };

    NovaCutBridge.prototype.clearLog = function() {
        var logContainer = document.getElementById('logContainer');
        var quickPreview = document.getElementById('quickLogPreview');
        if (logContainer) logContainer.innerHTML = '<div class="log-line info">Console cleared.</div>';
        if (quickPreview) quickPreview.innerHTML = '<div class="log-line info">Ready.</div>';
    };

    NovaCutBridge.prototype.testPremiereConnection = function() {
        var self = this;
        this.log(this.currentLang === 'fa' ? 'در حال ارسال پینگ به پریمیر پرو...' : 'Pinging Premiere Pro...', 'info');
        this.executeExtendScript(
            '(function(){ try { return JSON.stringify({ version: app.version, project: (app.project && app.project.name) ? app.project.name : "None" }); } catch(e){ return JSON.stringify({ error: String(e) }); } })()',
            function(err, res) {
                if (err) {
                    self.log('Connection failed: ' + err.message, 'error');
                } else {
                    self.detectHostAndProject();
                    self.log('Host responded OK: ' + (typeof res === 'object' ? JSON.stringify(res) : res), 'info');
                }
            }
        );
    };

    NovaCutBridge.prototype.runDiagnostics = function() {
        var self = this;
        this.log('Starting diagnostics...', 'info');
        this.testPremiereConnection();
    };

    NovaCutBridge.prototype.checkUpdates = function() {
        var self = this;
        var t = I18N[this.currentLang] || I18N.fa;
        var feedback = document.getElementById('updateFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.borderColor = 'rgba(139, 92, 246, 0.4)';
            feedback.style.color = '#c084fc';
            feedback.textContent = t.checkingUpdates;
        }

        var githubUrl = 'https://api.github.com/repos/mhfa1380/NovaCut-AI-Studio/releases/latest';

        fetch(githubUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
            .then(function(res) {
                if (!res.ok) {
                    return fetch('https://api.github.com/repos/mhfa1380/NovaCut-AI-Studio/commits/main', {
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    }).then(function(r) { return r.json(); }).then(function(c) {
                        return { commit: c.sha ? c.sha.substring(0, 7) : null };
                    });
                }
                return res.json();
            })
            .then(function(data) {
                if (feedback) {
                    var latestTag = data.tag_name || data.name;
                    if (latestTag && latestTag !== 'v2.0.0' && latestTag !== '2.0.0') {
                        feedback.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                        feedback.style.color = '#fde68a';
                        feedback.textContent = (t.updateAvailable) + ' (' + latestTag + ')';
                    } else {
                        feedback.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                        feedback.style.color = '#6ee7b7';
                        feedback.textContent = t.upToDate;
                    }
                }
                self.log('Update check completed successfully.', 'info');
            })
            .catch(function() {
                if (feedback) {
                    feedback.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                    feedback.style.color = '#6ee7b7';
                    feedback.textContent = t.upToDate;
                }
                self.log('Update check result: current version is active.', 'info');
            });
    };

    NovaCutBridge.prototype.triggerAutoUpdate = function() {
        var self = this;
        var t = I18N[this.currentLang] || I18N.fa;
        var feedback = document.getElementById('updateFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            feedback.style.color = '#6ee7b7';
            feedback.textContent = t.startingUpdate;
        }

        this.log('Launching NovaCut 1-Click Auto Updater...', 'info');

        try {
            if (hasNode && child_process && os.platform() === 'win32') {
                var repoPath = path.resolve(__dirname, '..');
                var batPath = path.join(repoPath, 'update.bat');
                if (fs && fs.existsSync(batPath)) {
                    child_process.spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', batPath], {
                        cwd: repoPath,
                        detached: true,
                        stdio: 'ignore'
                    });
                    self.log('update.bat launched in new terminal.', 'info');
                    return;
                }
            }
        } catch (e) {
            self.log('Auto updater launch: ' + e.message, 'warning');
        }

        // Fallback: open GitHub repo release page
        try {
            if (this.csInterface && this.csInterface.openURLInDefaultBrowser) {
                this.csInterface.openURLInDefaultBrowser('https://github.com/mhfa1380/NovaCut-AI-Studio');
            } else if (window.open) {
                window.open('https://github.com/mhfa1380/NovaCut-AI-Studio', '_blank');
            }
        } catch (e) {}
    };

    // Global exports for DOM events
    window.NovaCutBridge = NovaCutBridge;
    window.bridge = null;
    window.startBridge = function() { if (window.bridge) window.bridge.startBridge(); };
    window.stopBridge = function() { if (window.bridge) window.bridge.stopBridge(); };
    window.runDiagnostics = function() { if (window.bridge) window.bridge.runDiagnostics(); };
    window.testPremiereConnection = function() { if (window.bridge) window.bridge.testPremiereConnection(); };
    window.checkUpdates = function() { if (window.bridge) window.bridge.checkUpdates(); };
    window.triggerAutoUpdate = function() { if (window.bridge) window.bridge.triggerAutoUpdate(); };
    window.saveConfig = function() { if (window.bridge) window.bridge.saveConfig(); };
    window.saveTelemetryPreference = function() { if (window.bridge) window.bridge.saveTelemetryPreference(); };
    window.saveToolsetPreference = function() { if (window.bridge) window.bridge.saveToolsetPreference(); };
    window.clearLog = function() { if (window.bridge) window.bridge.clearLog(); };
    window.toggleLanguage = function() { if (window.bridge) window.bridge.toggleLanguage(); };
    window.copySnippet = function(client) { if (window.bridge) window.bridge.copySnippet(client); };
    window.switchTab = function(tabId) {
        var panes = document.querySelectorAll('.tab-pane');
        var btns = document.querySelectorAll('.segment-btn');
        panes.forEach(function(p) { p.classList.remove('active'); });
        btns.forEach(function(b) { b.classList.remove('active'); });

        var targetPane = document.getElementById('pane-' + tabId);
        if (targetPane) targetPane.classList.add('active');

        var tabMap = {
            dashboard: 'tabBtnDashboard',
            aiconnect: 'tabBtnAi',
            queue: 'tabBtnQueue',
            console: 'tabBtnConsole',
            settings: 'tabBtnSettings'
        };
        var activeBtn = document.getElementById(tabMap[tabId]);
        if (activeBtn) activeBtn.classList.add('active');
    };

    document.addEventListener('DOMContentLoaded', function() {
        window.bridge = new NovaCutBridge();
    });
})();
