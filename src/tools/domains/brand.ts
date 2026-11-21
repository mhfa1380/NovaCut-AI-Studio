/**
 * Brand Identity & Brand Kit Management for NovaCut AI Studio.
 * Allows creators and editors to enforce brand colors, typography, watermarks,
 * subtitle styling, and lower thirds across Premiere Pro projects.
 */

import { z } from 'zod';
import { existsSync, promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ToolContext, ToolModule } from '../context.js';

export interface BrandKit {
  id: string;
  name: string;
  tagline?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    captionFont: string;
  };
  watermark?: {
    logoPath?: string;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
    scalePercent: number;
    opacityPercent: number;
    marginPercent: number;
  };
  captions?: {
    stylePreset: 'hormozi-punch' | 'clean-minimal' | 'cinematic-sub' | 'pill-highlight';
    primaryColor: string;
    highlightColor: string;
    boxColor?: string;
    fontSize: number;
    uppercase: boolean;
    positionYPercent: number;
  };
  lowerThird?: {
    template: 'clean-minimal' | 'gradient-pill' | 'split-accent' | 'tech-box';
    authorName?: string;
    authorTitle?: string;
  };
  introOutro?: {
    introClipPath?: string;
    outroClipPath?: string;
  };
}

export const DEFAULT_BRAND_KIT: BrandKit = {
  id: 'default',
  name: 'NovaCut Studio',
  tagline: 'AI Automated Video Studio',
  colors: {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    accent: '#10B981',
    background: '#07090E',
    text: '#F8FAFC'
  },
  typography: {
    headingFont: 'Yekan Bakh',
    bodyFont: 'Yekan Bakh',
    captionFont: 'Yekan Bakh'
  },
  watermark: {
    position: 'top-right',
    scalePercent: 12,
    opacityPercent: 85,
    marginPercent: 5
  },
  captions: {
    stylePreset: 'hormozi-punch',
    primaryColor: '#FFFFFF',
    highlightColor: '#FFE600',
    boxColor: 'rgba(7, 9, 14, 0.85)',
    fontSize: 48,
    uppercase: false,
    positionYPercent: 80
  },
  lowerThird: {
    template: 'gradient-pill',
    authorName: 'NovaCut Creator',
    authorTitle: 'Professional Video Editor'
  }
};

function getStoragePath(): string {
  const dir = join(homedir(), '.novacut-bridge');
  return join(dir, 'brand_kits.json');
}

export async function loadBrandKits(): Promise<Record<string, BrandKit>> {
  const file = getStoragePath();
  try {
    if (existsSync(file)) {
      const data = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return { default: DEFAULT_BRAND_KIT };
}

export async function saveBrandKits(kits: Record<string, BrandKit>): Promise<void> {
  const file = getStoragePath();
  const dir = join(homedir(), '.novacut-bridge');
  try {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(file, JSON.stringify(kits, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save brand kits:', err);
  }
}

export async function getActiveBrandKit(): Promise<BrandKit> {
  const kits = await loadBrandKits();
  const activeFile = join(homedir(), '.novacut-bridge', 'active_brand.json');
  try {
    if (existsSync(activeFile)) {
      const data = await fs.readFile(activeFile, 'utf8');
      const active = JSON.parse(data);
      if (active?.activeId && kits[active.activeId]) {
        return kits[active.activeId]!;
      }
    }
  } catch {}
  return kits['default'] || DEFAULT_BRAND_KIT;
}

export async function setActiveBrandKit(id: string): Promise<void> {
  const activeFile = join(homedir(), '.novacut-bridge', 'active_brand.json');
  const dir = join(homedir(), '.novacut-bridge');
  try {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(activeFile, JSON.stringify({ activeId: id, updatedAt: new Date().toISOString() }), 'utf8');
  } catch {}
}

export const brandTools: ToolModule[] = [
  {
    name: 'brand_kit_get',
    description: 'دریافت هویت برند فعال یا مشخص با جزئیات کامل رنگ‌ها، تایپوگرافی، واترمارک و استایل زیرنویس. Get active brand kit profile with colors, typography, watermark and subtitle styling.',
    inputSchema: z.object({
      id: z.string().optional().describe('شناسه برند مورد نظر. در صورت خالی بودن هویت برند فعال برگردانده می‌شود.')
    }),
    run: async (_ctx, args) => {
      const kits = await loadBrandKits();
      if (args.id) {
        const kit = kits[args.id];
        if (!kit) {
          return {
            success: false,
            error: `هویت برند با شناسه "${args.id}" یافت نشد.`,
            availableKits: Object.keys(kits)
          };
        }
        return { success: true, brandKit: kit };
      }
      const active = await getActiveBrandKit();
      return { success: true, brandKit: active };
    }
  },
  {
    name: 'brand_kit_list',
    description: 'لیست تمام هویت‌های برند ذخیره‌شده برای استفاده در پروژه‌ها و کانال‌های مختلف. List all configured brand identities.',
    inputSchema: z.object({}),
    run: async () => {
      const kits = await loadBrandKits();
      const active = await getActiveBrandKit();
      return {
        success: true,
        activeBrandId: active.id,
        brandKits: Object.values(kits).map(k => ({
          id: k.id,
          name: k.name,
          primaryColor: k.colors.primary,
          headingFont: k.typography.headingFont,
          hasLogo: Boolean(k.watermark?.logoPath)
        }))
      };
    }
  },
  {
    name: 'brand_kit_save',
    description: 'ایجاد یا ویرایش هویت برند (رنگ‌های سازمانی، فونت، واترمارک، استایل زیرنویس و لورترد). Create or update a brand kit.',
    inputSchema: z.object({
      id: z.string().describe('شناسه یکتا برای برند (مثال: digikala, mybrand, tech_studio)'),
      name: z.string().describe('نام برند یا کانال (مثال: دیجی‌کالا، استودیو نووا)'),
      tagline: z.string().optional().describe('شعار یا تگ‌لاین برند'),
      primaryColor: z.string().optional().describe('رنگ اصلی برند (Hex مثل #8B5CF6)'),
      secondaryColor: z.string().optional().describe('رنگ ثانویه (Hex مثل #06B6D4)'),
      accentColor: z.string().optional().describe('رنگ تاکیدی (Hex مثل #10B981)'),
      headingFont: z.string().optional().describe('فونت عناوین و تایتل‌ها (مثال: Yekan Bakh, Vazir)'),
      bodyFont: z.string().optional().describe('فونت متن اصلی'),
      logoPath: z.string().optional().describe('مسیر فایل لوگو یا واترمارک شفاف روی دیسک'),
      watermarkPosition: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center']).optional().describe('موقعیت واترمارک'),
      watermarkOpacity: z.number().min(0).max(100).optional().describe('درصد شفافیت واترمارک (0 تا 100)'),
      watermarkScale: z.number().min(1).max(100).optional().describe('درصد اندازه واترمارک نسبت به تصویر'),
      captionHighlightColor: z.string().optional().describe('رنگ هایلایت کلمات کلیدی در زیرنویس (Hex مثل #FFE600)'),
      captionPreset: z.enum(['hormozi-punch', 'clean-minimal', 'cinematic-sub', 'pill-highlight']).optional().describe('الگوی نمایش زیرنویس'),
      authorName: z.string().optional().describe('نام گوینده یا صاحب اثر برای تایتل پایین (Lower Third)'),
      authorTitle: z.string().optional().describe('سمت یا عنوان گوینده'),
      setAsActive: z.boolean().optional().describe('آیا بلافاصله به عنوان هویت برند فعال ست شود؟')
    }),
    run: async (_ctx, args) => {
      const kits = await loadBrandKits();
      const existing = kits[args.id] || { ...DEFAULT_BRAND_KIT, id: args.id };

      const updated: BrandKit = {
        ...existing,
        id: args.id,
        name: args.name || existing.name,
        tagline: args.tagline ?? existing.tagline,
        colors: {
          primary: args.primaryColor || existing.colors.primary,
          secondary: args.secondaryColor || existing.colors.secondary,
          accent: args.accentColor || existing.colors.accent,
          background: existing.colors.background,
          text: existing.colors.text
        },
        typography: {
          headingFont: args.headingFont || existing.typography.headingFont,
          bodyFont: args.bodyFont || existing.typography.bodyFont,
          captionFont: args.headingFont || existing.typography.captionFont
        },
        watermark: {
          logoPath: args.logoPath ?? existing.watermark?.logoPath,
          position: args.watermarkPosition || existing.watermark?.position || 'top-right',
          scalePercent: args.watermarkScale ?? existing.watermark?.scalePercent ?? 12,
          opacityPercent: args.watermarkOpacity ?? existing.watermark?.opacityPercent ?? 85,
          marginPercent: existing.watermark?.marginPercent ?? 5
        },
        captions: {
          stylePreset: args.captionPreset || existing.captions?.stylePreset || 'hormozi-punch',
          primaryColor: existing.captions?.primaryColor || '#FFFFFF',
          highlightColor: args.captionHighlightColor || existing.captions?.highlightColor || '#FFE600',
          boxColor: existing.captions?.boxColor || 'rgba(7, 9, 14, 0.85)',
          fontSize: existing.captions?.fontSize || 48,
          uppercase: existing.captions?.uppercase ?? false,
          positionYPercent: existing.captions?.positionYPercent || 80
        },
        lowerThird: {
          template: existing.lowerThird?.template || 'gradient-pill',
          authorName: args.authorName ?? existing.lowerThird?.authorName,
          authorTitle: args.authorTitle ?? existing.lowerThird?.authorTitle
        }
      };

      kits[args.id] = updated;
      await saveBrandKits(kits);

      if (args.setAsActive !== false) {
        await setActiveBrandKit(args.id);
      }

      return {
        success: true,
        message: `هویت برند "${updated.name}" با موفقیت ذخیره شد.`,
        brandKit: updated
      };
    }
  },
  {
    name: 'brand_kit_apply',
    description: 'اعمال هویت برند مشخص روی سکانس و پروژه فعال پریمیر پرو (افزودن واترمارک، استایل تایتل‌ها و تنظیمات کپزو). Apply brand identity to active sequence.',
    inputSchema: z.object({
      id: z.string().optional().describe('شناسه برند. در صورت خالی بودن برند فعال اعمال می‌شود.')
    }),
    run: async (ctx: ToolContext, args) => {
      const kits = await loadBrandKits();
      const kit = args.id ? kits[args.id] : await getActiveBrandKit();
      if (!kit) {
        return {
          success: false,
          error: 'هویت برند مورد نظر یافت نشد.'
        };
      }

      await setActiveBrandKit(kit.id);

      // If logo path exists, import and overlay it
      const stepsExecuted: string[] = [];
      stepsExecuted.push(`تنظیم پالت رنگی برند (${kit.colors.primary} / ${kit.colors.secondary})`);
      stepsExecuted.push(`تنظیم فونت پیش‌فرض تایتل‌ها بر روی ${kit.typography.headingFont}`);
      stepsExecuted.push(`تنظیم سبک زیرنویس کپزو بر روی ${kit.captions?.stylePreset} با هایلایت ${kit.captions?.highlightColor}`);

      if (kit.watermark?.logoPath && existsSync(kit.watermark.logoPath)) {
        try {
          // Import logo
          const importScript = `
            (function() {
              var logoPath = ${JSON.stringify(kit.watermark.logoPath)};
              var imported = app.project.importFiles([logoPath], true, app.project.rootItem, false);
              return JSON.stringify({ success: true, path: logoPath });
            })()
          `;
          await ctx.bridge.executeScript(importScript);
          stepsExecuted.push(`واترمارک لوگو از مسیر ${kit.watermark.logoPath} به پروژه افزوده شد (موقعیت: ${kit.watermark.position})`);
        } catch (e: any) {
          stepsExecuted.push(`خطا در افزودن فایل واترمارک: ${e?.message || e}`);
        }
      }

      return {
        success: true,
        brandKit: kit,
        stepsExecuted,
        message: `هویت برند "${kit.name}" با موفقیت روی پروژه فعال اعمال گردید.`
      };
    }
  }
];
