(function () {
    // Elements
    const pdfInput = document.getElementById('ti_pdf_path');
    const photosInput = document.getElementById('ti_photos_path');
    const btnBrowsePdf = document.getElementById('ti_browse_pdf');
    const btnBrowseDir = document.getElementById('ti_browse_dir');
    const out = document.getElementById('ti_output');
    const progress = document.getElementById('ti_progress');
    const progressLabel = document.getElementById('ti_progress_label');
    const btnRename = document.getElementById('ti_btn_rename');
    const btnApply = document.getElementById('ti_btn_apply');

    // ---- Simple in-memory cache (prevents re-prompting) ----
    let cachedPdfPath = null;
    let pickingPdf = false;
    let cachedPhotosDir = null;
    let pickingDir = false;

    // log filtering state
    let currentRunIsApply = false;
    let collectingPlan = false;
    let plannedLines = [];
    let logRemainder = ''; // carry over partial lines between chunks

    function setProgress(pct) {
        const v = Math.max(0, Math.min(100, Number(pct) || 0));
        progress.value = v;
        progressLabel.textContent = v + '%';
    }

    // Streamed logs/progress from main
    // On apply, detect and print only - Done.
    // ignore other logs during Apply.
    const removeLogListener = window.ti.onLog(chunk => {
        if (currentRunIsApply) {
            if (chunk.includes('Done.')) {
                out.textContent = 'Done.'; // overwrite with clean status
                out.scrollTop = out.scrollHeight;
            }
            return;
        }

        // Dry-run: extract only the "Planned outputs:" block
        logRemainder += chunk;
        // Process complete lines only
        const lines = logRemainder.split('\n');
        logRemainder = lines.pop() ?? ''; // keep last partial

        for (const raw of lines) {
            const line = raw.replace(/\r$/, '');

            // Start collecting when header appears
            if (!collectingPlan && line.includes('Planned outputs:')) {
                collectingPlan = true;
                plannedLines = []; // reset
                continue; // do not display the header yet; we will add it once we have lines
            }

            if (!collectingPlan) continue;

            // Stop cases: blank line after some items, or typical end markers
            if (
                (line.trim() === '' && plannedLines.length > 0) ||
                line.includes('Dry run.') ||
                line.includes('Dry run') ||
                line.includes('Done.')
            ) {
                // Render only the planned block
                const body = plannedLines.length
                    ? plannedLines.join('\n')
                    : '(No photos matched any reference from the PDF. Check --refDigits or filenames.)';

                out.textContent = `Planned outputs:\n${body}`;
                out.scrollTop = out.scrollHeight;

                // Stop collecting after we’ve printed the block
                collectingPlan = false;
                plannedLines = [];
                continue;
            }

            // Collect bullet lines that look like planned renames
            if (/^\s*-\s+/.test(line)) {
                plannedLines.push(line.trim());
                continue;
            }

            // Also allow the single-line "no matches" message
            if (line.trim().startsWith('(No photos matched')) {
                plannedLines.push(line.trim());
                continue;
            }
        }
    });
    const removeProgressListener = window.ti.onProgress(pct => setProgress(pct));

    // ---- Helpers (single source of truth) ----
    async function getPdfPath() {
        // just return what we already chose via click handler
        return cachedPdfPath || null;
    }

    async function getSelectedPhotosDir() {
        return cachedPhotosDir || null;
    }

    // ---- Keep cache in sync with user actions (reuse helpers; no duplicate logic) ----
    btnBrowsePdf?.addEventListener('click', async e => {
        e.preventDefault(); // prevents the HTML file dialog
        if (pickingPdf || cachedPdfPath) return; // already choosing or chosen
        pickingPdf = true;
        try {
            const chosen = await window.ti.choosePdf();
            if (chosen) cachedPdfPath = chosen;
            // replace placeholder
            pdfInput.value = chosen;
        } finally {
            pickingPdf = false;
        }
    });

    // Stop the built-in folder picker for the photos input; use native dialog instead.
    btnBrowseDir?.addEventListener('click', async e => {
        e.preventDefault(); // prevents the HTML directory dialog
        if (pickingDir || cachedPhotosDir) return;
        pickingDir = true;
        try {
            const dir = await window.ti.chooseDir();
            if (dir) cachedPhotosDir = dir;
            // replace placeholder
            photosInput.value = dir;
        } finally {
            pickingDir = false;
        }
    });

    // ---- Run (Dry run / Apply) ----
    async function runTi({ apply }) {
        out.textContent = '';
        setProgress(0);

        currentRunIsApply = !!apply;
        collectingPlan = false;
        plannedLines = [];
        logRemainder = '';

        const pdfPath = await getPdfPath();
        const photosDir = await getSelectedPhotosDir();

        if (!pdfPath || !photosDir) {
            out.textContent = 'Please select both a PDF file and a photos folder.\n';
            return;
        }

        const mode = document.querySelector('input[name="ti_mode"]:checked')?.value || 'copy';
        const payload = {
            pdfPath,
            photosDir,
            mode, // 'copy' | 'inplace'
            apply: !!apply, // false = dry-run, true = apply
            refDigits: 4,
            // outDir: optional
        };

        const { ok, code, error } = await window.ti.run(payload);
        if (!ok) {
            out.textContent += `\nProcess exited with code ${code}${error ? `: ${error}` : ''}\n`;
        } else {
            setProgress(apply ? 100 : 60);
            out.textContent += `\n${apply ? 'Apply completed.' : 'Dry run complete.'}\n`;
        }
    }

    btnRename.addEventListener('click', () => runTi({ apply: false }));
    btnApply.addEventListener('click', () => runTi({ apply: true }));

    // Cleanup on navigation
    window.addEventListener('beforeunload', () => {
        try {
            removeLogListener();
            removeProgressListener();
        } catch {}
    });
})();
