import { StateCreator } from 'zustand';
import { 
  SettingsState, 
  LocalProviderConfig, 
  CloudProviderConfig, 
  CloudModelConfig, 
  ProviderHealthStatus 
} from '@/types/settings';
import { DEFAULT_LOCAL_PROVIDERS, DEFAULT_CLOUD_PROVIDERS } from '../default-providers';
import { getAppSettingsAction } from '@/lib/actions/settings.actions';

export interface ProviderSliceState {
  activeLocalProviderId: string;
  activeCloudProviderId: string;
  localProviders: LocalProviderConfig[];
  cloudProviders: CloudProviderConfig[];
  localProvider: string;
  apiProvider: string;

  setLocalProvider: (providerStr: string) => void;
  setApiProvider: (providerStr: string) => void;
  setActiveLocalProviderId: (id: string) => void;
  setActiveCloudProviderId: (id: string) => void;

  addLocalProvider: (provider: Partial<LocalProviderConfig>) => string;
  updateLocalProvider: (id: string, patch: Partial<LocalProviderConfig>) => void;
  deleteLocalProvider: (id: string) => void;
  setLocalProviderModels: (id: string, models: string[] | any[]) => void;
  setLocalProviderStatus: (id: string, status: ProviderHealthStatus, latencyMs?: number, lastError?: string) => void;

  addCloudProvider: (provider: Partial<CloudProviderConfig>) => string;
  updateCloudProvider: (id: string, patch: Partial<CloudProviderConfig>) => void;
  deleteCloudProvider: (id: string) => void;
  setProviderApiKey: (providerId: string, apiKey: string) => void;
  setCloudProviderModels: (providerId: string, models: (string | CloudModelConfig)[]) => void;
  setCloudProviderStatus: (id: string, status: ProviderHealthStatus, latencyMs?: number, lastError?: string) => void;
  addModelToProvider: (target: 'local' | 'cloud', providerId: string, model: string | CloudModelConfig) => void;
  removeModelFromProvider: (target: 'local' | 'cloud', providerId: string, modelId: string) => void;
  clearCloudProviderModels: (providerId: string) => void;
  resetCloudProviderModels: (providerId: string) => void;

  syncFromSqlite: () => Promise<void>;
  autoPrewarmAndDiscoverAll: () => Promise<void>;
}

export const createProviderSlice: StateCreator<
  SettingsState,
  [],
  [],
  ProviderSliceState
> = (set, get) => ({
  activeLocalProviderId: 'ollama',
  activeCloudProviderId: 'openai',
  localProviders: DEFAULT_LOCAL_PROVIDERS,
  cloudProviders: DEFAULT_CLOUD_PROVIDERS,
  localProvider: 'ollama',
  apiProvider: 'openai',

  setLocalProvider: (providerStr: string) => {
    const list = get()?.localProviders || DEFAULT_LOCAL_PROVIDERS;
    const match = list.find(p => p.type === providerStr || p.id === providerStr || p.name?.toLowerCase() === providerStr.toLowerCase());
    if (match) {
      set({ activeLocalProviderId: match.id, localProvider: match.type || match.id });
    }
  },
  setApiProvider: (providerStr: string) => {
    const list = get()?.cloudProviders || DEFAULT_CLOUD_PROVIDERS;
    const match = list.find(p => p.type === providerStr || p.id === providerStr || p.name?.toLowerCase() === providerStr.toLowerCase());
    if (match) {
      set({ activeCloudProviderId: match.id, apiProvider: match.type || match.id });
    }
  },

  setActiveLocalProviderId: (activeLocalProviderId) => {
    const list = get()?.localProviders || DEFAULT_LOCAL_PROVIDERS;
    const match = list.find(p => p.id === activeLocalProviderId);
    set({ activeLocalProviderId, localProvider: match?.type || 'ollama' });
  },
  setActiveCloudProviderId: (activeCloudProviderId) => {
    const list = get()?.cloudProviders || DEFAULT_CLOUD_PROVIDERS;
    const match = list.find(p => p.id === activeCloudProviderId);
    set({ activeCloudProviderId, apiProvider: match?.type || 'openai' });
  },

  addLocalProvider: (provider) => {
    const id = provider.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProvider: LocalProviderConfig = {
      ...provider,
      id,
      models: provider.models || [],
      enabled: provider.enabled ?? true,
      status: 'untested'
    };
    set((state) => ({ localProviders: [...state.localProviders, newProvider] }));
    return id;
  },
  updateLocalProvider: (id, patch) => set((state) => ({
    localProviders: state.localProviders.map((p) => (p.id === id ? { ...p, ...patch } : p))
  })),
  deleteLocalProvider: (id) => set((state) => {
    const filtered = state.localProviders.filter((p) => p.id !== id);
    const newActiveId = state.activeLocalProviderId === id ? (filtered[0]?.id || '') : state.activeLocalProviderId;
    const match = filtered.find(p => p.id === newActiveId);
    return {
      localProviders: filtered,
      activeLocalProviderId: newActiveId,
      localProvider: match?.type || 'ollama'
    };
  }),
  setLocalProviderModels: (id, models) => set((state) => {
    const existing = state.localProviders.find((p) => p.id === id);
    if (existing) {
      const oldStr = (existing.models || []).map((m: any) => typeof m === 'string' ? m : m.id).join(',');
      const newStr = (models || []).map((m: any) => typeof m === 'string' ? m : m.id).join(',');
      if (oldStr === newStr && existing.status === 'online') return state;
    }
    return {
      localProviders: state.localProviders.map((p) =>
        p.id === id ? { ...p, models, lastTestedAt: Date.now(), status: 'online' } : p
      )
    };
  }),
  setLocalProviderStatus: (id, status, latencyMs, lastError) => set((state) => {
    const existing = state.localProviders.find((p) => p.id === id);
    if (
      existing &&
      existing.status === status &&
      existing.lastError === (lastError !== undefined ? lastError : existing.lastError) &&
      (latencyMs === undefined || Math.abs((existing.latencyMs || 0) - latencyMs) < 60)
    ) {
      return state;
    }
    return {
      localProviders: state.localProviders.map((p) =>
        p.id === id ? { ...p, status, latencyMs, lastError: lastError !== undefined ? lastError : (status === 'online' ? undefined : p.lastError), lastTestedAt: Date.now() } : p
      )
    };
  }),

  addCloudProvider: (provider) => {
    const id = provider.id || `cloud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProvider: CloudProviderConfig = {
      ...provider,
      id,
      models: provider.models || [],
      enabled: provider.enabled ?? true,
      status: 'untested'
    };
    set((state) => ({ cloudProviders: [...state.cloudProviders, newProvider] }));
    return id;
  },
  updateCloudProvider: (id, patch) => set((state) => ({
    cloudProviders: state.cloudProviders.map((p) => (p.id === id ? { ...p, ...patch } : p))
  })),
  deleteCloudProvider: (id) => set((state) => {
    const filtered = state.cloudProviders.filter((p) => p.id !== id);
    const newActiveId = state.activeCloudProviderId === id ? (filtered[0]?.id || '') : state.activeCloudProviderId;
    const match = filtered.find(p => p.id === newActiveId);
    return {
      cloudProviders: filtered,
      activeCloudProviderId: newActiveId,
      apiProvider: match?.type || 'openai'
    };
  }),
  setProviderApiKey: (providerId, apiKey) => set((state) => ({
    cloudProviders: state.cloudProviders.map((p) =>
      p.id === providerId ? { ...p, apiKey, status: apiKey ? 'untested' : 'invalid' } : p
    )
  })),
  setCloudProviderModels: (providerId, models) => set((state) => {
    const existing = state.cloudProviders.find((p) => p.id === providerId);
    if (existing) {
      const oldStr = (existing.models || []).map((m: any) => typeof m === 'string' ? m : m.id).join(',');
      const newStr = (models || []).map((m: any) => typeof m === 'string' ? m : m.id).join(',');
      if (oldStr === newStr && existing.status === 'online') return state;
    }
    return {
      cloudProviders: state.cloudProviders.map((p) =>
        p.id === providerId ? { ...p, models, lastTestedAt: Date.now(), status: 'online' } : p
      )
    };
  }),
  setCloudProviderStatus: (id, status, latencyMs, lastError) => set((state) => {
    const existing = state.cloudProviders.find((p) => p.id === id);
    if (
      existing &&
      existing.status === status &&
      existing.lastError === (lastError !== undefined ? lastError : existing.lastError) &&
      (latencyMs === undefined || Math.abs((existing.latencyMs || 0) - latencyMs) < 60)
    ) {
      return state;
    }
    return {
      cloudProviders: state.cloudProviders.map((p) =>
        p.id === id ? { ...p, status, latencyMs, lastError: lastError !== undefined ? lastError : (status === 'online' ? undefined : p.lastError), lastTestedAt: Date.now() } : p
      )
    };
  }),
  addModelToProvider: (target, providerId, model) => set((state) => {
    if (target === 'local') {
      const modelName = (typeof model === 'string' ? model : model.name || model.id || '').trim();
      if (!modelName) return state;
      return {
        localProviders: state.localProviders.map((p) => {
          if (p.id !== providerId) return p;
          const currentModels = Array.isArray(p.models) ? p.models : [];
          if (currentModels.includes(modelName)) return p;
          return { ...p, models: [...currentModels, modelName] };
        })
      };
    } else {
      const rawId = typeof model === 'string' ? model : (model.id || model.name || '');
      const cleanId = rawId.replace(/["']/g, '').trim();
      if (!cleanId) return state;
      const rawName = typeof model === 'string' ? model : (model.name || model.id || cleanId);
      const cleanName = rawName.trim() || cleanId;
      const modelConfig: CloudModelConfig = typeof model === 'string' 
        ? { id: cleanId, name: cleanName, isCustom: true }
        : { ...model, id: cleanId, name: cleanName, isCustom: true };

      return {
        cloudProviders: state.cloudProviders.map((p) => {
          if (p.id !== providerId) return p;
          const currentModels = Array.isArray(p.models) ? p.models : [];
          const exists = currentModels.some((m) => (typeof m === 'string' ? m : m.id) === cleanId);
          return exists
            ? { ...p, models: currentModels.map((m) => ((typeof m === 'string' ? m : m.id) === cleanId ? modelConfig : m)) }
            : { ...p, models: [...currentModels, modelConfig] };
        })
      };
    }
  }),
  removeModelFromProvider: (target, providerId, modelId) => set((state) => {
    if (target === 'local') {
      return {
        localProviders: state.localProviders.map((p) =>
          p.id === providerId ? { ...p, models: (Array.isArray(p.models) ? p.models : []).filter((m) => (typeof m === 'string' ? m : (m as any).id) !== modelId) } : p
        )
      };
    } else {
      return {
        cloudProviders: state.cloudProviders.map((p) =>
          p.id === providerId ? { ...p, models: (Array.isArray(p.models) ? p.models : []).filter((m) => (typeof m === 'string' ? m : m.id) !== modelId) } : p
        )
      };
    }
  }),
  clearCloudProviderModels: (providerId) => set((state) => ({
    cloudProviders: state.cloudProviders.map((p) =>
      p.id === providerId ? { ...p, models: [] } : p
    )
  })),
  resetCloudProviderModels: (providerId) => set((state) => {
    const defaultProvider = DEFAULT_CLOUD_PROVIDERS.find((p) => p.id === providerId);
    if (!defaultProvider) return state;
    return {
      cloudProviders: state.cloudProviders.map((p) =>
        p.id === providerId ? { ...p, models: defaultProvider.models } : p
      )
    };
  }),

  syncFromSqlite: async () => {
    if (typeof window === 'undefined') return;
    try {
      let settingsData: any = null;
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const res = await response.json();
          settingsData = res.settings;
        }
      } catch {
        const res = await getAppSettingsAction();
        settingsData = res?.settings;
      }

      if (settingsData) {
        const persisted = settingsData.state || settingsData;
        if (persisted) {
          set((state) => {
            const currentClouds = state.cloudProviders || [];
            const savedClouds = Array.isArray(persisted.cloudProviders) ? persisted.cloudProviders : [];
            
            const mergedClouds = currentClouds.map((cp) => {
              const saved = savedClouds.find((p: any) => p.id === cp.id);
              if (!saved) return cp;
              const finalKey = (saved.apiKey && saved.apiKey.trim()) || (cp.apiKey && cp.apiKey.trim()) || '';
              const mergedModels = Array.isArray(saved.models) && saved.models.length > 0 ? saved.models : cp.models;
              return {
                ...cp,
                ...saved,
                apiKey: finalKey,
                models: mergedModels,
                status: finalKey ? (cp.status === 'online' ? 'online' : saved.status || 'untested') : 'untested'
              };
            });

            const customSaved = savedClouds.filter((p: any) => !currentClouds.some((c) => c.id === p.id));
            const allClouds = [...mergedClouds, ...customSaved];

            const currentLocals = state.localProviders || [];
            const savedLocals = Array.isArray(persisted.localProviders) ? persisted.localProviders : [];
            const mergedLocals = currentLocals.map((lp) => {
              const saved = savedLocals.find((p: any) => p.id === lp.id);
              if (!saved) return lp;
              return {
                ...lp,
                ...saved,
                models: Array.isArray(saved.models) && saved.models.length > 0 ? saved.models : lp.models
              };
            });
            const customLocals = savedLocals.filter((p: any) => !currentLocals.some((c) => c.id === p.id));
            const allLocals = [...mergedLocals, ...customLocals];

            const activeLocalId = persisted.activeLocalProviderId || state.activeLocalProviderId;
            const activeCloudId = persisted.activeCloudProviderId || state.activeCloudProviderId;
            const localMatch = allLocals.find(p => p.id === activeLocalId);
            const cloudMatch = allClouds.find(p => p.id === activeCloudId);

            return {
              cloudProviders: allClouds,
              localProviders: allLocals,
              selectedModel: persisted.selectedModel || state.selectedModel,
              activeCloudProviderId: activeCloudId,
              activeLocalProviderId: activeLocalId,
              localProvider: localMatch?.type || 'ollama',
              apiProvider: cloudMatch?.type || 'openai',
              channelType: persisted.channelType || state.channelType
            };
          });
        }
      }
    } catch (err) {
      console.warn('[SETTINGS SYNC] Failed to sync from SQLite:', err);
    }
  },

  autoPrewarmAndDiscoverAll: async () => {
    if (typeof window === 'undefined') return;
    const state = get();

    await state.syncFromSqlite().catch(() => {});
    const updatedState = get();

    const localPromises = (updatedState.localProviders || []).filter((lp) => lp.enabled).map(async (lp) => {
      try {
        const { fetchProviderModelsAction, pingProviderAction } = await import('@/lib/actions/provider.actions');
        const [modelsRes, pingRes] = await Promise.allSettled([
          fetchProviderModelsAction(lp.baseUrl, lp.type, lp.apiKey),
          pingProviderAction(lp.baseUrl, lp.type, lp.apiKey)
        ]);

        if (modelsRes.status === 'fulfilled' && Array.isArray(modelsRes.value?.models) && modelsRes.value.models.length > 0) {
          state.setLocalProviderModels(lp.id, modelsRes.value.models as any);
        }

        if (pingRes.status === 'fulfilled' && pingRes.value) {
          const p = pingRes.value;
          state.setLocalProviderStatus(lp.id, p.ok ? 'online' : 'offline', p.latencyMs, p.error);
        } else if (modelsRes.status === 'fulfilled' && modelsRes.value?.models?.length) {
          state.setLocalProviderStatus(lp.id, 'online', 12);
        }
      } catch (_) {}
    });

    const cloudPromises = (updatedState.cloudProviders || []).filter((cp) => cp.enabled && cp.apiKey && cp.apiKey.trim().length > 5).map(async (cp) => {
      try {
        const { pingProviderAction } = await import('@/lib/actions/provider.actions');
        const res = await pingProviderAction(cp.baseUrl, cp.type, cp.apiKey);
        if (res) {
          state.setCloudProviderStatus(cp.id, res.ok ? 'online' : 'offline', res.latencyMs, res.error);
        }
      } catch (_) {}
    });

    const mcpPromise = (async () => {
      try {
        const res = await fetch('/api/mcp/configs');
        if (res.ok) {
          const data = await res.json();
          const configs = Array.isArray(data) ? data : (Array.isArray(data?.configs) ? data.configs : []);
          if (configs.length > 0) {
            state.initializeMcpSettings(configs);
          }
        }
      } catch (_) {}
    })();

    await Promise.allSettled([...localPromises, ...cloudPromises, mcpPromise]);
  }
});
