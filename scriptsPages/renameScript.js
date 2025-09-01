/**
 * TI Rename renderer-side controller.
 *
 * Responsibilities:
 * - Manage path selection (PDF and photos directory) via IPC-powered native dialogs.
 * - Parse streamed stdout from the CLI to render:
 *    • Dry run: "Planned outputs" block
 *    • Apply:   final multi-line "Done." summary (destination or in-place)
 * - Keep a simple in-memory cache to avoid repeated prompts.
 *
 * Expects `window.ti` (IPC bridge) to provide:
 *   - onLog(handler): subscribe to stdout/stderr chunks
 *   - onProgress(handler): subscribe to coarse progress updates
 *   - run(payload): invoke the CLI
 *   - choosePdf(): open native "open file" dialog (PDF)
 *   - chooseDir(): open native "open directory" dialog
 */
(function () {
    // Constants
    const pdfInput = document.getElementById('ti_pdf_path');
    const photosInput = document.getElementById('ti_photos_path');
    const btnBrowsePdf = document.getElementById('ti_browse_pdf');
    const btnBrowseDir = document.getElementById('ti_browse_dir');
    const out = document.getElementById('ti_output');
    const progress = document.getElementById('ti_progress');
    const progressLabel = document.getElementById('ti_progress_label');
    const btnRename = document.getElementById('ti_btn_rename');
    const btnApply = document.getElementById('ti_btn_apply');

    /** Cached absolute path to the selected PDF (or null). */
    let cachedPdfPath = null;
    /** Cached absolute path to the selected photos directory (or null). */
    let cachedPhotosDir = null;
    /** Guard to prevent concurrent PDF dialogs. */
    let pickingPdf = false;
    /** Guard to prevent concurrent directory dialogs. */
    let pickingDir = false;

    /** Whether current run is Apply (true) or Dry run (false). */
    let isApplyRun = false;
    /** Carries partial line between chunk boundaries. */
    let buffer = '';
    /** Whether we are currently collecting "Planned outputs:" lines. */
    let collectingPlan = false;
    /** Accumulator for planned outputs bullets (or no-matches line). */
    let planned = [];
    /** Whether the UI has already rendered the final output for this run. */
    let rendered = false;
    /** Whether we are currently collecting the multi-line "Done." block. */
    let collectingDone = false;
    /** Accumulator for "Done." lines (first line is "Done."). */
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
    const offLog = window.ti.onLog(chunk => {
        if (rendered) return;

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (let raw of lines) {
            const line = raw.replace(/\r$/, '');
            console.log(line);
            console.log(raw);

            if (isApplyRun) {
                if (!collectingDone) {
                    if (/^Done\./.test(line)) {
                        collectingDone = true;
                        doneLines = [line];
                        out.textContent = doneLines.join('\n');
                    }
                    continue;
                }
                if (line.trim() === '') {
                    rendered = true;
                    setProgress(100);
                    out.textContent = doneLines.join('\n');
                    return;
                } else {
                    doneLines.push(line);
                    out.textContent = doneLines.join('\n');
                }
                continue;
            }

            if (!collectingPlan) {
                if (line.includes('Planned outputs:')) {
                    collectingPlan = true;
                    planned = [];
                }
                continue;
            }

            if (/^\s*-\s+/.test(line)) {
                planned.push(line.trim());
                continue;
            }
            if (line.trim().startsWith('(No photos matched')) {
                planned = [line.trim()];
                continue;
            }

            if (line.trim() === '' || /^Dry run\./.test(line)) {
                const body = planned.length
                    ? planned.join('\n')
                    : '(No photos matched any reference from the PDF. Check --refDigits or filenames.)';
                out.textContent = `Planned outputs:\n${body}\n\nDry run. Press Apply to write files to disk.`;
                rendered = true;
                setProgress(60);
                return;
            }
        }
    });

    /**
     * Progress handler passthrough for coarse updates from main/child process.
     */
    const offProg = window.ti.onProgress(pct => setProgress(pct));

    /**
     * Open native "choose PDF" dialog, cache the selection, and reflect it in the input.
     * Guarded to prevent dialog overlap.
     */
    btnBrowsePdf.addEventListener('click', async () => {
        if (pickingPdf) return;
        pickingPdf = true;
        try {
            const chosen = await window.ti.choosePdf();
            if (chosen) {
                cachedPdfPath = chosen;
                pdfInput.value = chosen;
            }
        } finally {
            pickingPdf = false;
        }
    });

    /**
     * Open native "choose directory" dialog, cache the selection, and reflect it in the input.
     * Guarded to prevent dialog overlap.
     */
    btnBrowseDir.addEventListener('click', async () => {
        if (pickingDir) return;
        pickingDir = true;
        try {
            const dir = await window.ti.chooseDir();
            if (dir) {
                cachedPhotosDir = dir;
                photosInput.value = dir;
            }
        } finally {
            pickingDir = false;
        }
    });

    /**
     * Execute either a Dry run or an Apply run:
     * - Validates that both paths are selected.
     * - Resets UI state and invokes the CLI through IPC.
     * - Finalizes output if the process ends without a trailing newline.
     * @param {{apply: boolean}} param0
     */
    async function runTi({ apply }) {
        resetParseState(apply);

        const pdfPath = cachedPdfPath;
        const photosDir = cachedPhotosDir;

        if (!pdfPath || !photosDir) {
            out.textContent = 'Please select both a PDF file and a photos folder.';
            return;
        }

        const mode = document.querySelector('input[name="ti_mode"]:checked')?.value || 'copy';
        const payload = { pdfPath, photosDir, mode, apply: !!apply, refDigits: 4 };

        const { ok, code, error } = await window.ti.run(payload);
        if (!ok) {
            out.textContent = `Process exited with code ${code}${error ? `: ${error}` : ''}`;
            return;
        }

        if (!rendered && isApplyRun && collectingDone) {
            if (buffer.trim()) doneLines.push(buffer.replace(/\r$/, ''));
            out.textContent = doneLines.join('\n');
            setProgress(100);
            rendered = true;
        } else if (!rendered && !isApplyRun && collectingPlan) {
            const body = planned.length
                ? planned.join('\n')
                : '(No photos matched any reference from the PDF. Check --refDigits or filenames.)';
            out.textContent = `Planned outputs:\n${body}\n\nDry run. Press Apply to write files to disk.`;
            setProgress(60);
            rendered = true;
        }
    }

    btnRename.addEventListener('click', () => runTi({ apply: false }));
    btnApply.addEventListener('click', () => runTi({ apply: true }));

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
