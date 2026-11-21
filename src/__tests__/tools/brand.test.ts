import { brandTools, loadBrandKits, saveBrandKits, getActiveBrandKit } from '../../tools/domains/brand.js';

describe('brandTools', () => {
  it('exposes brand kit management tools', () => {
    const names = brandTools.map(t => t.name);
    expect(names).toContain('brand_kit_get');
    expect(names).toContain('brand_kit_list');
    expect(names).toContain('brand_kit_save');
    expect(names).toContain('brand_kit_apply');
  });

  it('brand_kit_list returns available brand kits', async () => {
    const listTool = brandTools.find(t => t.name === 'brand_kit_list')!;
    const res = await (listTool.run as any)({} as any, {});
    expect(res.success).toBe(true);
    expect(Array.isArray(res.brandKits)).toBe(true);
    expect(res.brandKits.length).toBeGreaterThan(0);
  });

  it('brand_kit_get returns default brand kit when id is not specified', async () => {
    const getTool = brandTools.find(t => t.name === 'brand_kit_get')!;
    const res = await (getTool.run as any)({} as any, {});
    expect(res.success).toBe(true);
    expect(res.brandKit).toBeDefined();
    expect(res.brandKit.colors.primary).toBeDefined();
  });

  it('brand_kit_save saves a custom brand kit profile', async () => {
    const saveTool = brandTools.find(t => t.name === 'brand_kit_save')!;
    const res = await (saveTool.run as any)({} as any, {
      id: 'test_brand',
      name: 'Test Brand Studio',
      primaryColor: '#FF0055',
      headingFont: 'Yekan Bakh',
      watermarkPosition: 'top-left'
    });
    expect(res.success).toBe(true);
    expect(res.brandKit.id).toBe('test_brand');
    expect(res.brandKit.colors.primary).toBe('#FF0055');
  });
});
