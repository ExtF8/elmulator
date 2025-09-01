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

    // Cache
    let cachedPdfPath = null;
    let cachedPhotosDir = null;
    let pickingPdf = false;
    let pickingDir = false;

    // log parse state
    let isApplyRun = false;
    let buffer = ''; // holds partial lines between chunks
    let collectingPlan = false; // are we inside the Planned outputs section?
    let planned = []; // collected "- ..." lines or the "(No photos ...)" message
    let rendered = false; // did we already render the final output for this run?
    let collectingDone = false;
    let doneLines = [];

    function setProgress(pct) {
        const v = Math.max(0, Math.min(100, Number(pct) || 0));
        progress.value = v;
        progressLabel.textContent = v + '%';
    }

    // Reset parse state at the beginning of each run
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

    // ---------- Log handler (kept small & focused) ----------
    const offLog = window.ti.onLog(chunk => {
        if (rendered) return; // we already showed what we need for this run

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // carry over last partial line

        for (let raw of lines) {
            const line = raw.replace(/\r$/, '');
            console.log(line);
            console.log(raw);

            if (isApplyRun) {
                // Start collecting when we see "Done."
                if (!collectingDone) {
                    if (/^Done\./.test(line)) {
                        collectingDone = true;
                        doneLines = [line];
                        out.textContent = doneLines.join('\n'); // show immediately
                    }
                    continue;
                }

                // We're in the Done block — push every line and update UI live
                if (line.trim() === '') {
                    // optional: if a blank arrives, consider the block complete
                    rendered = true;
                    setProgress(100);
                    out.textContent = doneLines.join('\n');
                    return;
                } else {
                    doneLines.push(line);
                    out.textContent = doneLines.join('\n'); // live update (no need to wait)
                }
                continue;
            }

            // DRY RUN parsing
            if (!collectingPlan) {
                if (line.includes('Planned outputs:')) {
                    collectingPlan = true;
                    planned = [];
                }
                continue;
            }

            // We are collecting plan lines
            if (/^\s*-\s+/.test(line)) {
                planned.push(line.trim());
                continue;
            }
            if (line.trim().startsWith('(No photos matched')) {
                planned = [line.trim()];
                continue;
            }

            // Stop collecting on blank line or the dry-run trailer
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

    const offProg = window.ti.onProgress(pct => setProgress(pct));

    // ---------- Browse buttons (native dialogs only) ----------
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

    // ---------- Run (Dry run / Apply) ----------
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

        // Finalize rendering if logs ended before we got a blank line
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

    // Cleanup
    window.addEventListener('beforeunload', () => {
        try {
            offLog();
            offProg();
        } catch {}
    });
})();
