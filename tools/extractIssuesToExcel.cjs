#!/usr/bin/env node

/**
 * Extract "Issue <N>" descriptions from a PDF and write them to Excel file.
 *
 * Input pattern (typical):
 *  Issue 12
 *  12
 *  <description ... may wrap across lines until first sentence end (. ! ?)>
 *
 * Behavior:
 *  - Finds "Issues <number>" headers
 *  - Skips the next line if it is the same number (e.g., "12")
 *  - Collects description lines until the first sentence ends
 *  - Dry-run by default; use --apply to write the Excel file
 *
 * Usage:
 *    node tools/extractIssuesToExcel.cjs --pdf "/path/in.pdf" --out "/path/out.xlsx" [--inspect] [--apply]
 */

const fs = require('fs/promises');
const path = require('path');
const pdf = require('pdf-parse');
const Excel = require('exceljs');

/* ------------------------------ CLI Parsing ------------------------------ */

/**
 * Parse command line flags into configuration.
 *
 * Flags:
 *  --pdf <path> : Input PDF path (required)
 *  --out <path> : Output Excel path (.xlsx). Required if --apply; optional in dry-run.
 *  --apply      : Perform write (otherwise dry-run with preview)
 *  --inspect    : Print each parsed issue text during processing
 *
 * @param {string[]} argv
 * @returns {{
 *      pdfPath: string|null,
 *      outXlsx: string|null,
 *      apply: boolean,
 *      inspect: boolean
 * }}
 */

function parseArgs(argv) {
    const args = {
        pdfPath: null,
        outXlsx: null,
        apply: false,
        inspect: false,
    };

    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--pdf') {
            args.pdfPath = argv[++i];
        } else if (a === '--out') {
            args.outXlsx = argv[++i];
        } else if (a === '--apply') {
            args.apply = true;
        } else if (a === '--inspect') {
            args.inspect = true;
        }
    }

    if (!args.pdfPath) {
        throw new Error('Missing --pdf path');
    }

    // Resolve output path
    if (args.outXlsx) {
        // Normalize extension when provided
        if (!/\.xlsx$/i.test(args.outXlsx)) {
            args.outXlsx = `${args.outXlsx}.xlsx`;
        }
    } else {
        // Default: same folder as PDF, with ".issues.xlsx" suffix
        const pdfDir = path.dirname(args.pdfPath);

        const pdfBase = path.basename(args.pdfPath, path.extname(args.pdfPath));
        args.outXlsx = path.join(pdfDir, `${pdfBase}.issues.xlsx`);
    }

    return args;
}

/* ------------------------------ Helpers ------------------------------ */
/**
 * Read a PDF file and return its extracted text.
 * Removes \r characters for consistent line splitting.
 *
 * @param {string} pdfPath - Path to the pdf file
 * @returns {Promise<string>} Pdf text content
 */
async function readPdfText(pdfPath) {
    const buffer = await fs.readFile(pdfPath);
    const data = await pdf(buffer);
    return (data.text || '').replace(/\r/g, '');
}

/**
 * Split raw text into trimmed lines (empty lines preserved as '').
 *
 * @param {string} text - Raw text content
 * @returns {string[]} Array of trimmed lines
 */
function splitLines(text) {
    return text.split('\n').map(string => string.trim());
}

/**
 * If a string of digits is just the first half repeated twice (e.g., "11", "1010", "1313"),
 * return the first half. Otherwise return the original.
 * Examples: "11"->"1", "22"->"2", "1010"->"10" , "13"->"3" (unchanged).
 *
 * @param {string} numberString
 * @returns {numberString}
 */
function normalizeDoubleNumber(numberString) {
    const length = numberString.length;
    if (length % 2 === 0) {
        const half = numberString.slice(0, length / 2);
        if (half + half === numberString) {
            return half;
        }
    }
    return numberString;
}

/**
 * Extract issue description from lines of text.
 *
 * Rules:
 *  - Match "Issue <number>" lines as headers
 *  - Skip a fallowing line if it is just the same number
 *  - Collect description lines until we reach:
 *      - a sentence-ending punctuation, or
 *      - the next "Issue <number>" header
 * @param {string[]} lines - Array of text lines from PDF
 * @returns {{issue: number, text: string}[]} Array of extracted issues
 */
function extractIssues(lines) {
    const issues = [];

    // captures the issue number
    const issueHeaderPattern = /^Issue\s+(\d+)\b/i;

    // detects the start of the next issue
    const nextIssuePattern = /^Issue\s+\d+\b/i;

    // end of first sentence
    const sentenceEndPattern = /[.!?]["')\]]?\s*$/;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const match = lines[lineIndex].match(issueHeaderPattern);
        if (!match) {
            continue;
        }

        const issueNumberString = normalizeDoubleNumber(match[1]);
        const issueNumber = Number(issueNumberString);
        let scanIndex = lineIndex + 1;

        // Optional numeric-only line equal to the same issue number
        if (
            scanIndex < lines.length &&
            /^\d+$/.test(lines[scanIndex]) &&
            Number(lines[scanIndex]) === issueNumber
        ) {
            scanIndex++;
        }

        // Collect description lines until first sentence ends or next Issue begins
        let collectedLines = [];
        while (scanIndex < lines.length) {
            const line = lines[scanIndex];

            // skip empty lines
            if (!line) {
                scanIndex++;
                continue;
            }

            // stop at next Issue header
            if (nextIssuePattern.test(line)) {
                break;
            }

            collectedLines.push(line);

            const joinedDescription = collectedLines.join(' ').replace(/\s+/g, ' ').trim();

            if (sentenceEndPattern.test(joinedDescription)) {
                issues.push({ issue: issueNumber, text: joinedDescription });
                break;
            }
            scanIndex++;
        }

        // Fallback if no sentence end was found
        const alreadyAdded = issues.length && issues[issues.length - 1].issue === issueNumber;
        if (!alreadyAdded) {
            const fallbackDescription = collectedLines.join(' ').replace(/\s+/g, ' ').trim();
            issues.push({ issue: issueNumber, text: fallbackDescription });
        }

        // Skip processed lines
        lineIndex = scanIndex - 1;
    }

    return issues;
}

/**
 * Write rows to an Excel file with columns: Issue, Text.
 *
 * @param {{issue: number, text:string}[]} rows
 * @param {string} outXlsx
 */
async function writeExcel(rows, outXlsx) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    worksheet.columns = [
        { header: 'Issues', key: 'issue', width: 10 },
        { header: 'Text', key: 'text', width: 100 },
    ];

    rows.forEach(row => worksheet.addRow({ issue: row.issue, text: row.text || '' }));

    await workbook.xlsx.writeFile(outXlsx);
}

/**
 * Print planned outputs for dry-run mode
 *
 * @param {{issue: number, text: string}[]} rows
 */
function printPlanned(rows) {
    console.log('\nPlanned outputs:');
    if (!rows.length) {
        console.log('(No issues found.)');
        return;
    }

    for (const row of rows) {
        console.log(`- Issue ${row.issue} -> ${row.text}`);
    }
}

/* --------------------------------- Main ---------------------------------- */

/**
 * Program entry point.
 * Steps:
 *   1. Parse args
 *   2. Read + split PDF text
 *   3. Extract issues
 *   4. Print dry-run preview
 *   5. If --apply, write Excel
 */
(async function main() {
    const args = parseArgs(process.argv);

    const text = await readPdfText(args.pdfPath);
    const lines = splitLines(text);
    const rows = extractIssues(lines);

    if (args.inspect) {
        console.log(`[INSPECT] Found ${rows.length} issue(s).`);
        for (const r of rows) {
            console.log(`Issue ${r.issue}: ${r.text || '(empty)'}`);
        }
    }

    printPlanned(rows);

    if (!args.apply) {
        console.log(
            `\nDry run. Will write ${rows.length} rows to:\n${path.resolve(args.outXlsx)}\nUse --apply to write files to disk.`
        );
        return;
    }

    await writeExcel(rows, args.outXlsx);
    console.log(`\nDone.\nWrote ${rows.length} rows to:\n${path.resolve(args.outXlsx)}`);
})().catch(err => {
    console.error('Error:', err.stack || err.message);
    process.exit(1);
});
