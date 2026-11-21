using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;

namespace IconGen
{
    class Program
    {
        static void Main(string[] args)
        {
            string outDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "assets");
            if (!Directory.Exists(outDir)) Directory.CreateDirectory(outDir);

            int[] sizes = new int[] { 256, 128, 64, 48, 32, 16 };
            List<byte[]> pngBytesList = new List<byte[]>();
            List<int> validSizes = new List<int>();

            Bitmap master256 = null;

            foreach (int size in sizes)
            {
                using (Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
                {
                    using (Graphics g = Graphics.FromImage(bmp))
                    {
                        g.SmoothingMode = SmoothingMode.AntiAlias;
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.Clear(Color.Transparent);

                        float scale = size / 256.0f;
                        float pad = 12 * scale;
                        float rectSize = size - (pad * 2);

                        // Rounded back plate
                        using (GraphicsPath path = CreateRoundRect(pad, pad, rectSize, rectSize, 48 * scale))
                        {
                            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                                new PointF(0, 0),
                                new PointF(size, size),
                                Color.FromArgb(255, 14, 18, 30),
                                Color.FromArgb(255, 7, 10, 18)))
                            {
                                g.FillPath(bgBrush, path);
                            }

                            // Glowing edge stroke
                            using (Pen edgePen = new Pen(Color.FromArgb(160, 139, 92, 246), 3 * scale))
                            {
                                g.DrawPath(edgePen, path);
                            }
                        }

                        // Central NovaCut Glyph: Electric Faceted Diamond + Play Triangle
                        PointF[] diamond = new PointF[] {
                            new PointF(size * 0.50f, size * 0.22f), // Top
                            new PointF(size * 0.78f, size * 0.50f), // Right
                            new PointF(size * 0.50f, size * 0.78f), // Bottom
                            new PointF(size * 0.22f, size * 0.50f)  // Left
                        };

                        using (LinearGradientBrush glyphBrush = new LinearGradientBrush(
                            new PointF(size * 0.2f, size * 0.2f),
                            new PointF(size * 0.8f, size * 0.8f),
                            Color.FromArgb(255, 168, 85, 247),  // Purple
                            Color.FromArgb(255, 6, 182, 212)))  // Cyan
                        {
                            g.FillPolygon(glyphBrush, diamond);
                        }

                        // Play Triangle Cutout in center
                        PointF[] playTriangle = new PointF[] {
                            new PointF(size * 0.44f, size * 0.38f),
                            new PointF(size * 0.62f, size * 0.50f),
                            new PointF(size * 0.44f, size * 0.62f)
                        };
                        using (SolidBrush whiteBrush = new SolidBrush(Color.FromArgb(245, 255, 255, 255)))
                        {
                            g.FillPolygon(whiteBrush, playTriangle);
                        }

                        // Top sparkle / nova star
                        using (SolidBrush cyanSparkle = new SolidBrush(Color.FromArgb(240, 56, 189, 248)))
                        {
                            float spSize = 10 * scale;
                            g.FillEllipse(cyanSparkle, size * 0.70f - spSize/2, size * 0.26f - spSize/2, spSize, spSize);
                        }
                    }

                    if (size == 256)
                    {
                        master256 = new Bitmap(bmp);
                        bmp.Save(Path.Combine(outDir, "icon.png"), ImageFormat.Png);
                    }

                    using (MemoryStream ms = new MemoryStream())
                    {
                        bmp.Save(ms, ImageFormat.Png);
                        pngBytesList.Add(ms.ToArray());
                        validSizes.Add(size);
                    }
                }
            }

            // Write multi-resolution .ico file
            string icoPath = Path.Combine(outDir, "icon.ico");
            using (FileStream fs = new FileStream(icoPath, FileMode.Create))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                // ICONDIR header
                bw.Write((ushort)0); // reserved
                bw.Write((ushort)1); // type 1 = icon
                bw.Write((ushort)validSizes.Count); // image count

                int offset = 6 + (16 * validSizes.Count);

                for (int i = 0; i < validSizes.Count; i++)
                {
                    int sz = validSizes[i];
                    byte[] png = pngBytesList[i];

                    bw.Write((byte)(sz >= 256 ? 0 : sz)); // width
                    bw.Write((byte)(sz >= 256 ? 0 : sz)); // height
                    bw.Write((byte)0); // colors
                    bw.Write((byte)0); // reserved
                    bw.Write((ushort)1); // planes
                    bw.Write((ushort)32); // bpp
                    bw.Write((uint)png.Length); // size
                    bw.Write((uint)offset); // offset

                    offset += png.Length;
                }

                for (int i = 0; i < validSizes.Count; i++)
                {
                    bw.Write(pngBytesList[i]);
                }
            }

            Console.WriteLine("Icon generated successfully: " + icoPath);
        }

        static GraphicsPath CreateRoundRect(float x, float y, float w, float h, float r)
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
}
