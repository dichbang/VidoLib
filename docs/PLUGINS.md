# media-runtime Plugin Authoring Guide

## Overview

In `media-runtime`, every capability is a plugin. The core package (`@media-runtime/core`) ships with zero decoders or renderers out of the box and weighs under 150KB gzipped.

## Creating a Plugin

Implement the `MediaPlugin` interface from `@media-runtime/plugins`:

```typescript
import { MediaPlugin, PluginContext } from '@media-runtime/plugins';

export class MyCustomPlugin implements MediaPlugin {
  public readonly name = 'my-custom-plugin';
  public readonly category = 'telemetry'; // 'stream' | 'container' | 'codec' | 'renderer' | 'audio' | 'subtitle' | 'abr' | 'drm' | 'telemetry' | 'os-integration' | 'ui'
  public readonly version = '1.0.0';

  public init(ctx: PluginContext): void {
    console.log('Plugin initialized');

    ctx.on('playing', () => {
      console.log('Media playback started!');
    });
  }

  public destroy(): void {
    console.log('Plugin cleaned up');
  }
}
```

## Registering with Player

```typescript
import { Player } from '@media-runtime/core';
import { MyCustomPlugin } from './MyCustomPlugin';

const player = new Player();
await player.use(new MyCustomPlugin());
```
