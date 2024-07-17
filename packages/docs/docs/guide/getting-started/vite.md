---
sidebar_position: 3
title: Vite
---

# Vite Plugin

Below is an example of how to use AssetPack with Vite.

To see a full list of configuration options, see the [API Reference](/docs/guide/configuration).

```ts
// vite.config.mts
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { AssetPack } from '@assetpack/core';

function assetpackPlugin(): Plugin {
    const apConfig = {
        entry: './raw-assets',
        pipes: [
            // Add your pipes here
        ],
    };
    }
    let mode: ResolvedConfig['command'];
    let ap: AssetPack | undefined;

    return {
        name: 'vite-plugin-assetpack',
        configResolved(resolvedConfig) {
            mode = resolvedConfig.command;
            if (!resolvedConfig.publicDir) return;
            if (apConfig.output) return;
            const publicDir = resolvedConfig.publicDir.replace(process.cwd(), '');
            apConfig.output = `.${publicDir}/assets/`;
        },
        buildStart: async () => {
            if (mode === 'serve') {
                if (ap) return;
                ap = new AssetPack(apConfig);
                void ap.watch();
            } else {
                await new AssetPack(apConfig).run();
            }
        },
        buildEnd: async () => {
            if (ap) {
                await ap.stop();
                ap = undefined;
            }
        },
    };
}

export default defineConfig({
  plugins: [
    assetpackPlugin(),
  ],
})
```

