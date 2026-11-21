/**
 * World-Class Video Editing Skills & Mastery Engine for NovaCut AI Studio.
 * Curates top editing styles worldwide (Retention/MrBeast, Kinetic/Hormozi,
 * Aesthetic/Ali Abdaal, Documentary/Vox & Harris, Tech/MKBHD, Multicam/Podcast).
 */

import { z } from 'zod';
import { existsSync, promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ToolContext, ToolModule } from '../context.js';

export interface EditingSkillProfile {
  id: string;
  name: string;
  nameFa: string;
  creatorInspiration: string;
  category: 'retention-viral' | 'aesthetic-minimal' | 'cinematic-story' | 'tech-commercial' | 'podcast-interview';
  badge: string;
  description: string;
  descriptionFa: string;
  rules: {
    targetPlatform: string;
    aspectRatio: '16:9' | '9:16' | '1:1' | '2.39:1';
    cutCadenceSeconds: { min: number; max: number };
    silenceThresholdDb: number;
    silencePaddingMs: number;
    audioLevelLufs: number;
    bgMusicDuckDb: number;
    zoomPunches: boolean;
    captionStyle: 'kinetic-word' | 'clean-sentence' | 'cinematic-minimal' | 'none';
    colorGradeVibe: string;
    soundDesignFrequency: 'high-dopamine' | 'subtle-atmospheric' | 'cinematic-heavy' | 'minimal-clean';
  };
  promptGuide: string;
}

export const WORLD_CLASS_EDITING_SKILLS: EditingSkillProfile[] = [
  {
    id: 'hormozi_kinetic',
    name: 'Kinetic Punch Viral',
    nameFa: 'ریلز و شورتس ویرال (سبک هورموزی)',
    creatorInspiration: 'Alex Hormozi & Ryan Pineda',
    category: 'retention-viral',
    badge: 'VIRAL REELS',
    description: 'Rapid 9:16 vertical cadence with word-by-word kinetic captions, punch-in cuts, and sound accent pops.',
    descriptionFa: 'ریتم بسیار تند عمودی با زیرنویس‌های کلمه‌ای صدم‌ثانیه‌ای، زوم‌های ناگهانی روی کلمات کلیدی و افکت‌های صوتی وووش و دینگ.',
    rules: {
      targetPlatform: 'Instagram Reels / TikTok / YouTube Shorts',
      aspectRatio: '9:16',
      cutCadenceSeconds: { min: 1.0, max: 2.2 },
      silenceThresholdDb: -34,
      silencePaddingMs: 80,
      audioLevelLufs: -14,
      bgMusicDuckDb: -22,
      zoomPunches: true,
      captionStyle: 'kinetic-word',
      colorGradeVibe: 'High saturation, punchy contrast, crisp edge clarity',
      soundDesignFrequency: 'high-dopamine'
    },
    promptGuide: 'Frame in 9:16 vertical (1080x1920). Cut silences aggressively (< 80ms). Use Capzo word-by-word subtitles centered in the middle third with bright punchy highlight colors (#FFE600). Apply 1.15x scale punch on emphasis words. Switch visuals every 1.5 seconds.'
  },
  {
    id: 'mrbeast_retention',
    name: 'Retention Beast',
    nameFa: 'ریتنشن و هیجان ماکسیمم (سبک مستربیست)',
    creatorInspiration: 'MrBeast & Colin and Samir',
    category: 'retention-viral',
    badge: 'HIGH RETENTION',
    description: 'Hyper-engaging 16:9 YouTube pacing, constant visual stimulation, fast B-roll cutaways, and riser sound design.',
    descriptionFa: 'تدوین با درگیرکنندگی فوق‌العاده بالا، ریتم سریع کات‌ها (۱.۵ تا ۲.۵ ثانیه)، کات به تصاویر مکمل و طراحی صدای پرهیجان با ساند افکت‌های رایزر و ایمپکت.',
    rules: {
      targetPlatform: 'YouTube Mainstream / Entertainment',
      aspectRatio: '16:9',
      cutCadenceSeconds: { min: 1.5, max: 2.5 },
      silenceThresholdDb: -35,
      silencePaddingMs: 90,
      audioLevelLufs: -14,
      bgMusicDuckDb: -20,
      zoomPunches: true,
      captionStyle: 'kinetic-word',
      colorGradeVibe: 'Vibrant, bright, commercial YouTube pop',
      soundDesignFrequency: 'high-dopamine'
    },
    promptGuide: 'Cut pace at 1.5-2.5s. Introduce a visual change or B-roll every 3-4s. Sound design: Add risers before topic shifts, whooshes on wipes, sub-drops on big reveals. Cut all dead air. Music ducked to -20dB under speech.'
  },
  {
    id: 'ali_abdaal_aesthetic',
    name: 'Clean Aesthetic',
    nameFa: 'زیبایی‌شناختی و مدرن (سبک علی ابدال)',
    creatorInspiration: 'Ali Abdaal & Thomas Frank',
    category: 'aesthetic-minimal',
    badge: 'CLEAN MINIMAL',
    description: 'Sophisticated, tasteful, and calm editing. Swiss typography, lo-fi warm tones, subtle paper textures, and breathable cuts.',
    descriptionFa: 'تدوین مینیمال، باوقار و خوش‌سلیقه؛ فاصله تنفس بین جملات، تایپوگرافی سوئیسی شیک، تم گرم و سینمایی با موسیقی ملایم لو-فای.',
    rules: {
      targetPlatform: 'YouTube Long-form / Educational / Tech',
      aspectRatio: '16:9',
      cutCadenceSeconds: { min: 3.0, max: 5.5 },
      silenceThresholdDb: -32,
      silencePaddingMs: 200,
      audioLevelLufs: -16,
      bgMusicDuckDb: -25,
      zoomPunches: false,
      captionStyle: 'clean-sentence',
      colorGradeVibe: 'Warm pastel film tones, natural skin tones, matte blacks',
      soundDesignFrequency: 'minimal-clean'
    },
    promptGuide: 'Pace cuts smoothly at 3-5 seconds. Allow natural breath pauses between concepts. Use clean Yekan Bakh lower-thirds and minimal glass callout cards. Color grade with warm film curve. Audio: Lo-fi beat ducked to -25dB.'
  },
  {
    id: 'vox_documentary',
    name: 'Cinematic Visual Essay',
    nameFa: 'مستند سینمایی و پژوهشی (سبک Vox و جانی هریس)',
    creatorInspiration: 'Johnny Harris & Vox Borders & Lemmino',
    category: 'cinematic-story',
    badge: 'CINEMATIC ESSAY',
    description: 'Documentary mastery with 2.39:1 widescreen option, archival paper textures, tactile foley, and slow purposeful zooms.',
    descriptionFa: 'روایتگری مستند حرفه‌ای؛ نسبت تصویر عریض سینمایی ۲.۳۹ به ۱، فریم‌های مقایسه‌ای دوگانه، ساند افکت‌های فیزیکی ماشین‌تحریر و کاغذ با زوم‌های تدریجی عمیق.',
    rules: {
      targetPlatform: 'Documentary / Deep Dive Video Essays',
      aspectRatio: '2.39:1',
      cutCadenceSeconds: { min: 2.5, max: 6.0 },
      silenceThresholdDb: -30,
      silencePaddingMs: 250,
      audioLevelLufs: -16,
      bgMusicDuckDb: -24,
      zoomPunches: false,
      captionStyle: 'cinematic-minimal',
      colorGradeVibe: 'Film grain, 35mm print emulation, Kodak/Fuji tone curve',
      soundDesignFrequency: 'cinematic-heavy'
    },
    promptGuide: 'Use widescreen framing or letterbox. Add subtle 35mm grain. Pair archival photos with slow 0.5% push-ins. Sound design: typewriter keys, paper whooshes, film projector hum, tape stops. Build narrative tension with orchestral score.'
  },
  {
    id: 'mkbhd_minimal_tech',
    name: 'Modern Tech Showcase',
    nameFa: 'بررسی تکنولوژی و استودیویی (سبک MKBHD)',
    creatorInspiration: 'MKBHD (Marques Brownlee) & Dave2D',
    category: 'tech-commercial',
    badge: 'STUDIO TECH',
    description: 'Crisp 4K Lumetri grade, pristine broadcast audio, smooth speed-ramped B-roll, and sharp vector lower-thirds.',
    descriptionFa: 'کیفیت استودیویی فوق شفاف 4K، تصحیح رنگ عمیق با بلک‌های خالص، اسلوموشن و اسپیدرمپ‌های نرم روی قطعات با وضوح صدای کریستالی.',
    rules: {
      targetPlatform: 'Tech Reviews / Commercials / Hardware',
      aspectRatio: '16:9',
      cutCadenceSeconds: { min: 2.5, max: 4.5 },
      silenceThresholdDb: -32,
      silencePaddingMs: 150,
      audioLevelLufs: -14,
      bgMusicDuckDb: -23,
      zoomPunches: false,
      captionStyle: 'clean-sentence',
      colorGradeVibe: 'Ultra-crisp 4K, true deep blacks, clean specular highlights',
      soundDesignFrequency: 'subtle-atmospheric'
    },
    promptGuide: 'Grade footage with punchy Lumetri curve and deep clean blacks. Apply smooth speed ramps to B-roll product close-ups. Voiceover mastered to -14 LUFS with gentle compression. Lower thirds: clean sans-serif with subtle matte drop shadow.'
  },
  {
    id: 'podcast_master',
    name: 'Podcast & Talk Show Master',
    nameFa: 'پادکست و مصاحبه چنددوربینه (سبک پادکست استودیویی)',
    creatorInspiration: 'Huberman Lab & Diary of a CEO & Joe Rogan',
    category: 'podcast-interview',
    badge: 'STUDIO PODCAST',
    description: 'Multi-cam speaker detection, broadcast voice leveling, subtle chapter bumpers, and clean speaker badge titles.',
    descriptionFa: 'مدیریت حرفه‌ای پروژه‌های چنددوربینه و پادکست؛ سوییچ هوشمند بر اساس صحبت گوینده، مسترینگ استاندارد صدا (-16 LUFS) و مارکربندی فصول زمانی.',
    rules: {
      targetPlatform: 'Long-form Podcasts / Interviews / Webinars',
      aspectRatio: '16:9',
      cutCadenceSeconds: { min: 4.0, max: 12.0 },
      silenceThresholdDb: -30,
      silencePaddingMs: 300,
      audioLevelLufs: -16,
      bgMusicDuckDb: -28,
      zoomPunches: false,
      captionStyle: 'clean-sentence',
      colorGradeVibe: 'Natural studio look, balanced skin tones, cozy warm ambient',
      soundDesignFrequency: 'minimal-clean'
    },
    promptGuide: 'Switch cameras based on active speaker with 200ms pre-roll. When both react or interrupt, cut to wide 2-shot or split. Master dialogue to -16 LUFS integrated. Add timeline markers at major topic shifts. Place speaker name lower-thirds on first appearance.'
  }
];

function getActiveSkillPath(): string {
  const dir = join(homedir(), '.novacut-bridge');
  return join(dir, 'active_skill.json');
}

export async function getActiveEditingSkill(): Promise<EditingSkillProfile> {
  const file = getActiveSkillPath();
  try {
    if (existsSync(file)) {
      const data = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(data);
      const found = WORLD_CLASS_EDITING_SKILLS.find(s => s.id === parsed.activeSkillId);
      if (found) return found;
    }
  } catch {}
  return WORLD_CLASS_EDITING_SKILLS[0]!; // Default to Hormozi / Viral
}

export async function setActiveEditingSkill(id: string): Promise<EditingSkillProfile | null> {
  const found = WORLD_CLASS_EDITING_SKILLS.find(s => s.id === id);
  if (!found) return null;
  const file = getActiveSkillPath();
  const dir = join(homedir(), '.novacut-bridge');
  try {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(file, JSON.stringify({ activeSkillId: id, activatedAt: new Date().toISOString() }), 'utf8');
  } catch {}
  return found;
}

export const skillsTools: ToolModule[] = [
  {
    name: 'editing_skill_list',
    description: 'مشاهده لیست برترین مهارت‌های تدوین جهان (هرموزی، مستربیست، علی ابدال، واکس، MKBHD، پادکست). List all world-class editing skills and mastery profiles.',
    inputSchema: z.object({}),
    run: async () => {
      const active = await getActiveEditingSkill();
      return {
        success: true,
        activeSkillId: active.id,
        activeSkillName: active.nameFa,
        skills: WORLD_CLASS_EDITING_SKILLS.map(s => ({
          id: s.id,
          name: s.name,
          nameFa: s.nameFa,
          badge: s.badge,
          creator: s.creatorInspiration,
          category: s.category,
          aspectRatio: s.rules.aspectRatio,
          cutCadence: `${s.rules.cutCadenceSeconds.min}s - ${s.rules.cutCadenceSeconds.max}s`,
          captionStyle: s.rules.captionStyle,
          descriptionFa: s.descriptionFa
        }))
      };
    }
  },
  {
    name: 'editing_skill_get',
    description: 'دریافت مشخصات کامل و قوانین تدوین یک مهارت یا سبک مشخص. Get detailed rules and directives for an editing skill.',
    inputSchema: z.object({
      id: z.string().describe('شناسه مهارت (مثلاً hormozi_kinetic, mrbeast_retention, ali_abdaal_aesthetic, vox_documentary, mkbhd_minimal_tech, podcast_master)')
    }),
    run: async (_ctx, args) => {
      const skill = WORLD_CLASS_EDITING_SKILLS.find(s => s.id === args.id);
      if (!skill) {
        return {
          success: false,
          error: `مهارت تدوین با شناسه "${args.id}" یافت نشد.`,
          availableSkills: WORLD_CLASS_EDITING_SKILLS.map(s => s.id)
        };
      }
      return {
        success: true,
        skill
      };
    }
  },
  {
    name: 'editing_skill_apply',
    description: 'فعال‌سازی و اعمال یکی از برترین مهارت‌های تدوین روی پروژه پریمیر پرو (تنظیم ابعاد، ریتم کات، صدای لو-فای/پرانرژی و استایل زیرنویس). Activate and enforce an editing skill on active sequence.',
    inputSchema: z.object({
      id: z.string().describe('شناسه مهارت مورد نظر جهت فعال‌سازی (hormozi_kinetic, mrbeast_retention, ali_abdaal_aesthetic, vox_documentary, mkbhd_minimal_tech, podcast_master)')
    }),
    run: async (ctx: ToolContext, args) => {
      const skill = await setActiveEditingSkill(args.id);
      if (!skill) {
        return {
          success: false,
          error: `مهارت تدوین "${args.id}" موجود نیست.`,
          availableSkills: WORLD_CLASS_EDITING_SKILLS.map(s => s.id)
        };
      }

      const actionsDone: string[] = [];
      actionsDone.push(`سبک تدوین "${skill.nameFa}" به عنوان مهارت فعال پروژه تنظیم شد`);
      actionsDone.push(`نسبت تصویر پیشنهادی: ${skill.rules.aspectRatio} (${skill.rules.targetPlatform})`);
      actionsDone.push(`ریتم برش‌ها و کات‌ها: هر ${skill.rules.cutCadenceSeconds.min} تا ${skill.rules.cutCadenceSeconds.max} ثانیه`);
      actionsDone.push(`حد آستانه سکوت‌بری: ${skill.rules.silenceThresholdDb}dB با پدینگ ${skill.rules.silencePaddingMs}ms`);
      actionsDone.push(`سطح صدای مستر: ${skill.rules.audioLevelLufs} LUFS و داکینگ موزیک در ${skill.rules.bgMusicDuckDb}dB`);
      actionsDone.push(`استایل زیرنویس هوش مصنوعی: ${skill.rules.captionStyle}`);

      // Add a timeline marker if sequence is open
      try {
        const markerScript = `
          (function() {
            var seq = app.project.activeSequence;
            if (!seq) return JSON.stringify({ sequenceOpen: false });
            var markers = seq.markers;
            if (markers) {
              var m = markers.createMarker(0.0);
              m.name = "Skill: " + ${JSON.stringify(skill.name)};
              m.comments = ${JSON.stringify(skill.nameFa + " | " + skill.rules.aspectRatio)};
              m.setColorByIndex(3); // Lavender
            }
            return JSON.stringify({ sequenceOpen: true, sequenceName: seq.name });
          })()
        `;
        await ctx.bridge.executeScript(markerScript);
        actionsDone.push('مارکر شروع سبک به تایم‌لاین افزوده شد.');
      } catch {}

      return {
        success: true,
        activeSkill: skill,
        actionsDone,
        instructionsForAI: skill.promptGuide,
        message: `مهارت جهانی "${skill.nameFa}" با موفقیت فعال شد. تدوین‌ها و کات‌های بعدی طبق این سبک اعمال خواهند شد.`
      };
    }
  }
];
