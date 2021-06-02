import type { Compiler, NormalModule } from 'webpack';

import { clearStaleFiles, ensureCacheReady, prime } from './cache';


interface CachePluginProps {
	enabled: boolean;
	deleteUnusedFiles: boolean;
	aggressive: boolean;
	cacheDir: string;
	verbose: boolean;
}

export default class BismuthCachePlugin {
	private enabled: boolean;
	private deleteUnusedFiles: boolean;
	private aggressive: boolean;
	private runs = 0;

	constructor({
		enabled = true,
		deleteUnusedFiles = true,
		aggressive = true,
		cacheDir = '.bsmth-loader-cache',
		verbose = false,
	}: Partial<CachePluginProps> = {}) {
		this.enabled = enabled;
		this.deleteUnusedFiles = deleteUnusedFiles;
		this.aggressive = aggressive;

		prime({
			cacheDir,
			verbose,
		});
	}

	apply( compiler: Compiler ): void {
		if ( this.enabled ) {
			compiler.hooks.done.tapAsync(
				'BismuthCachePlugin', async ( stats, cb: () => void ) => {
					await ensureCacheReady();

					if (
						this.deleteUnusedFiles
						&& ( this.aggressive || ( this.runs < 1 ) )
						// skip if theres an error,
						// as the list of modules may be incomplete
						&& stats.compilation.errors.length === 0
					) {
						this.runs += 1;

						// provide the cache with a list of
						// resources included in the current compilation
						await clearStaleFiles(
							Array.from(
								stats.compilation.modules,
							).map(
								( m: NormalModule ) => m.userRequest,
							),
						);
					}

					cb();
				},
			);
		}
	}
}
