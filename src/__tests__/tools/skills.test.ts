import { skillsTools, WORLD_CLASS_EDITING_SKILLS, getActiveEditingSkill, setActiveEditingSkill } from '../../tools/domains/skills.js';

describe('skillsTools', () => {
  it('exposes world-class editing skills tools', () => {
    const names = skillsTools.map(t => t.name);
    expect(names).toContain('editing_skill_list');
    expect(names).toContain('editing_skill_get');
    expect(names).toContain('editing_skill_apply');
  });

  it('contains curated world-class editing skills', () => {
    const ids = WORLD_CLASS_EDITING_SKILLS.map(s => s.id);
    expect(ids).toContain('hormozi_kinetic');
    expect(ids).toContain('mrbeast_retention');
    expect(ids).toContain('ali_abdaal_aesthetic');
    expect(ids).toContain('vox_documentary');
    expect(ids).toContain('mkbhd_minimal_tech');
    expect(ids).toContain('podcast_master');
  });

  it('editing_skill_list returns all skills with metadata', async () => {
    const listTool = skillsTools.find(t => t.name === 'editing_skill_list')!;
    const res = await (listTool.run as any)({} as any, {});
    expect(res.success).toBe(true);
    expect(Array.isArray(res.skills)).toBe(true);
    expect(res.skills.length).toBe(6);
    expect(res.activeSkillId).toBeDefined();
  });

  it('editing_skill_get returns detailed rules for a given skill', async () => {
    const getTool = skillsTools.find(t => t.name === 'editing_skill_get')!;
    const res = await (getTool.run as any)({} as any, { id: 'mrbeast_retention' });
    expect(res.success).toBe(true);
    expect(res.skill.id).toBe('mrbeast_retention');
    expect(res.skill.rules.cutCadenceSeconds.min).toBe(1.5);
    expect(res.skill.rules.silenceThresholdDb).toBe(-35);
  });

  it('editing_skill_apply activates a world-class skill and returns directives', async () => {
    const mockBridge = {
      executeScript: jest.fn().mockResolvedValue({ success: true })
    };
    const applyTool = skillsTools.find(t => t.name === 'editing_skill_apply')!;
    const res = await (applyTool.run as any)({ bridge: mockBridge } as any, { id: 'ali_abdaal_aesthetic' });
    expect(res.success).toBe(true);
    expect(res.activeSkill.id).toBe('ali_abdaal_aesthetic');
    expect(res.instructionsForAI).toContain('Yekan Bakh');
  });
});
