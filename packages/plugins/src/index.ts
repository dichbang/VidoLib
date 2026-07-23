export type PluginCategory =
  | 'stream'
  | 'container'
  | 'codec'
  | 'renderer'
  | 'audio'
  | 'subtitle'
  | 'abr'
  | 'drm'
  | 'telemetry'
  | 'os-integration'
  | 'ui';

export interface PluginContext {
  player: unknown;
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (payload?: unknown) => void): () => void;
  getConfig<T>(key: string, defaultValue?: T): T;
}

export interface MediaPlugin {
  readonly name: string;
  readonly category: PluginCategory;
  readonly version: string;

  init(ctx: PluginContext): void | Promise<void>;
  destroy?(): void | Promise<void>;
  onEvent?(event: string, payload?: unknown): void;
}

export class PluginRegistry {
  private plugins: Map<string, MediaPlugin> = new Map();
  private ctx?: PluginContext;

  public setContext(ctx: PluginContext): void {
    this.ctx = ctx;
  }

  public async register(plugin: MediaPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name '${plugin.name}' is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
    if (this.ctx) {
      await plugin.init(this.ctx);
    }
  }

  public async unregister(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    if (plugin.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(name);
    return true;
  }

  public get(name: string): MediaPlugin | undefined {
    return this.plugins.get(name);
  }

  public getByCategory(category: PluginCategory): MediaPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.category === category);
  }

  public dispatchEvent(event: string, payload?: unknown): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.onEvent) {
        try {
          plugin.onEvent(event, payload);
        } catch (err) {
          console.error(`Error handling event '${event}' in plugin '${plugin.name}':`, err);
        }
      }
    }
  }

  public async destroyAll(): Promise<void> {
    for (const name of Array.from(this.plugins.keys())) {
      await this.unregister(name);
    }
  }
}
