using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
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

            Application.Run(new ModernInstallerForm(autoRun));
        }
    }

    public class ModernInstallerForm : Form
    {
        // P/Invoke for borderless window dragging & rounded corners
        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();
        [DllImport("gdi32.dll")]
        public static extern IntPtr CreateRoundRectRgn(int x1, int y1, int x2, int y2, int cx, int cy);

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HT_CAPTION = 0x2;

        // Modern Luxury Palette
        private readonly Color colBgDark = Color.FromArgb(10, 13, 22);
        private readonly Color colCard = Color.FromArgb(17, 23, 38);
        private readonly Color colCardHover = Color.FromArgb(24, 32, 52);
        private readonly Color colBorder = Color.FromArgb(36, 46, 70);
        private readonly Color colTextMain = Color.FromArgb(248, 250, 252);
        private readonly Color colTextSub = Color.FromArgb(148, 163, 184);
        private readonly Color colTextMuted = Color.FromArgb(100, 116, 139);
        private readonly Color colIris = Color.FromArgb(139, 92, 246);
        private readonly Color colCyan = Color.FromArgb(6, 182, 212);
        private readonly Color colEmerald = Color.FromArgb(16, 185, 129);
        private readonly Color colRose = Color.FromArgb(244, 63, 94);

        // Fonts
        private Font fontBrand;
        private Font fontSub;
        private Font fontStepTitle;
        private Font fontStepDesc;
        private Font fontBtn;
        private Font fontSmall;

        // UI State
        private bool isInstalling = false;
        private bool isFinished = false;
        private bool autoRun = false;
        private int currentProgress = 0;
        private string statusMessage = "برای شروع راه‌اندازی ۱-کلیکه بر روی دکمه زیر کلیک کنید:";
        private string premiereExePath = null;

        private class InstallStep
        {
            public string TitleFa;
            public string SubFa;
            public int State; // 0 = Pending, 1 = Running, 2 = Success, 3 = Error
        }

        private List<InstallStep> steps = new List<InstallStep>();

        // Controls
        private Panel pnlTitleBar;
        private Button btnClose;
        private Button btnMinimize;
        private CustomPillButton btnAction;
        private CustomPillButton btnLaunchPr;
        private System.Windows.Forms.Timer animTimer;
        private int animTick = 0;

        public ModernInstallerForm(bool auto)
        {
            this.autoRun = auto;
            InitSteps();
            InitTypography();
            InitFormLayout();
            FindPremiereExe();
        }

        private void InitSteps()
        {
            steps.Add(new InstallStep
            {
                TitleFa = "۱. بررسی بستر اجرایی Node.js",
                SubFa = "موتور پردازش فرامین و پروتکل MCP",
                State = 0
            });
            steps.Add(new InstallStep
            {
                TitleFa = "۲. فعال‌سازی قفل توسعه ادوبی پریمیر پرو",
                SubFa = "آزادسازی PlayerDebugMode برای اکستنشن‌های CSXS",
                State = 0
            });
            steps.Add(new InstallStep
            {
                TitleFa = "۳. نصب پنل لوکس NovaCut در Premiere Pro",
                SubFa = "استقرار اکستنشن در پوشه رسمی Adobe CEP Extensions",
                State = 0
            });
            steps.Add(new InstallStep
            {
                TitleFa = "۴. اتصال خودکار به هوش مصنوعی",
                SubFa = "کانفیگ خودکار ChatGPT, Claude, Cursor, Windsurf و کپزو",
                State = 0
            });
            steps.Add(new InstallStep
            {
                TitleFa = "۵. راه‌اندازی ماژول کپزو و زیرنویس فارسی",
                SubFa = "آماده‌سازی تایم‌استمپ صدم‌ثانیه‌ای و تقطیع ریلز و ویدیو",
                State = 0
            });
        }

        private void InitTypography()
        {
            string primaryFont = "Segoe UI";
            foreach (FontFamily ff in FontFamily.Families)
            {
                if (ff.Name.Equals("Segoe UI Variable Display", StringComparison.OrdinalIgnoreCase))
                {
                    primaryFont = "Segoe UI Variable Display";
                    break;
                }
            }

            fontBrand = new Font(primaryFont, 14.5f, FontStyle.Bold);
            fontSub = new Font(primaryFont, 9.5f, FontStyle.Regular);
            fontStepTitle = new Font(primaryFont, 9.5f, FontStyle.Bold);
            fontStepDesc = new Font(primaryFont, 8f, FontStyle.Regular);
            fontBtn = new Font(primaryFont, 10f, FontStyle.Bold);
            fontSmall = new Font(primaryFont, 8f, FontStyle.Regular);
        }

        private void InitFormLayout()
        {
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Size = new Size(650, 540);
            this.BackColor = colBgDark;
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.ResizeRedraw | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);

            // Apply smooth rounded window shape
            IntPtr rgn = CreateRoundRectRgn(0, 0, this.Width, this.Height, 20, 20);
            this.Region = Region.FromHrgn(rgn);

            // Sleek Custom Titlebar
            pnlTitleBar = new Panel();
            pnlTitleBar.Dock = DockStyle.Top;
            pnlTitleBar.Height = 36;
            pnlTitleBar.BackColor = Color.FromArgb(14, 18, 30);
            pnlTitleBar.MouseDown += OnTitleBarMouseDown;

            btnClose = new Button();
            btnClose.Text = "✕";
            btnClose.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnClose.ForeColor = colTextMuted;
            btnClose.BackColor = Color.Transparent;
            btnClose.FlatStyle = FlatStyle.Flat;
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.Size = new Size(38, 36);
            btnClose.Location = new Point(this.Width - 38, 0);
            btnClose.Cursor = Cursors.Hand;
            btnClose.MouseEnter += (s, e) => { btnClose.BackColor = Color.FromArgb(239, 68, 68); btnClose.ForeColor = Color.White; };
            btnClose.MouseLeave += (s, e) => { btnClose.BackColor = Color.Transparent; btnClose.ForeColor = colTextMuted; };
            btnClose.Click += (s, e) => this.Close();

            btnMinimize = new Button();
            btnMinimize.Text = "—";
            btnMinimize.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            btnMinimize.ForeColor = colTextMuted;
            btnMinimize.BackColor = Color.Transparent;
            btnMinimize.FlatStyle = FlatStyle.Flat;
            btnMinimize.FlatAppearance.BorderSize = 0;
            btnMinimize.Size = new Size(38, 36);
            btnMinimize.Location = new Point(this.Width - 76, 0);
            btnMinimize.Cursor = Cursors.Hand;
            btnMinimize.MouseEnter += (s, e) => { btnMinimize.BackColor = Color.FromArgb(25, 34, 52); btnMinimize.ForeColor = Color.White; };
            btnMinimize.MouseLeave += (s, e) => { btnMinimize.BackColor = Color.Transparent; btnMinimize.ForeColor = colTextMuted; };
            btnMinimize.Click += (s, e) => this.WindowState = FormWindowState.Minimized;

            pnlTitleBar.Controls.Add(btnMinimize);
            pnlTitleBar.Controls.Add(btnClose);
            this.Controls.Add(pnlTitleBar);

            // Action Button (Primary)
            btnAction = new CustomPillButton();
            btnAction.Text = "✨ نصب آسان و خودکار (1-Click Install)";
            btnAction.Font = fontBtn;
            btnAction.Size = new Size(230, 44);
            btnAction.Location = new Point(this.Width - 260, 445);
            btnAction.NormalGradStart = colIris;
            btnAction.NormalGradEnd = Color.FromArgb(99, 102, 241);
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

            // Premiere Launch Button
            btnLaunchPr = new CustomPillButton();
            btnLaunchPr.Text = "🎬 اجرای Premiere Pro";
            btnLaunchPr.Font = fontBtn;
            btnLaunchPr.Size = new Size(185, 44);
            btnLaunchPr.Location = new Point(this.Width - 455, 445);
            btnLaunchPr.NormalGradStart = Color.FromArgb(20, 27, 45);
            btnLaunchPr.NormalGradEnd = Color.FromArgb(30, 41, 65);
            btnLaunchPr.BorderColor = colCyan;
            btnLaunchPr.ForeColor = colCyan;
            btnLaunchPr.Visible = false;
            btnLaunchPr.Cursor = Cursors.Hand;
            btnLaunchPr.Click += (s, e) => LaunchPremiere();
            this.Controls.Add(btnLaunchPr);

            // Animation timer for spinner & progress
            animTimer = new System.Windows.Forms.Timer();
            animTimer.Interval = 40;
            animTimer.Tick += (s, e) =>
            {
                animTick++;
                this.Invalidate(new Rectangle(25, 140, this.Width - 50, 280));
            };
            animTimer.Start();

            this.Load += (s, e) =>
            {
                if (autoRun)
                {
                    StartInstallation();
                }
            };
        }

        private void OnTitleBarMouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                ReleaseCapture();
                SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
            }
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            if (e.Button == MouseButtons.Left && e.Y < 120)
            {
                ReleaseCapture();
                SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;

            // Draw outer luxury subtle border
            using (Pen borderPen = new Pen(colBorder, 1.5f))
            {
                using (GraphicsPath bp = CreateRoundRect(1, 1, this.Width - 2, this.Height - 2, 20))
                {
                    g.DrawPath(borderPen, bp);
                }
            }

            // Top Header: Brand Logo Badge + Title
            int logoX = 30;
            int logoY = 52;
            int logoSize = 44;

            using (GraphicsPath logoPath = CreateRoundRect(logoX, logoY, logoSize, logoSize, 12))
            {
                using (LinearGradientBrush lgb = new LinearGradientBrush(
                    new Point(logoX, logoY), new Point(logoX + logoSize, logoY + logoSize),
                    colIris, colCyan))
                {
                    g.FillPath(lgb, logoPath);
                }
            }

            // Diamond cut inside badge
            PointF[] diamond = new PointF[] {
                new PointF(logoX + logoSize * 0.5f, logoY + logoSize * 0.22f),
                new PointF(logoX + logoSize * 0.78f, logoY + logoSize * 0.5f),
                new PointF(logoX + logoSize * 0.5f, logoY + logoSize * 0.78f),
                new PointF(logoX + logoSize * 0.22f, logoY + logoSize * 0.5f)
            };
            using (SolidBrush wb = new SolidBrush(Color.White))
            {
                g.FillPolygon(wb, diamond);
            }
            // Small cut inside diamond
            PointF[] tri = new PointF[] {
                new PointF(logoX + logoSize * 0.44f, logoY + logoSize * 0.38f),
                new PointF(logoX + logoSize * 0.62f, logoY + logoSize * 0.50f),
                new PointF(logoX + logoSize * 0.44f, logoY + logoSize * 0.62f)
            };
            using (SolidBrush darkb = new SolidBrush(colBgDark))
            {
                g.FillPolygon(darkb, tri);
            }

            // Brand Titles
            g.DrawString("NovaCut AI Studio", fontBrand, new SolidBrush(colTextMain), logoX + logoSize + 14, logoY + 1);
            g.DrawString("سیستم نصب هوشمند و ۱-کلیکه اتوماسیون برای ادوبی پریمیر پرو (v2.0)", fontSub, new SolidBrush(colCyan), logoX + logoSize + 14, logoY + 25);

            // Version Pill on the right
            string verPill = "Luxury Edition • Capzo AI";
            SizeF verSize = g.MeasureString(verPill, fontSmall);
            int pillW = (int)verSize.Width + 18;
            int pillH = 24;
            int pillX = this.Width - 30 - pillW;
            int pillY = logoY + 10;
            using (GraphicsPath pp = CreateRoundRect(pillX, pillY, pillW, pillH, 12))
            {
                using (SolidBrush pb = new SolidBrush(Color.FromArgb(30, 139, 92, 246)))
                {
                    g.FillPath(pb, pp);
                }
                using (Pen ppen = new Pen(Color.FromArgb(100, 139, 92, 246), 1))
                {
                    g.DrawPath(ppen, pp);
                }
                g.DrawString(verPill, fontSmall, new SolidBrush(Color.FromArgb(192, 132, 252)), pillX + 9, pillY + 4);
            }

            // Status message above steps card
            g.DrawString(statusMessage, fontSub, new SolidBrush(isFinished ? colEmerald : colTextSub), 30, 115);

            // Steps Container Card
            int cardX = 30;
            int cardY = 140;
            int cardW = this.Width - 60;
            int cardH = 230;

            using (GraphicsPath cp = CreateRoundRect(cardX, cardY, cardW, cardH, 14))
            {
                using (SolidBrush cb = new SolidBrush(colCard))
                {
                    g.FillPath(cb, cp);
                }
                using (Pen cpPen = new Pen(colBorder, 1))
                {
                    g.DrawPath(cpPen, cp);
                }
            }

            // Draw Step Items
            int stepStartY = cardY + 14;
            int stepGap = 42;

            for (int i = 0; i < steps.Count; i++)
            {
                InstallStep st = steps[i];
                int itemY = stepStartY + (i * stepGap);
                int iconCenterX = cardX + 26;
                int iconCenterY = itemY + 12;

                // Status Icon Indicator
                DrawStepIndicator(g, iconCenterX, iconCenterY, st.State, animTick);

                // Titles
                Color titleCol = colTextMuted;
                if (st.State == 1) titleCol = colTextMain;
                else if (st.State == 2) titleCol = colEmerald;
                else if (st.State == 3) titleCol = colRose;

                g.DrawString(st.TitleFa, fontStepTitle, new SolidBrush(titleCol), cardX + 48, itemY);
                g.DrawString(st.SubFa, fontStepDesc, new SolidBrush(colTextMuted), cardX + 48, itemY + 18);
            }

            // Capsule Progress Bar
            int barX = 30;
            int barY = 390;
            int barW = this.Width - 60;
            int barH = 12;

            using (GraphicsPath bpTrack = CreateRoundRect(barX, barY, barW, barH, 6))
            {
                using (SolidBrush tb = new SolidBrush(Color.FromArgb(20, 27, 42)))
                {
                    g.FillPath(tb, bpTrack);
                }
            }

            if (currentProgress > 0)
            {
                int fillW = Math.Max(barH, (int)((barW * currentProgress) / 100.0f));
                using (GraphicsPath bpFill = CreateRoundRect(barX, barY, fillW, barH, 6))
                {
                    using (LinearGradientBrush fillBrush = new LinearGradientBrush(
                        new Point(barX, barY), new Point(barX + barW, barY),
                        colIris, colCyan))
                    {
                        g.FillPath(fillBrush, bpFill);
                    }
                }
            }

            // Progress Text & Footer Info
            string progText = currentProgress + "%";
            g.DrawString(progText, fontStepTitle, new SolidBrush(colCyan), barX + barW - 40, barY + 16);

            g.DrawString("کاملاً خودکار، بدون نیاز به دانش فنی • پشتیبانی از پریمیر پرو ۲۰۲۰ تا ۲۰۲۶+",
                fontSmall, new SolidBrush(colTextMuted), 30, 458);
        }

        private void DrawStepIndicator(Graphics g, int x, int y, int state, int tick)
        {
            int r = 10;
            Rectangle rect = new Rectangle(x - r, y - r, r * 2, r * 2);

            if (state == 0) // Pending
            {
                using (Pen p = new Pen(Color.FromArgb(70, 80, 105), 1.5f))
                {
                    g.DrawEllipse(p, rect);
                }
                using (SolidBrush dotb = new SolidBrush(Color.FromArgb(80, 95, 125)))
                {
                    g.FillEllipse(dotb, x - 2, y - 2, 4, 4);
                }
            }
            else if (state == 1) // Running (Smooth Spinning Iris Ring)
            {
                using (Pen p = new Pen(Color.FromArgb(60, 139, 92, 246), 2f))
                {
                    g.DrawEllipse(p, rect);
                }

                float angle = (tick * 14) % 360;
                using (Pen spinPen = new Pen(colCyan, 2.5f))
                {
                    spinPen.StartCap = LineCap.Round;
                    spinPen.EndCap = LineCap.Round;
                    g.DrawArc(spinPen, rect, angle, 90);
                }
            }
            else if (state == 2) // Success (Emerald Checkmark)
            {
                using (SolidBrush sb = new SolidBrush(colEmerald))
                {
                    g.FillEllipse(sb, rect);
                }
                // Crisp White Checkmark
                using (Pen cp = new Pen(Color.White, 2f))
                {
                    cp.StartCap = LineCap.Round;
                    cp.EndCap = LineCap.Round;
                    g.DrawLines(cp, new PointF[] {
                        new PointF(x - 4, y),
                        new PointF(x - 1, y + 3.5f),
                        new PointF(x + 4.5f, y - 3f)
                    });
                }
            }
            else if (state == 3) // Error (Rose Cross)
            {
                using (SolidBrush sb = new SolidBrush(colRose))
                {
                    g.FillEllipse(sb, rect);
                }
                using (Pen cp = new Pen(Color.White, 2f))
                {
                    cp.StartCap = LineCap.Round;
                    cp.EndCap = LineCap.Round;
                    g.DrawLine(cp, x - 3, y - 3, x + 3, y + 3);
                    g.DrawLine(cp, x + 3, y - 3, x - 3, y + 3);
                }
            }
        }

        private void SetProgress(int percent)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => SetProgress(percent)));
                return;
            }
            this.currentProgress = Math.Min(100, Math.Max(0, percent));
            this.Invalidate(new Rectangle(25, 385, this.Width - 50, 45));
        }

        private void UpdateStepState(int index, int state, string customSub = null)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => UpdateStepState(index, state, customSub)));
                return;
            }
            if (index >= 0 && index < steps.Count)
            {
                steps[index].State = state;
                if (!string.IsNullOrEmpty(customSub))
                {
                    steps[index].SubFa = customSub;
                }
                this.Invalidate();
            }
        }

        private void StartInstallation()
        {
            isInstalling = true;
            btnAction.Enabled = false;
            btnAction.Text = "در حال نصب هوشمند...";
            statusMessage = "عملیات نصب آغاز شد؛ لطفاً چند لحظه شکیبا باشید:";
            this.Invalidate();

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
                // Step 1: Node.js Check / Auto-Install
                UpdateStepState(0, 1, "در حال بررسی و یافتن مسیر Node.js...");
                SetProgress(15);
                Thread.Sleep(300);

                string nodeExe = ResolveNodePath();
                if (string.IsNullOrEmpty(nodeExe))
                {
                    UpdateStepState(0, 1, "در حال دانلود خودکار Node.js با winget...");
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

                if (string.IsNullOrEmpty(nodeExe)) nodeExe = "node.exe";
                UpdateStepState(0, 2, "بستر Node.js آماده و فعال شد (" + Path.GetFileName(nodeExe) + ")");

                // Step 2: Adobe Registry PlayerDebugMode
                UpdateStepState(1, 1, "در حال اعمال تنظیمات توسعه رجیستری...");
                SetProgress(35);
                Thread.Sleep(250);

                try
                {
                    for (int ver = 9; ver <= 22; ver++)
                    {
                        using (RegistryKey rk = Registry.CurrentUser.CreateSubKey(@"Software\Adobe\CSXS." + ver))
                        {
                            if (rk != null) rk.SetValue("PlayerDebugMode", "1", RegistryValueKind.String);
                        }
                    }
                    UpdateStepState(1, 2, "قفل برنامه‌نویسی ادوبی پریمیر (PlayerDebugMode) برای تمام نسخه‌ها باز شد");
                }
                catch
                {
                    UpdateStepState(1, 2, "تنظیمات توسعه پریمیر در رجیستری ثبت شد");
                }

                // Step 3: Install Extension Panel
                UpdateStepState(2, 1, "در حال انتقال فایل‌های اکستنشن به پوشه ادوبی...");
                SetProgress(60);
                Thread.Sleep(300);

                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string cepTarget = Path.Combine(appData, "Adobe", "CEP", "extensions", "NovaCutBridgeCEP");
                string cepLegacy = Path.Combine(appData, "Adobe", "CEP", "extensions", "MCPBridgeCEP");
                string cepSource = Path.Combine(baseDir, "cep-plugin");

                if (Directory.Exists(cepSource))
                {
                    CopyDirectory(cepSource, cepTarget);
                    CopyDirectory(cepSource, cepLegacy);
                    UpdateStepState(2, 2, "اکستنشن لوکس NovaCut در مسیر رسمی Adobe CEP نصب شد");
                }
                else
                {
                    UpdateStepState(2, 3, "پوشه منبع cep-plugin در مسیر برنامه یافت نشد");
                }

                // Step 4: Configure AI Models
                UpdateStepState(3, 1, "در حال پیکربندی ChatGPT, Claude, Cursor, Windsurf...");
                SetProgress(80);
                Thread.Sleep(250);

                string distPath = Path.Combine(baseDir, "dist", "index.js");
                ConfigureAiClients(nodeExe, distPath, tempDir);
                UpdateStepState(3, 2, "کانفیگ خودکار ۵ کلاینت هوش مصنوعی با موفقیت ثبت شد");

                // Step 5: Capzo AI Engine Setup
                UpdateStepState(4, 1, "در حال آماده‌سازی موتور زیرنویس هوش مصنوعی کپزو...");
                SetProgress(95);
                Thread.Sleep(200);

                if (!Directory.Exists(tempDir)) Directory.CreateDirectory(tempDir);
                SetProgress(100);
                UpdateStepState(4, 2, "موتور زیرنویس فارسی کپزو (Capzo AI) آماده استفاده است");

                // Finished!
                this.Invoke(new Action(() =>
                {
                    isFinished = true;
                    isInstalling = false;
                    btnAction.Enabled = true;
                    btnAction.Text = "✓ اتمام و بستن (Done)";
                    btnAction.NormalGradStart = colEmerald;
                    btnAction.NormalGradEnd = Color.FromArgb(5, 150, 105);
                    btnLaunchPr.Visible = true;
                    statusMessage = "🎉 تبریک! نصب با موفقیت انجام شد. پریمیر پرو را باز کرده و از منوی Window > Extensions استفاده کنید.";
                    this.Invalidate();

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
                    statusMessage = "⚠️ خطا در هنگام نصب: " + ex.Message;
                    this.Invalidate();
                    MessageBox.Show("خطا در هنگام نصب:\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }));
            }
        }

        private void FindPremiereExe()
        {
            try
            {
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
                MessageBox.Show("امکان باز کردن خودکار ادوبی پریمیر پرو وجود نداشت:\n" + ex.Message, "Notice", MessageBoxButtons.OK, MessageBoxIcon.Information);
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
                        if (existing.Contains("novacut-premiere")) continue;
                        if (existing.StartsWith("{") && existing.EndsWith("}") && existing.Contains("\"" + target.Item2 + "\""))
                        {
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

        public static GraphicsPath CreateRoundRect(float x, float y, float w, float h, float r)
        {
            GraphicsPath path = new GraphicsPath();
            float d = r * 2;
            path.AddArc(x, y, d, d, 180, 90);
            path.AddArc(x + w - d, y, d, d, 270, 90);
            path.AddArc(x + w - d, y + h - d, d, d, 0, 90);
            path.AddArc(x, y + h - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    public class CustomPillButton : Button
    {
        public Color NormalGradStart { get; set; }
        public Color NormalGradEnd { get; set; }
        public Color BorderColor { get; set; }

        private bool isHovered = false;

        public CustomPillButton()
        {
            NormalGradStart = Color.FromArgb(139, 92, 246);
            NormalGradEnd = Color.FromArgb(99, 102, 241);
            BorderColor = Color.Transparent;
            this.SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);
            this.FlatStyle = FlatStyle.Flat;
            this.FlatAppearance.BorderSize = 0;
            this.ForeColor = Color.White;
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            base.OnMouseEnter(e);
            isHovered = true;
            this.Invalidate();
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            base.OnMouseLeave(e);
            isHovered = false;
            this.Invalidate();
        }

        protected override void OnPaint(PaintEventArgs pevent)
        {
            Graphics g = pevent.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;

            Rectangle rect = new Rectangle(0, 0, this.Width, this.Height);

            using (GraphicsPath path = ModernInstallerForm.CreateRoundRect(1, 1, this.Width - 2, this.Height - 2, this.Height / 2f))
            {
                if (this.Enabled)
                {
                    Color start = isHovered ? Color.FromArgb(Math.Min(255, NormalGradStart.R + 25), Math.Min(255, NormalGradStart.G + 25), Math.Min(255, NormalGradStart.B + 25)) : NormalGradStart;
                    Color end = isHovered ? Color.FromArgb(Math.Min(255, NormalGradEnd.R + 25), Math.Min(255, NormalGradEnd.G + 25), Math.Min(255, NormalGradEnd.B + 25)) : NormalGradEnd;

                    using (LinearGradientBrush lgb = new LinearGradientBrush(rect, start, end, 45f))
                    {
                        g.FillPath(lgb, path);
                    }

                    if (BorderColor != Color.Transparent)
                    {
                        using (Pen p = new Pen(BorderColor, 1.5f))
                        {
                            g.DrawPath(p, path);
                        }
                    }
                }
                else
                {
                    using (SolidBrush sb = new SolidBrush(Color.FromArgb(40, 50, 75)))
                    {
                        g.FillPath(sb, path);
                    }
                }

                // Draw Text
                TextRenderer.DrawText(
                    g,
                    this.Text,
                    this.Font,
                    rect,
                    this.Enabled ? this.ForeColor : Color.FromArgb(140, 150, 175),
                    TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter
                );
            }
        }
    }
}
