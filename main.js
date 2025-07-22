/* ------------ DOM handles ------------- */
const annoInput = document.getElementById("annoInput");
const video = document.getElementById("video");
const videoMeta = document.getElementById("videoMeta");
const listContainer = document.getElementById("listContainer");
const rawJsonEl = document.getElementById("rawJson");
const narrationContainer = document.getElementById("narrationContainer");

const DEFAULT_JSON_PATH = "./data/labels/R007-7July-DSLR.json";
// All annotations (raw order)
let annotations = [];
// Only the segments we auto‑highlight
let highlightSegments = [];
let showConversations = true;
let showFineGrainedActions = true;

// Checkbox event listeners
document.getElementById("showConversation").addEventListener("change", (e) => {
    console.log("showConversation changed to", e.target.checked);
    showConversations = e.target.checked;
    // hide elements with class "conversation" if not checked
    if (!showConversations) {
        const convElements = document.querySelectorAll(".annotation.conversation");
        convElements.forEach(el => el.classList.add("hidden"));
    } else {
        const convElements = document.querySelectorAll(".annotation.conversation.hidden");
        convElements.forEach(el => el.classList.remove("hidden"));
    }
});

document.getElementById("showFineGrainedActions").addEventListener("change", (e) => {
    console.log("showFineGrainedActions changed to", e.target.checked);
    showFineGrainedActions = e.target.checked; 
    // hide elements with class "fine" if not checked
    if (!showFineGrainedActions) {
        const fineElements = document.querySelectorAll(".annotation.fine");
        fineElements.forEach(el => el.classList.add("hidden"));
    } else {
        const fineElements = document.querySelectorAll(".annotation.fine.hidden");
        fineElements.forEach(el => el.classList.remove("hidden"));
    }
});

function handleParsed(parsed) {
    /* ------ show raw JSON ------ */
    // rawJsonEl.textContent = JSON.stringify(parsed, null, 2);

    /* ------ auto-load video ------ */
    const vidName = parsed.video_name || parsed.videoName;
    const taskType = parsed.taskType || parsed.task_type;

    const videoDuration = parsed.videoMetadata.duration.seconds;
    const videoResolutionWidth = parsed.videoMetadata.video.resolution.w;
    const videoResolutionHeight = parsed.videoMetadata.video.resolution.h;
    // console.log(`Video duration: ${videoDuration} seconds`);
    // console.log(`Video resolution: ${videoResolutionWidth}x${videoResolutionHeight}`);

    if (vidName) {
        video.src = `./data/videos/${vidName}/Export_py/Video_pitchshift.mp4`;
        videoMeta.innerHTML = `<strong>Video</strong>: ${vidName}`;
        videoMeta.classList.remove("hidden");

        if (taskType) {
            videoMeta.innerHTML += `<br><strong>Task Type</strong>: ${taskType}`;
        }

        if (videoDuration) {
            videoMeta.innerHTML += `<br><strong>Duration</strong>: ${formatTime(videoDuration)} (${videoDuration} seconds)`;
        }

        if (videoResolutionWidth && videoResolutionHeight) {
            videoMeta.innerHTML += `<br><strong>Resolution</strong>: ${videoResolutionWidth}x${videoResolutionHeight}`;
        }
        
        video.onerror = function() {
            videoMeta.innerHTML = `<p style="color:red;">Error: Video file not found - ${vidName}</p>`;
            console.error(`Failed to load video: ${video.src}`);
        };
    } else {
        console.warn("`video_name` not found in JSON; cannot auto-load video.");
    }

    /* ------ pull annotation list ------ */
    annotations =
    parsed.events ||
    parsed.annotations ||
    (Array.isArray(parsed) ? parsed : []);

    if (!annotations.length) {
        throw new Error("No `events`/`annotations` array found.");
    }

    renderNarration();
    renderAnnotations();
}

/* ----------- Load & parse JSON --------- */
annoInput.addEventListener("change", () => {
    const file = annoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
        try {
            handleParsed(JSON.parse(target.result));
        } catch (err) {
            listContainer.innerHTML = `<p style="color:red;">Failed to parse JSON: ${err.message}</p>`;
            rawJsonEl.textContent = "";
            annotations = [];
            narrationContainer.classList.add("hidden");
        }
    };
    reader.readAsText(file);
});

function tryLoadDefaultJson() {
    if (location.protocol === "file:") {
        console.warn(
            "Running from file:// — the browser blocks fetch(). " +
            "Start a local server (e.g. python -m http.server) or deploy to GitHub Pages " +
            "to auto-load the default JSON."
        );
        return;                     // skip auto-load
    }

    fetch(DEFAULT_JSON_PATH)
        .then((r) => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
        })
        .then(handleParsed)         // <- your existing parser / renderer
        .catch((err) =>
            console.error("Failed to load default JSON:", DEFAULT_JSON_PATH, err)
        );
}

window.addEventListener("DOMContentLoaded", tryLoadDefaultJson);

/* ------------ Render narration -------------- */
function renderNarration() {
    // Expect the narration event spans whole video
    const narration = annotations.find((a) => a.label === "Narration");
    if (narration) {
        narrationContainer.innerHTML = "<strong>Narration: </strong>" + getAnnotationText(narration) || "(No description)";
        narrationContainer.classList.remove("hidden");
    } else {
        narrationContainer.classList.add("hidden");
    }
}

/* --------- Render annotation cards -------- */
function renderAnnotations() {
    listContainer.innerHTML = "";
    highlightSegments = [];

    // Sort by start time
    const sorted = annotations.slice().sort((a, b) => (a.start || 0) - (b.start || 0));
    const usedFine = new Set();

    sorted.forEach((a) => {
        // Skip narration in the sidebar
        if (a.label === "Narration") return;

        if (a.label === "Coarse grained action") {
            const coarseDiv = createAnnotationDiv(a, "coarse");
            listContainer.appendChild(coarseDiv);

            // Find nested fine-grained actions
            sorted.forEach((f) => {
            if (
                !usedFine.has(f) &&
                f.label === "Fine grained action" &&
                f.start >= a.start &&
                f.end <= a.end
            ) {
                const fineDiv = createAnnotationDiv(f, "fine");
                listContainer.appendChild(fineDiv);
                usedFine.add(f);
                // only show if enabled
                if (!showFineGrainedActions) {
                    fineDiv.classList.add("hidden");
                } else {
                    fineDiv.classList.remove("hidden");
                }
            }
            });
        } else if (a.label === "Fine grained action") {
            // Orphan fine-grained action (no coarse parent)
            if (!usedFine.has(a)) {
                const fineDiv = createAnnotationDiv(a, "fine");
                listContainer.appendChild(fineDiv);
                // only show if enabled
                if (!showFineGrainedActions) {
                    fineDiv.classList.add("hidden");
                } else {
                    fineDiv.classList.remove("hidden");
                }
            }
        } else if (a.label === "Conversation") {
            // Only show conversations if enabled
            const convDiv = createAnnotationDiv(a, "conversation");
            listContainer.appendChild(convDiv);

            if (!showConversations) {
                convDiv.classList.add("hidden");
            } else {
                convDiv.classList.remove("hidden");
            }
        }
    });
}

/* ---------- Create single annotation element ---------- */
function createAnnotationDiv(a, type) {
    const div = document.createElement("div");
    div.className = `annotation ${type}`;

    const start = formatTime(a.start);
    const end = formatTime(a.end);

    div.innerHTML = `
        <div class="time">${start} - ${end}</div>
        <div class="eve_text"><div class="eve_type">${a.label || "Annotation"}</div>
        ${getAnnotationText(a) || "(no description)"}
        </div>`;

    div.addEventListener("click", () => {
        if (typeof a.start === "number") {
            video.currentTime = a.start;
            video.play();
        }
    });

    const tooltipText = document.createElement("span");
    tooltipText.className = "tooltip-text";
    tooltipText.textContent = `${JSON.stringify(a, null, 2)}`;
    div.appendChild(tooltipText); 

    if (type === "conversation" || type === "fine" || type === "coarse") {
        highlightSegments.push({ div, start: a.start, end: a.end });
    }

    return div;
}

/* ------------- Helpers ------------- */
function formatTime(s = 0) {
    s = Math.max(0, s);
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return h ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

function getAnnotationText(a) {
    const at = a.attributes || {};
    switch (a.label) {
    case "Narration":
        return at["Long form description"] || "";
    case "Conversation":
        return at.Transcription || "";
    case "Fine grained action":
        return `${at.Verb || ""} ${at.Noun || ""}`.trim();
    case "Coarse grained action":
        return at["Action sentence"] || "";
    default:
        return JSON.stringify(at);
    }
}

/* ---- Highlight current segment on playback ---- */
video.addEventListener("timeupdate", () => {
    if (!highlightSegments.length) return;
        const t = video.currentTime;

        highlightSegments.forEach((item) => {
        if (t >= item.start && t <= item.end) {
            if (!item.div.classList.contains("active")) {
                item.div.classList.add("active");
                // item.div.scrollIntoView({ block: "nearest" });
            }
        } else {
            item.div.classList.remove("active");
        }
    });
});

