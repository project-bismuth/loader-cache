import chalk from 'chalk';
import * as fs from 'fs';


let shouldLogVerbosely = false;

export function enableVerboseLogging(): void {
	shouldLogVerbosely = true;
}


export function log( msg: string ): void {
	// eslint-disable-next-line no-console
	console.log( `${chalk.dim( '[@bsmth/loader-cache]:' )} ${msg}` );
}


export function logVerbose( msg: string ): void {
	if ( shouldLogVerbosely ) log( msg );
}


export async function fileExists(
	file: string,
): Promise<boolean> {
	return fs.promises.access( file, fs.constants.F_OK )
		.then( () => true )
		.catch( () => false );
}
