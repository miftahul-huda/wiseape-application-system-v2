const fallbackThemes = [
  { id: 'light-blue', name: 'Light Blue', bg1: '#bfe3ff', bg2: '#eaf6ff', accent: '#0ea5e9', accentDark: '#0284c7', defaultBackground: null },
  { id: 'dark-obsidian', name: 'Dark Obsidian', bg1: '#0f172a', bg2: '#020617', accent: '#64748b', accentDark: '#334155', defaultBackground: null },
  { id: 'midnight', name: 'Midnight', bg1: '#1e293b', bg2: '#0f172a', accent: '#978ab4ff', accentDark: '#5110b3ff', defaultBackground: null },
  { id: 'emerald', name: 'Emerald', bg1: '#064e3b', bg2: '#022c22', accent: '#10b981', accentDark: '#047857', defaultBackground: null },
  { id: 'amber', name: 'Amber', bg1: '#451a03', bg2: '#1a0901', accent: '#f59e0b', accentDark: '#b45309', defaultBackground: null },
  { id: 'sunset', name: 'Sunset Orange', bg1: '#fb923c', bg2: '#db2777', accent: '#f97316', accentDark: '#c2410c', defaultBackground: null },
  { id: 'forest', name: 'Forest Green', bg1: '#4ade80', bg2: '#064e3b', accent: '#22c55e', accentDark: '#15803d', defaultBackground: null },
];

class ApiThemeRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  getFallbackThemes() {
    return fallbackThemes.map((theme) => ({ ...theme }));
  }

  async listThemes() {
    try {
      const response = await fetch(`${this.baseUrl}/api/themes`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const themes = data.themes || [];
      if (themes.length === 0) {
        return this.getFallbackThemes();
      }

      return themes;
    } catch (error) {
      console.warn('[WAS] Theme API unavailable; loading fallback theme list.', error.message);
      return this.getFallbackThemes();
    }
  }
}

module.exports = ApiThemeRepository;
