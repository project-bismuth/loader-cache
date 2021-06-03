# bismuth loader cache

> Disk caching utils used internally by `@bsmth` webpack loaders.

## Motivations

Dealing with images can be really messy, when you have to support multiple resolutions, formats and compression levels. `@bsmth/img-loader` attempts to solve this by doing all conversions, resizing and compressions automatically and on demand, when you import an image.

---

## Installation

```
yarn add --dev @bsmth/loader-cache
```

```
npm i --save-dev @bsmth/loader-cache
```

---

## Setup

You need to add the loader and this cache management plugin to your webpack config.

```typescript
import { CachePlugin } from "@bsmth/loader-cache";

export default {
	plugins: [
		// ...
		new CachePlugin({
			// ...
		}),
	],
};
```

---

## Options

Some `@bsmth` loaders will cache processed images and intermediates on disk. To manage the cache (e.g. to auto clear stale files) we provides a `CachePlugin` which accepts the following options:

| Name                | Type      | Default                 | Description                                                  |
| ------------------- | --------- | ----------------------- | ------------------------------------------------------------ |
| `enabled`           | `boolean` | `true`                  | an easy way to disable the plugin conditionally              |
| `cacheDir`          | `string`  | `'.bsmth-loader-cache'` | specifies the cache directory                                |
| `deleteUnusedFiles` | `boolean` | `true`                  | whether to auto delete unused cache files                    |
| `aggressive`        | `boolean` | `true`                  | toggles aggressive cache cleaning. If `true`, the plugin will check for and delete stale files on every change.<br>This may be undesirable, for example when testing/comparing different quality renditions, since the assets will be rebuilt every time.<br>Disabling this option instructs the plugin to only check and clean once on startup. |
| `verbose`           | `boolean` | `false`                 | toggles verbose logging                                      |

---

## Inner workings

```typescript
import { 
  read, 
  write, 
  has, 
  getFilename, 
  invalidateChildren, 
  ensureCacheReady 
} from '@bsmth/loader-cache';
```

This area is ment for internal documentation in the future.

## License

© 2021 the project bismuth authors, licensed under MIT.
