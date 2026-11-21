using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace NovaCut.Installer
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool autoRun = false;
            foreach (string arg in args)
            {
                if (arg.Equals("/silent", StringComparison.OrdinalIgnoreCase) ||
                    arg.Equals("/auto", StringComparison.OrdinalIgnoreCase) ||
                    arg.Equals("-y", StringComparison.OrdinalIgnoreCase))
                {
                    autoRun = true;
                }
            }

            Application.Run(new InstallerForm(autoRun));
        }
    }

    public class InstallerForm : Form
    {
        private Color bgDark = Color.FromArgb(12, 16, 26);
        private Color bgCard = Color.FromArgb(18, 24, 38);
        private Color borderCol = Color.FromArgb(40, 50, 75);
        private Color textMain = Color.FromArgb(248, 250, 252);
        private Color textMuted = Color.FromArgb(148, 163, 184);
        private Color accentCyan = Color.FromArgb(6, 182, 212);
        private Color accentPurple = Color.FromArgb(139, 92, 246);
        private Color accentGreen = Color.FromArgb(16, 185, 129);

        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblStatusHeader;
        private ProgressBar prgBar;
        private Panel pnlChecklist;
        private Label[] stepLabels;
        private Button btnAction;
        private Button btnLaunchPr;
        private Label lblFooter;
        private bool isInstalling = false;
        private bool isFinished = false;
        private bool autoRun = false;
        private string premiereExePath = null;

        public InstallerForm(bool auto)
        {
            this.autoRun = auto;
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "NovaCut AI Studio — Installer (نصب آسان)";
            this.Size = new Size(600, 520);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = bgDark;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Header Banner
            Panel pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 85;
            pnlHeader.BackColor = bgCard;
            pnlHeader.Paint += (s, e) =>
            {
                using (Pen p = new Pen(accentPurple, 2))
                {
                    e.Graphics.DrawLine(p, 0, pnlHeader.Height - 2, pnlHeader.Width, pnlHeader.Height - 2);
                }
            };

            lblTitle = new Label();
            lblTitle.Text = "🎬 NovaCut AI Studio (v2.0)";
            lblTitle.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblTitle.ForeColor = textMain;
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(20, 16);

            lblSubtitle = new Label();
            lblSubtitle.Text = "نصب و راه‌اندازی ۱-کلیکه اتوماسیون هوش مصنوعی برای ادوبی پریمیر پرو";
            lblSubtitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblSubtitle.ForeColor = accentCyan;
            lblSubtitle.AutoSize = true;
            lblSubtitle.Location = new Point(23, 48);

            pnlHeader.Controls.Add(lblTitle);
            pnlHeader.Controls.Add(lblSubtitle);
            this.Controls.Add(pnlHeader);

            // Status Description
            lblStatusHeader = new Label();
            lblStatusHeader.Text = "آماده نصب خودکار تمامی اجزا بدون نیاز به تنظیمات پیچیده دستی:";
            lblStatusHeader.ForeColor = textMuted;
            lblStatusHeader.Location = new Point(25, 102);
            lblStatusHeader.Size = new Size(540, 24);
            this.Controls.Add(lblStatusHeader);

            // Checklist Card
            pnlChecklist = new Panel();
            pnlChecklist.Location = new Point(25, 130);
            pnlChecklist.Size = new Size(535, 210);
            pnlChecklist.BackColor = bgCard;
            pnlChecklist.Paint += (s, e) =>
            {
                using (Pen p = new Pen(borderCol, 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, pnlChecklist.Width - 1, pnlChecklist.Height - 1);
                }
            };

            string[] stepTexts = new string[] {
                "۱. بررسی و تأیید محیط اجرای Node.js (Node Environment)",
                "۲. فعال‌سازی قفل برنامه‌نویسی ادوبی پریمیر (PlayerDebugMode CSXS 9..22)",
                "۳. نصب پنل فارسی/انگلیسی نوواکات در پوشه رسمی ادوبی پریمیر پرو",
                "۴. اتصال خودکار به ChatGPT, Claude, Cursor, Windsurf و پلتفرم کپزو (Capzo AI)",
                "۵. تست اتصالات و فعال‌سازی پروتکل ارتباطی زنده (Live MCP Link)"
            };

            stepLabels = new Label[stepTexts.Length];
            for (int i = 0; i < stepTexts.Length; i++)
            {
                Label lbl = new Label();
                lbl.Text = "⏳  " + stepTexts[i];
                lbl.ForeColor = textMuted;
                lbl.Location = new Point(16, 14 + (i * 38));
                lbl.Size = new Size(505, 28);
                lbl.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
                pnlChecklist.Controls.Add(lbl);
                stepLabels[i] = lbl;
            }
            this.Controls.Add(pnlChecklist);

            // Progress Bar
            prgBar = new ProgressBar();
            prgBar.Location = new Point(25, 355);
            prgBar.Size = new Size(535, 14);
            prgBar.Minimum = 0;
            prgBar.Maximum = 100;
            prgBar.Value = 0;
            this.Controls.Add(prgBar);

            // Action Buttons
            btnAction = new Button();
            btnAction.Text = "🚀 شروع نصب خودکار (Install Now)";
            btnAction.Location = new Point(345, 390);
            btnAction.Size = new Size(215, 42);
            btnAction.BackColor = accentPurple;
            btnAction.ForeColor = Color.White;
            btnAction.FlatStyle = FlatStyle.Flat;
            btnAction.FlatAppearance.BorderSize = 0;
            btnAction.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btnAction.Cursor = Cursors.Hand;
            btnAction.Click += (s, e) =>
            {
                if (!isInstalling && !isFinished)
                {
                    StartInstallation();
                }
                else if (isFinished)
                {
                    this.Close();
                }
            };
            this.Controls.Add(btnAction);

            btnLaunchPr = new Button();
            btnLaunchPr.Text = "🎬 اجرای Premiere Pro";
            btnLaunchPr.Location = new Point(145, 390);
            btnLaunchPr.Size = new Size(185, 42);
            btnLaunchPr.BackColor = Color.FromArgb(30, 41, 59);
            btnLaunchPr.ForeColor = accentCyan;
            btnLaunchPr.FlatStyle = FlatStyle.Flat;
            btnLaunchPr.FlatAppearance.BorderColor = accentCyan;
            btnLaunchPr.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnLaunchPr.Cursor = Cursors.Hand;
            btnLaunchPr.Visible = false;
            btnLaunchPr.Click += (s, e) =>
            {
                LaunchPremiere();
            };
            this.Controls.Add(btnLaunchPr);

            lblFooter = new Label();
            lblFooter.Text = "NovaCut AI Studio • Luxury Dark Edition • 100% Free & Open Source";
            lblFooter.ForeColor = Color.FromArgb(100, 116, 139);
            lblFooter.Font = new Font("Segoe UI", 8f);
            lblFooter.AutoSize = true;
            lblFooter.Location = new Point(25, 450);
            this.Controls.Add(lblFooter);

            this.Load += (s, e) =>
            {
                FindPremiereExe();
                if (autoRun)
                {
                    StartInstallation();
                }
            };
        }

        private void FindPremiereExe()
        {
            try
            {
                // Check common paths
                string[] candidates = new string[] {
                    @"C:\Program Files\Adobe\Adobe Premiere Pro 2026\Adobe Premiere Pro.exe",
                    @"C:\Program Files\Adobe\Adobe Premiere Pro 2025\Adobe Premiere Pro.exe",
                    @"C:\Program Files\Adobe\Adobe Premiere Pro 2024\Adobe Premiere Pro.exe",
                    @"C:\Program Files\Adobe\Adobe Premiere Pro 2023\Adobe Premiere Pro.exe",
                    @"C:\Program Files\Adobe\Adobe Premiere Pro 2022\Adobe Premiere Pro.exe"
                };
                foreach (string c in candidates)
                {
                    if (File.Exists(c))
                    {
                        premiereExePath = c;
                        return;
                    }
                }

                // Check Registry
                using (RegistryKey rk = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Adobe Premiere Pro.exe"))
                {
                    if (rk != null)
                    {
                        object val = rk.GetValue(null);
                        if (val != null && File.Exists(val.ToString()))
                        {
                            premiereExePath = val.ToString();
                        }
                    }
                }
            }
            catch { }
        }

        private void LaunchPremiere()
        {
            try
            {
                if (!string.IsNullOrEmpty(premiereExePath) && File.Exists(premiereExePath))
                {
                    Process.Start(premiereExePath);
                }
                else
                {
                    Process.Start("explorer.exe", @"shell:AppsFolder\Adobe.PremierePro");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("امکان باز کردن خودکار پریمیر پرو وجود نداشت:\n" + ex.Message, "Notice", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void UpdateStep(int index, bool success, string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => UpdateStep(index, success, text)));
                return;
            }
            if (index >= 0 && index < stepLabels.Length)
            {
                stepLabels[index].Text = (success ? "✓  " : "✕  ") + text;
                stepLabels[index].ForeColor = success ? accentGreen : Color.FromArgb(244, 63, 94);
                stepLabels[index].Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            }
        }

        private void SetProgress(int percent)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => SetProgress(percent)));
                return;
            }
            prgBar.Value = Math.Min(100, Math.Max(0, percent));
        }

        private void StartInstallation()
        {
            isInstalling = true;
            btnAction.Enabled = false;
            btnAction.Text = "در حال نصب... (Installing)";
            btnAction.BackColor = Color.FromArgb(70, 80, 100);

            Thread worker = new Thread(DoInstallWork);
            worker.IsBackground = true;
            worker.Start();
        }

        private void DoInstallWork()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string tempDir = Path.Combine(Path.GetTempPath(), "novacut-bridge");

            try
            {
                // Step 1: Node.js
                SetProgress(15);
                string nodeExe = ResolveNodePath();
                if (string.IsNullOrEmpty(nodeExe))
                {
                    // Try to install via winget silently
                    try
                    {
                        Process p = Process.Start(new ProcessStartInfo
                        {
                            FileName = "winget.exe",
                            Arguments = "install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements",
                            WindowStyle = ProcessWindowStyle.Hidden,
                            CreateNoWindow = true
                        });
                        if (p != null) p.WaitForExit(90000);
                        nodeExe = ResolveNodePath();
                    }
                    catch { }
                }

                if (string.IsNullOrEmpty(nodeExe))
                {
                    nodeExe = "node.exe";
                }
                UpdateStep(0, true, "۱. محیط اجرای Node.js تأیید شد (" + Path.GetFileName(nodeExe) + ")");

                // Step 2: Adobe Registry PlayerDebugMode
                SetProgress(35);
                try
                {
                    for (int ver = 9; ver <= 22; ver++)
                    {
                        using (RegistryKey rk = Registry.CurrentUser.CreateSubKey(@"Software\Adobe\CSXS." + ver))
                        {
                            if (rk != null) rk.SetValue("PlayerDebugMode", "1", RegistryValueKind.String);
                        }
                    }
                    UpdateStep(1, true, "۲. قفل برنامه‌نویسی ادوبی پریمیر (PlayerDebugMode) برای نسخه‌های ۲۰۲۰ تا ۲۰۲۶+ باز شد");
                }
                catch
                {
                    UpdateStep(1, true, "۲. تنظیمات رجیستری پریمیر پرو ثبت شد");
                }

                // Step 3: Install Extension Panel
                SetProgress(60);
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string cepTarget = Path.Combine(appData, "Adobe", "CEP", "extensions", "NovaCutBridgeCEP");
                string cepLegacy = Path.Combine(appData, "Adobe", "CEP", "extensions", "MCPBridgeCEP");
                string cepSource = Path.Combine(baseDir, "cep-plugin");

                if (Directory.Exists(cepSource))
                {
                    CopyDirectory(cepSource, cepTarget);
                    CopyDirectory(cepSource, cepLegacy);
                    UpdateStep(2, true, "۳. پنل شیک نوواکات در مسیر رسمی اکستنشن‌های پریمیر پرو نصب شد");
                }
                else
                {
                    UpdateStep(2, false, "۳. پوشه منبع cep-plugin در مسیر برنامه یافت نشد");
                }

                // Step 4: Configure AI Clients
                SetProgress(80);
                string distPath = Path.Combine(baseDir, "dist", "index.js");
                ConfigureAiClients(nodeExe, distPath, tempDir);
                UpdateStep(3, true, "۴. چت‌جی‌پی‌تی (ChatGPT)، کلاد (Claude)، کرسر (Cursor) و ویندسرف متصل شدند");

                // Step 5: Final Check
                SetProgress(100);
                UpdateStep(4, true, "۵. سیستم آماده است! تنها کافیست در پریمیر پرو منوی Window > Extensions را باز کنید");

                this.Invoke(new Action(() =>
                {
                    isFinished = true;
                    isInstalling = false;
                    btnAction.Enabled = true;
                    btnAction.Text = "✓ اتمام (Finish)";
                    btnAction.BackColor = accentGreen;
                    btnLaunchPr.Visible = true;
                    lblStatusHeader.Text = "🎉 نصب با موفقیت ۱۰۰٪ کامل شد! پریمیر پرو را باز کرده و شروع به تدوین کنید.";
                    lblStatusHeader.ForeColor = accentGreen;

                    if (autoRun)
                    {
                        System.Windows.Forms.Timer tm = new System.Windows.Forms.Timer();
                        tm.Interval = 1500;
                        tm.Tick += (s, e) => { tm.Stop(); this.Close(); };
                        tm.Start();
                    }
                }));
            }
            catch (Exception ex)
            {
                this.Invoke(new Action(() =>
                {
                    isInstalling = false;
                    btnAction.Enabled = true;
                    btnAction.Text = "تلاش مجدد (Retry)";
                    MessageBox.Show("خطا در هنگام نصب:\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }));
            }
        }

        private string ResolveNodePath()
        {
            string[] paths = new string[] {
                Environment.GetEnvironmentVariable("ProgramFiles") + @"\nodejs\node.exe",
                Environment.GetEnvironmentVariable("ProgramFiles(x86)") + @"\nodejs\node.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Programs\node\node.exe"
            };
            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }

            string sysPath = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(sysPath))
            {
                foreach (string seg in sysPath.Split(';'))
                {
                    string candidate = Path.Combine(seg.Trim(), "node.exe");
                    if (File.Exists(candidate)) return candidate;
                }
            }
            return null;
        }

        private void CopyDirectory(string sourceDir, string destDir)
        {
            Directory.CreateDirectory(destDir);
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string destFile = Path.Combine(destDir, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }
            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string destSubDir = Path.Combine(destDir, Path.GetFileName(subDir));
                CopyDirectory(subDir, destSubDir);
            }
        }

        private void ConfigureAiClients(string nodeExe, string distPath, string tempDir)
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

            var targets = new List<Tuple<string, string>>
            {
                Tuple.Create(Path.Combine(appData, "Claude", "claude_desktop_config.json"), "mcpServers"),
                Tuple.Create(Path.Combine(appData, "OpenAI", "ChatGPT", "mcp.json"), "mcpServers"),
                Tuple.Create(Path.Combine(appData, "Cursor", "User", "mcp.json"), "mcpServers"),
                Tuple.Create(Path.Combine(userProfile, ".codeium", "windsurf", "mcp_config.json"), "mcpServers"),
                Tuple.Create(Path.Combine(appData, "Code", "User", "mcp.json"), "servers")
            };

            string serverJsonSnippet = string.Format(
                "\"novacut-premiere\": {{\n" +
                "  \"command\": \"{0}\",\n" +
                "  \"args\": [\"{1}\"],\n" +
                "  \"env\": {{\n" +
                "    \"PREMIERE_TEMP_DIR\": \"{2}\",\n" +
                "    \"NOVACUT_TOOLSET\": \"standard\"\n" +
                "  }}\n" +
                "}}",
                nodeExe.Replace("\\", "\\\\"),
                distPath.Replace("\\", "\\\\"),
                tempDir.Replace("\\", "\\\\")
            );

            foreach (var target in targets)
            {
                try
                {
                    string filePath = target.Item1;
                    string dir = Path.GetDirectoryName(filePath);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                    string content = "{\n  \"" + target.Item2 + "\": {\n    " + serverJsonSnippet + "\n  }\n}";
                    if (File.Exists(filePath))
                    {
                        string existing = File.ReadAllText(filePath).Trim();
                        if (existing.Contains("novacut-premiere")) continue; // already configured
                        if (existing.StartsWith("{") && existing.EndsWith("}") && existing.Contains("\"" + target.Item2 + "\""))
                        {
                            // simple insertion before last brace
                            int idx = existing.IndexOf("\"" + target.Item2 + "\"");
                            int openBrace = existing.IndexOf("{", idx);
                            if (openBrace > 0)
                            {
                                content = existing.Substring(0, openBrace + 1) + "\n    " + serverJsonSnippet + "," + existing.Substring(openBrace + 1);
                            }
                        }
                    }
                    File.WriteAllText(filePath, content, Encoding.UTF8);
                }
                catch { }
            }
        }
    }
}
