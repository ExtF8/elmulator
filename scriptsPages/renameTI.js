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

// CLI parsing
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
