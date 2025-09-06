/**
 * Issues→Excel renderer-side controller.
 *
 * Responsibilities:
 * - Let the user pick a PDF (native dialog via IPC).
 * - For DRY RUN: capture only the "Planned outputs" block and show a short hint.
 * - For APPLY:   capture and show the final "Done." multi-line trailer.
 * - Keep simple in-memory cache to avoid repeated dialogs.
 *
 * Expects `window.issues` (from preload) to provide:
 *   - run(payload): invoke the CLI (dry-run/apply)
 *   - onLog(handler): subscribe to streamed log chunks (stdout/stderr)
 *   - onProgress(handler): subscribe to coarse progress updates (0–100)
 *   - (optional) chooseOut(): if you wire a "Save As…" in main; not used here
 */

(function () {
    // Constants
    const pdfInput = document.getElementById('eml_pdf_path');
    const btnBrowsePdf = document.getElementById('eml_browse_pdf');
    const out = document.getElementById('eml_output');
    const progress = document.getElementById('eml_progress');
    const progressLabel = document.getElementById('eml_progress_label');
    const btnExtract = document.getElementById('eml_btn_extract'); // dry run
    const btnApply = document.getElementById('eml_btn_apply'); // apply (extract)

    /** Cached absolute path to the selected PDF (or null). */
    let cachedPdfPath = null;

    /** Whether current run is Apply (true) or Dry run (false). */
    let isApplyRun = false;

    /** Carries partial line between chunk boundaries. */
    let buffer = '';

    /** Whether we are currently collecting "Planned outputs:" lines. */
    let collectingPlan = false;

    /** Accumulator for planned outputs bullets (or a single “no items” line). */
    let planned = [];

    /** Whether the UI has already rendered the final output for this run. */
    let rendered = false;

    /** Whether we are currently collecting the multi-line "Done." block. */
    let collectingDone = false;

    /** Accumulator for "Done." lines (first line must be "Done."). */
    let doneLines = [];

    /**
     * Update the progress bar and its label.
     * @param {number} pct - Progress percentage [0..100].
     */
    function setProgress(pct) {
        const v = Math.max(0, Math.min(100, Number(pct) || 0));
        progress.value = v;
        progressLabel.textContent = v + '%';
    }

    /**
     * Compute a default .xlsx output path “next to” the PDF.
     * Falls back to "<pdfPath>.issues.xlsx" if extension isn’t ".pdf".
     * NOTE: string-based to keep renderer sandboxed (no Node path).
     * @param {string} pdfPath
     * @returns {string}
     */
    function defaultOutPathBesidePdf(pdfPath) {
        if (!pdfPath) return 'issues.xlsx';
        // Replace trailing ".pdf" (case-insensitive) with ".issues.xlsx"; otherwise append.
        return pdfPath.replace(/\.pdf$/i, '.issues.xlsx') + (/\.pdf$/i.test(pdfPath) ? '' : ''); // no-op, just clarity
    }

    /**
     * Reset parsing + UI state at the start of each run.
     * @param {boolean} apply - True if this run is Apply, false for Dry run.
     */
    function resetParseState(apply) {
        isApplyRun = !!apply;
        buffer = '';
        collectingPlan = false;
        planned = [];
        rendered = false;
        out.textContent = '';
        setProgress(0);
        collectingDone = false;
        doneLines = [];
    }

    /**
     * Streamed log handler: parses CLI stdout/stderr to render concise UI text.
     * - Dry run: captures only the "Planned outputs" block and prints a short hint.
     * - Apply:   captures the multi-line "Done." block and renders it incrementally.
     */
    const offLog = window.issues.onLog(chunk => {
        if (rendered) return;

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep the last partial line

        for (let raw of lines) {
            const line = raw.replace(/\r$/, '');

            // Always surface obvious error lines (if any policy prints them)
            if (line.startsWith('[ERR]')) {
                out.textContent = (out.textContent ? out.textContent + '\n' : '') + line;
                continue;
            }

            //  APPLY: “Done.” trailer
            if (isApplyRun) {
                // Start collecting when we hit the first “Done.” line.
                if (!collectingDone) {
                    if (/^Done\./.test(line)) {
                        collectingDone = true;
                        doneLines = [line];
                        out.textContent = doneLines.join('\n'); // show immediately
                    }
                    continue;
                }
                // Already collecting the “Done.” block
                if (line.trim() === '') {
                    rendered = true;
                    setProgress(100);
                    out.textContent = doneLines.join('\n');
                    return;
                } else {
                    doneLines.push(line);
                    out.textContent = doneLines.join('\n'); // live update while lines stream in
                }
                continue;
            }

            //  DRY RUN: planned outputs
            if (!collectingPlan) {
                if (line.includes('Planned outputs:')) {
                    collectingPlan = true;
                    planned = [];
                }
                continue;
            }

            // Inside the planned outputs block
            if (/^\s*-\s+/.test(line)) {
                planned.push(`<span class="issue-line">${line.trim()}</span>`);

                continue;
            }
            if (line.trim().startsWith('(No issues found')) {
                planned = [line.trim()];
                continue;
            }

            // Stop collecting on blank line or the dry-run trailer
            if (line.trim() === '' || /^Dry run\./.test(line)) {
                const body = planned.length ? planned.join('\n') : '(No issues found.)';
                out.innerHTML = `Planned outputs:\n${body}\n\nDry run. Press Apply to write rows to Excel.`;
                rendered = true;
                setProgress(60);
                return;
            }
        }
    });

    /**
     * Progress handler passthrough for coarse updates from main/child process.
     */
    const offProg = window.issues.onProgress(pct => setProgress(pct));

    /**
     * Open native "choose PDF" dialog, cache the selection, and reflect it in the input.
     * Guarded to prevent dialog overlap.
     */
    btnBrowsePdf.addEventListener('click', async () => {
        // You can add a "picking" guard if double-clicks are a problem; usually fine without.
        const pdfPath = await window.issues.choosePdf(); // prefer ti.choosePdf if already wired
        if (pdfPath) {
            cachedPdfPath = pdfPath;
            pdfInput.value = pdfPath;
        }
    });

    /**
     * Execute either a Dry run or an Apply run:
     * - Validates that the PDF path is selected.
     * - Resets UI state and invokes the CLI through IPC.
     * - Finalizes output if the process ends without a trailing newline.
     * @param {{apply: boolean}} param0
     */
    async function runIssues({ apply }) {
        resetParseState(apply);

        const pdfPath = cachedPdfPath;
        if (!pdfPath) {
            out.textContent = 'Please select a PDF file first.';
            return;
        }

        const outXlsx = defaultOutPathBesidePdf(pdfPath);
        const payload = {
            pdfPath,
            outXlsx,
            apply: !!apply,
            inspect: false, // set true to get extra parser prints in console
        };

        const { ok, code, error } = await window.issues.run(payload);
        if (!ok) {
            out.textContent = `Process exited with code ${code}${error ? `: ${error}` : ''}`;
            return;
        }

        // If logs ended without a trailing newline or our stop conditions, finalize gracefully
        if (!rendered && isApplyRun && collectingDone) {
            if (buffer.trim()) doneLines.push(buffer.replace(/\r$/, ''));
            out.textContent = doneLines.join('\n');
            setProgress(100);
            rendered = true;
        } else if (!rendered && !isApplyRun && collectingPlan) {
            const body = planned.length ? planned.join('\n') : '(No issues found.)';
            out.textContent = `Planned outputs:\n${body}\n\nDry run. Press Extract to write rows to Excel.`;
            setProgress(60);
            rendered = true;
        }
    }

    // Actions
    btnExtract.addEventListener('click', () => runIssues({ apply: false })); // dry run
    btnApply.addEventListener('click', () => runIssues({ apply: true })); // apply

    /**
     * Detach IPC listeners when the page is being unloaded.
     */
    window.addEventListener('beforeunload', () => {
        try {
            offLog();
            offProg();
        } catch {}
    });
})();
