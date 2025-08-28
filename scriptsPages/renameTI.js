#!/usr/bin/env node

/**
 * Module for renaming thermal imaging photos by reference fom PDF.
 * Rename photos using "<NAME> TI-<REF>" line in a PDF.
 * Example in PDF: "DB-A/SH TI-41791"
 * Result for file "FLIR4179.jpg" -> "DB-A-SH.jpg"
 */

import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

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
 *   --debug            : Print debugging info (detected refs in filenames)
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
        } else if (a === '--debug') {
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

// Helpers to read PDF text and to split PDF into meaningful lines
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
