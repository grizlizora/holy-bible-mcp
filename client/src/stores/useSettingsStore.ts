import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChannelType = 'local' | 'api' | 'p2p';
export type LocalProvider = 'ollama' | 'lmstudio' | 'vllm';
export type ApiProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';

interface SettingsState {
  channelType: ChannelType;
  localProvider: LocalProvider;
  apiProvider: ApiProvider;
  selectedModel: string;
  isMobileSidebarOpen: boolean;
  
  mcpSettings: Record<string, Record<string, any>>;
  mcpConfigs: any[];
  activeMcpId: string | null;
  activeWarmthMcpId: string | null;
  activeModeMcpId: string | null;

  setChannelType: (channelType: ChannelType) => void;
  setLocalProvider: (provider: LocalProvider) => void;
  setApiProvider: (provider: ApiProvider) => void;
  setSelectedModel: (model: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  setMcpSetting: (mcpId: string, settingId: string, value: any) => void;
  setActiveMcpId: (id: string | null) => void;
  setActiveWarmthMcpId: (id: string | null) => void;
  setActiveModeMcpId: (id: string | null) => void;
  initializeMcpSettings: (configs: any[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      channelType: 'api',
      localProvider: 'ollama',
      apiProvider: 'openai',
      selectedModel: 'gpt-4o-mini',
      isMobileSidebarOpen: false,

      mcpSettings: {},
      mcpConfigs: [],
      activeMcpId: null,
      activeWarmthMcpId: null,
      activeModeMcpId: null,

      setChannelType: (channelType) => set({ channelType }),
      setLocalProvider: (localProvider) => set({ localProvider }),
      setApiProvider: (apiProvider) => set({ apiProvider }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      setMcpSetting: (mcpId, settingId, value) => set((state) => ({
        mcpSettings: {
          ...state.mcpSettings,
          [mcpId]: {
            ...state.mcpSettings[mcpId],
            [settingId]: value
          }
        }
      })),

      setActiveMcpId: (id) => set({ activeMcpId: id }),
      setActiveWarmthMcpId: (id) => set({ activeWarmthMcpId: id }),
      setActiveModeMcpId: (id) => set({ activeModeMcpId: id }),

      initializeMcpSettings: (configs) => set((state) => {
        const newSettings = { ...state.mcpSettings };
        let activeId = state.activeMcpId;
        let wId = state.activeWarmthMcpId;
        let mId = state.activeModeMcpId;

        configs.forEach(config => {
          const validIds = new Set((config.settings || []).map((s: any) => s.id));

          if (!newSettings[config.id]) {
            // First time: initialize with defaults
            newSettings[config.id] = {};
            config.settings?.forEach((s: any) => {
              newSettings[config.id][s.id] = s.defaultValue;
            });
          } else {
            // Already exists: prune keys not in new config, add missing defaults
            const pruned: Record<string, any> = {};
            for (const key of Object.keys(newSettings[config.id])) {
              if (validIds.has(key)) pruned[key] = newSettings[config.id][key];
              // keys like bibleTranslations, includeStrongs that no longer exist are silently dropped
            }
            config.settings?.forEach((s: any) => {
              if (!(s.id in pruned)) pruned[s.id] = s.defaultValue;
            });
            newSettings[config.id] = pruned;
          }
        });

        if (!activeId && configs.length > 0) {
          activeId = configs[0].id;
        } else if (activeId && !configs.find(c => c.id === activeId) && configs.length > 0) {
          activeId = configs[0].id;
        }
        
        if (!wId && activeId) wId = activeId;
        if (!mId && activeId) mId = activeId;

        // Always replace mcpConfigs with the latest from server
        return { mcpSettings: newSettings, activeMcpId: activeId, activeWarmthMcpId: wId, activeModeMcpId: mId, mcpConfigs: configs };
      }),

    }),
    {
      name: 'liquid-ai-settings-v3',
    }
  )
);
