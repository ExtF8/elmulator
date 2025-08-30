(function () {
    const pdfInput = document.getElementById('ti_pdf');
    const photosInput = document.getElementById('ti_photos');
    const out = document.getElementById('ti_output');
    const progress = document.getElementById('ti_progress');
    const progressLabel = document.getElementById('ti_progress_label');
    const btnRename = document.getElementById('ti_btn_rename');
    const btnApply = document.getElementById('ti_btn_apply');

    function setProgress(pct) {
        const v = Math.max(0, Math.min(100, Number(pct) || 0));
        progress.value = v;
        progressLabel.textContent = v + '%';
    }

    const removeLogListener = window.ti.onLog(chunk => {
        out.textContent += chunk;
        out.scrollTop = out.scrollHeight;
    });
    const removeProgressListener = window.ti.onProgress(pct => setProgress(pct));

    // Prefer absolute paths from dialogs. Fall back to <input> if present and has .path.
    async function getPdfPath() {
        const f = pdfInput.files?.[0];
        if (f?.path) return f.path;
        // If user didn’t pick via dialog yet, ask now:
        // const chosen = await window.ti.choosePdf();
        // if (chosen) {
        //     // reflect choice in UI (optional)
        //     pdfInput.value = ''; // clear file input to avoid confusion
        // }
        // return chosen; // absolute string or null
    }

    async function getSelectedPhotosDir() {
        // If you used <input webkitdirectory>, see if Electron attached .path to any File:
        const files = photosInput.files;
        if (files && files.length && files[0].path) {
            const p = files[0].path;
            const sep = window.env?.pathSep || '/';
            const idx = p.lastIndexOf(sep);
            return idx > 0 ? p.slice(0, idx) : null;
        }
        // Otherwise, ask main to choose a directory:
        // const dir = await window.ti.chooseDir();
        // if (dir) {
        //     photosInput.value = ''; // clear input (optional)
        // }
        // return dir; // absolute string or null
    }

    // (optional) hook “Browse…” buttons to dialogs
    // if (btnPickPdf) {
    //     btnPickPdf.addEventListener('click', async () => {
    //         const p = await window.ti.choosePdf();
    //         out.textContent = p ? `Selected PDF:\n${p}` : 'No PDF selected.';
    //     });
    // }
    // if (btnPickDir) {
    //     btnPickDir.addEventListener('click', async () => {
    //         const d = await window.ti.chooseDir();
    //         out.textContent = d ? `Selected folder:\n${d}` : 'No folder selected.';
    //     });
    // }

    async function runTi({ apply }) {
        out.textContent = '';
        setProgress(0);

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
            mode,
            apply: !!apply,
            refDigits: 4,
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

    window.addEventListener('beforeunload', () => {
        try {
            removeLogListener();
            removeProgressListener();
        } catch {}
    });
})();
