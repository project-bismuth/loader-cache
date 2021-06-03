export { default as CachePlugin } from './lib/plugin';
export {
	read, write, has, getFilename, ensureCacheReady, invalidateChildren,
} from './lib/cache';
