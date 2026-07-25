/**
 * Compatibility re-export.
 * Prefer importing from '@/lib/parsers' going forward.
 */
export { parseFile } from './parsers';
export { parseRepomix as parseRepomixXml } from './parsers/repomix';
export { parsePlainText } from './parsers/plain';
