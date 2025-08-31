#!/usr/bin/env node

/**
 * Module for renaming thermal imaging photos by reference fom PDF.
 * Rename photos using "<NAME> TI-<REF>" line in a PDF.
 * Example in PDF: "DB-A/SH TI-41791"
 * Result for file "FLIR4179.jpg" -> "DB-A-SH.jpg"
 */

const fs = require('fs/promises');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Parse command line arguments into a configuration object.
 *
 * Flags:
 *   --pdf <path>       : Path to the PDF with "<NAME> TI-<REF>" lines (required)
 *   --photos <dir>     : Directory containing images to rename (required)
 *   --out <dir>        : Output directory (default: ./renamed_output)
 *   --apply            : Perform writes (otherwise dry-run)
 *   --refDigits <num>  : How many leading digits to keep when trimming PDF refs (default: 4)
 *   --inplace          : Rename originals in place instead of copying to --out
 *   --inspect            : Print debugging info (detected refs in filenames)
 *   --showMap          : Print all keys stored in the ref→name map
 *
 * @param {string[]} argv - Raw process.argv
 * @returns {{
 *   pdfPath: string | null,
 *   photosDir: string | null,
 *   outputDir: string,
 *   dryRun: boolean,
 *   refDigits: number,
 *   inplace: boolean,
 *   debug: boolean,
 *   showMap: boolean
 * }}
 * @throws {Error} when required flags are missing
 */
function parseArgs(argv) {
    const args = {
        pdfPath: null,
        photosDir: null,
        outputDir: path.join(process.cwd(), 'renamed_output'),
        dryRun: true, // safe by default - nothing is written unless --apply
        refDigits: 4, // "keep the first N digits" when PDF has longer TI refs
        inplace: false, // false = copy to out dir, true = rename originals
        debug: false,
        showMap: false,
    };

    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--pdf') {
            args.pdfPath = argv[++i];
        } else if (a === '--photos') {
            args.photosDir = argv[++i];
        } else if (a === '--out') {
            args.outputDir = argv[++i];
        } else if (a === '--apply') {
            args.dryRun = false;
        } else if (a === '--refDigits') {
            args.refDigits = Number(argv[++i] || 4);
        } else if (a === '--inplace') {
            args.inplace = true;
        } else if (a === '--inspect') {
            args.debug = true;
        } else if (a === '--showMap') {
            args.showMap = true;
        }
    }

    if (!args.pdfPath) throw new Error('Missing --pdf path');
    if (!args.photosDir) throw new Error('Missing --photos directory');
    if (!args.inplace && !args.outputDir) throw new Error('Missing --out directory');

    return args;
}

/* ------------------------------- Helpers -------------------------------- */

/**
 * Read a PDF file and return its extracted text.
 *
 * @param {string} pdfPath - Path to the PDF file.
 * @returns {Promise<string>} PDF text content (or empty string if none)
 */
async function readPdfText(pdfPath) {
    const buffer = await fs.readFile(pdfPath);
    const data = await pdf(buffer);
    return data.text || '';
}

/**
 * Split raw text into trimmed, non-empty lines. This normalizes whitespace
 * and makes pattern-matching simpler.
 *
 * @param {string} text - Raw text content
 * @returns {string[]} Array of non-empty, trimmed lines
 */
function splitNonEmptyLines(text) {
    return text
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Extract pairs strictly from "<NAME> TI-<REF>" lines.
 * This is the core parsing. It pulls both the full ref and
 * a trimmed ref (first refDigits digits) to bridge
 * PDF’s 5-digit TI (41791) to filename’s 4-digit TI (4179).
 *
 * Format examples:
 *   "DB-A/SH TI-41791"      -> { name: "DB-A/SH", ref: "41791", trimmedRef: "4179" }
 *   "DB Reception TI-4181"  -> { name: "DB Reception", ref: "4181", trimmedRef: "4181" }
 *
 * Regex explained:
 *   ^(.*?)\s+    -> capture the name part (everything up to whitespace before TI)
 *   TI[-\s]?     -> allow "TI-" or "TI " as separator
 *   (\d{3,})     -> capture 3 or more digits (the reference number)
 *   (?:\s+\d+)?  -> optional trailing index (ignored)
 *   \s*$         -> allow trailing whitespace
 *
 * @param {string[]} lines - Lines of text extracted from PDF
 * @param {number} refDigits - How many leading digits to keep when trimming refs
 * @returns {{ name: string, ref: string, trimmedRef: string}[]}
 */
function extractPairsNameTiOnly(lines, refDigits = 4) {
    const results = [];
    const pattern = /^(.*?)\s+TI[-\s]?(\d{3,})(?:\s+\d+)?\s*$/i;

    for (const raw of lines) {
        const line = raw.trim();
        const match = line.match(pattern);
        if (!match) {
            continue;
        }

        const name = match[1].trim();
        const fullRef = match[2].trim();
        const trimmedRef = fullRef.slice(0, refDigits);

        results.push({ name, ref: fullRef, trimmedRef });
    }

    return results;
}

/**
 * Make a string safe to use as a Windows filename.
 * - Replaces illegal characters (\ / : * ? " < > |) with '-'
 * - Collapses multiple spaces to single space
 * - Trims leading/trailing whitespace
 *
 * @param {string} string - Raw name in pdf
 * @returns {string} Sanitized, Windows-safe filename base
 */
function sanitizeWindowsName(string) {
    return string
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Ensure a directory exists (creates it recursively if missing).
 *
 * @param {string} dir - Directory path
 * @returns {Promise<void>}
 */
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

/**
 * List image files (by extension) in a directory.
 * Supported extensions: jpg, jpeg, png, webp, tif, tiff, bmp (case-insensitive).
 *
 * @param {string} dir - Directory to scan
 * @returns {Promise<string[]>} Full paths to image files
 */
async function listImages(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    return entries
        .filter(entry => entry.isFile())
        .map(entry => path.join(dir, entry.name))
        .filter(path => /\.(jpe?g|png|webp|tiff?|bmp)$/i.test(path));
}

/**
 * Find all numeric substrings of length >= minDigits inside a string.
 * Used to detect candidate reference numbers inside filenames.
 *
 * Examples:
 *      findAllRefsInString("FLIR4179.jpg", 4) -> ["4179"]
 *      findAllRefsInString("IMG_20240823_41791", 4) -> ["20240823", "41791"]
 *
 * @param {string} string - String to scan (e.g., a filename)
 * @param {number} minDigits - Minimum digits per group
 * @returns {string[]} All digit groups meeting the minimum length
 */
function findAllRefsInString(string, minDigits) {
    const out = [];
    const regex = new RegExp(`\\d{${minDigits},}`, 'g');
    let match;

    while ((match = regex.exec(string)) !== null) {
        out.push(match[0]);
    }

    return out;
}

/**
 * Given a filename, choose the most plausible reference number by:
 *  1. Extracting all digit groups (length >= minDigits)
 *  2. Filtering to those present in PDF's ref set (map keys)
 *  3. Preferring thr rightmost occurrence in the filename
 *
 * @param {string} filePath - The filename or full path to an image
 * @param {Set<string>} refSet - Set of valid reference keys (full + trimmed)
 * @param {number} minDigits - Minimum digits to consider in 1. sep
 * @returns {string|null} The chosen reference string, or null if none match
 */
function pickRefFromFileNameAgainstSet(filePath, refSet, minDigits) {
    const base = path.basename(filePath);
    const groups = findAllRefsInString(base, minDigits);
    const present = groups.filter(g => refSet.has(g));
    if (present.length === 0) {
        return null;
    }

    // Prefer the rightmost match (closest to extension is often the correct one)
    let best = present[0];
    let bestPos = base.lastIndexOf(best);
    for (const g of present) {
        const pos = base.lastIndexOf(g);
        if (pos > bestPos) {
            best = g;
            bestPos = pos;
        }
    }
    return best;
}

/**
 * Copy a file to the destination directory using a new, sanitized base name.
 * Preserves the original file extension or .jpg if none.
 * @param {string} src - Source file path
 * @param {string} destDir - Destination directory
 * @param {string} newBase - New filename base (without extension)
 * @returns {Promise<string>} Final destination path
 */
async function copyWithNewName(src, destDir, newBase) {
    await ensureDir(destDir);
    const safe = sanitizeWindowsName(newBase);
    const ext = path.extname(src) || '.jpg';
    const dest = path.join(destDir, `${safe}${ext}`);
    await fs.copyFile(src, dest);
    return dest;
}

/**
 * Rename a file in place to a new, sanitized base name.
 * Preserves the original file extension or .jpg if none.
 *
 * @param {string} src - Existing file path
 * @param {string} newBase - New filename base (without extension)
 * @returns {Promise<string>} New full path after rename
 */
async function renameInPlace(src, newBase) {
    const dir = path.dirname(src);
    const safe = sanitizeWindowsName(newBase);
    const ext = path.extname(src) || '.jpg';
    const dest = path.join(dir, `${safe}${ext}`);
    await fs.rename(src, dest);
    return dest;
}

/**
 * Build a ref -> name map from parsed PDF pairs, registering both:
 *  - Full ref (e.g., "41791")
 *  - Trimmed ref (e.g., "4179")
 * The first occurrence wins if duplicates exist.
 *
 * @param {{name: string, ref: string, trimmedRef: string}[]} pairs - Parsed PDF entries
 * @returns {Map<string, string>} Map where keys are refs (full and trimmed) and values are names
 */
function buildRefToNameMapFromPairs(pairs) {
    const map = new Map();

    for (const { ref, trimmedRef, name } of pairs) {
        if (!map.has(ref)) {
            map.set(ref, name);
        }

        if (trimmedRef && !map.has(trimmedRef)) {
            map.set(trimmedRef, name);
        }
    }

    return map;
}

/* --------------------------------- Main ---------------------------------- */

/**
 * Program entry point:
 *      1. Parse CLI args
 *      2. Read + split PDF text
 *      3. Extract {name, ref, trimmedRef} pairs from "<NAME> TI-<REF>" lines
 *      4. Build ref-name map with both full and trimmed keys
 *      5. List image files to rename
 *      6. For each image, pick best matching ref from filename against map keys
 *      7. Print plan; if --apply, copy or rename accordingly
 *
 * Errors are printed clearly and exit codes are set for CI/script usage.
 */
(async function main() {
    const args = parseArgs(process.argv);

    const text = await readPdfText(args.pdfPath);
    const lines = splitNonEmptyLines(text);
    const pairs = extractPairsNameTiOnly(lines, args.refDigits);

    if (pairs.length === 0) {
        console.error('No "<NAME> TI-<REF>" lines found in PDF.');
        process.exit(1);
    }

    const refToName = buildRefToNameMapFromPairs(pairs);

    if (args.showMap || args.debug) {
        console.log(`Found ${pairs.length} TI lines. Ref keys in map`);
        console.log('', Array.from(refToName.keys()).join(', '));
    }

    const photos = await listImages(args.photosDir);
    if (photos.length === 0) {
        console.error('No images found in --photos directory');
        process.exit(1);
    }

    const refSet = new Set(refToName.keys());

    if (args.debug) {
        console.log('\n[DEBUG] Files & detected digit groups:');
        for (const f of photos) {
            const groups = findAllRefsInString(path.basename(f), args.refDigits);
            console.log(' -', path.basename(f), '->', groups.length ? groups.join(', ') : '(none)');
        }
    }

    // Plan (dry-run preview)
    const plans = [];
    for (const src of photos) {
        const ref = pickRefFromFileNameAgainstSet(src, refSet, args.refDigits);
        if (!ref) continue;
        const name = refToName.get(ref);
        if (!name) continue;
        plans.push({ src, newBase: name });
    }

    console.log('\nPlanned outputs:');
    if (plans.length === 0) {
        console.warn(
            '(No photos matched any reference from the PDF. Check --refDigits or filenames.)'
        );
    } else {
        for (const p of plans) {
            console.log(
                `- ${path.basename(p.src)} -> ${sanitizeWindowsName(p.newBase)}${path.extname(p.src)}`
            );
        }
    }

    if (args.dryRun) {
        console.log('\nDry run. Use --apply to write files to disk.');
        return;
    }

    // Apply (copy or rename)
    let count = 0;
    for (const p of plans) {
        if (args.inplace) {
            await renameInPlace(p.src, p.newBase);
        } else {
            await copyWithNewName(p.src, args.outputDir, p.newBase);
        }
        count++;
    }

    console.log(
        args.inplace
            ? `\nDone. Renamed ${count} files in place.`
            : `\nDone. Wrote ${count} files to ${args.outputDir}`
    );
})().catch(err => {
    console.error('Error: ', err.stack || err.message);
    process.exit(1);
});
