import objHash from 'object-hash';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

import {
	enableVerboseLogging, fileExists, log, logVerbose,
} from './utils';


interface CacheProps {
	inputHash: string;
	options: unknown;
	resource: string;
	ext?: string;
}


let isPrimed = false;
let cacheDir = '';
let cacheReadyPromise: Promise<void>;

// these are files without a clear relationship to a resource
// and potentially orphaned
const unknownFiles: string[] = [];

// this maps resources (the immediate files imported by webpack)
// to cache files attatched to them.
const cacheMap = new Map<string, string[]>();


function ensureCachePrimed() {
	if ( !isPrimed ) {
		throw new Error(
			'[@bsmth/loader-cache]: The cache management plugin is not running.',
		);
	}
}


export async function ensureCacheReady(): Promise<void> {
	ensureCachePrimed();

	return cacheReadyPromise;
}


export async function prime({
	cacheDir: _cacheDir,
	verbose,
}: {
	cacheDir: string;
	verbose: boolean;
}): Promise<void> {
	if ( verbose ) enableVerboseLogging();

	if ( cacheReadyPromise ) return cacheReadyPromise;

	logVerbose(
		`priming cache at ${_cacheDir}`,
	);

	cacheReadyPromise = ( async () => {
		if ( !isPrimed ) {
			cacheDir = _cacheDir;
			isPrimed = true;

			await fs.mkdir( cacheDir, { recursive: true });

			// flag all files currently in the cache dir as unknown
			// so they can be checked (and potentially cleared) later
			unknownFiles.push(
				...await fs.readdir( path.resolve( cacheDir ) ),
			);
		}

		logVerbose(
			`cache priming complete with ${unknownFiles.length} initial files`,
		);

		return Promise.resolve();
	})();

	return cacheReadyPromise;
}


export function invalidateChildren( resource: string ): void {
	if ( cacheMap.has( resource ) ) {
		// flag all files attached to the resource as unknown
		unknownFiles.push( ...cacheMap.get( resource ) );
		// and remove their parent.
		// this will result in them being deleted,
		// since they are now orphaned
		cacheMap.delete( resource );
	}
}


export async function clearStaleFiles( usedFiles: string[]): Promise<void[] | void> {
	ensureCachePrimed();

	const usedCacheFiles: string[] = [];
	const potentiallyStaleFiles: string[] = [
		...unknownFiles.map( f => path.resolve( cacheDir, f ) ),
	];

	// all unknown files will be checked. Since they
	// are no longer unknown, we can clear the list.
	unknownFiles.length = 0;

	logVerbose(
		`checking ${
			usedFiles.length
		} files appearing in the webpack compilation`,
	);

	// walk through all resources currently known to us
	// and see if they're still in use
	cacheMap.forEach( ( cacheFiles, key ) => {
		if ( usedFiles.includes( key ) ) {
			// if the resource is still there,
			// mark all children as used
			usedCacheFiles.push( ...cacheFiles );
		} else {
			// otherwise mark them for checking
			potentiallyStaleFiles.push( ...cacheFiles );
			// and remove the resource from our map
			cacheMap.delete( key );
		}
	});

	logVerbose(
		`found ${
			potentiallyStaleFiles.length
		} potentially stale files and ${
			usedCacheFiles.length
		} references`,
	);

	// check if the potentially stale files are used
	// by another resource
	const staleFiles = new Set(
		potentiallyStaleFiles.filter( file => !usedCacheFiles.includes( file ) ),
	);

	if ( staleFiles.size > 0 ) {
		logVerbose( `found ${staleFiles.size} stale files` );
		log( chalk.yellow( `deleting ${staleFiles.size} stale files...` ) );

		return Promise.all(
			Array.from( staleFiles.values() ).map( async ( file ) => {
				if ( await fileExists( file ) ) {
					return fs.unlink( file );
				}
				return Promise.resolve();
			}),
		);
	}

	logVerbose( 'found no stale files' );

	return Promise.resolve();
}


export function getFilename({
	inputHash,
	options,
	resource,
	ext = '',
}: CacheProps ): string {
	ensureCachePrimed();

	const name = path.resolve( cacheDir, `${inputHash}-${objHash( options )}${ext}` );

	// track the resource
	if ( !cacheMap.has( resource ) ) cacheMap.set( resource, []);
	// and the current file as a child
	cacheMap.get( resource ).push( name );

	return name;
}


export async function has( opts: CacheProps ): Promise<boolean> {
	ensureCachePrimed();

	return fileExists( getFilename( opts ) );
}


export async function read( opts: CacheProps ): Promise<{
	buffer: Buffer;
	path: string;
} | false> {
	ensureCachePrimed();

	// compute the cache file name from opts.
	// this also flags the file as 'in use'
	const fileName = getFilename( opts );

	if ( !await fileExists( fileName ) ) return false;

	logVerbose(
		`loading file related to ${opts.resource} from cache ${fileName}`,
	);

	return {
		buffer: await fs.readFile( fileName ),
		path: fileName,
	};
}


export async function write({
	buffer,
	...opts
}: CacheProps & { buffer: Buffer }): Promise<string> {
	ensureCachePrimed();

	// compute the cache file name from opts.
	// this also flags the file as 'in use'
	const fileName = getFilename( opts );

	logVerbose(
		`writing file related to ${opts.resource} to cache as ${fileName}`,
	);

	await fs.writeFile( fileName, buffer );

	return fileName;
}
