let saturate;
let brightness;
let contrast;
let grayscale;
let sepia;
let blur;
let hue;
let img;
let download;
let upload;
let reset;
let undo;
let toggleTheme;
let removeBg;

let filterHistory = [];
let currentFilterState = {};

// Function to apply the saved theme from localStorage
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-mode') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Update button text if the button element exists
    const currentToggleThemeButton = document.getElementById("toggleTheme");
    if (currentToggleThemeButton) {
        currentToggleThemeButton.textContent = savedTheme === 'dark-mode' ? "☀️ Light Mode" : "🌙 Night Mode";
    }
}

// Call applySavedTheme immediately on script load to apply theme quickly
applySavedTheme();

// Attach event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Re-get elements to ensure they are available in the DOM on current page
    saturate = document.getElementById("saturate");
    brightness = document.getElementById("brightness");
    contrast = document.getElementById("contrast");
    grayscale = document.getElementById("grayscale");
    sepia = document.getElementById("sepia");
    blur = document.getElementById("blur");
    hue = document.getElementById("hue");
    img = document.getElementById("img");
    download = document.getElementById("download");
    upload = document.getElementById("upload");
    reset = document.getElementById("reset");
    undo = document.getElementById("undo");
    toggleTheme = document.getElementById("toggleTheme"); // Ensure this is selected after DOM content loaded
    removeBg = document.getElementById("removeBg");

    // Theme Toggle Listener (only attaches if the button is present on the page)
    if (toggleTheme) {
        toggleTheme.onclick = function () {
            document.body.classList.toggle("dark-mode");
            const isDarkMode = document.body.classList.contains("dark-mode");
            localStorage.setItem('theme', isDarkMode ? 'dark-mode' : 'light-mode');
            toggleTheme.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Night Mode";
        };
    }

    // Editor-specific functionalities
    if (img) { // Check if we are on the editor page by checking for img element
        // Filter Input Listeners
        document.querySelectorAll(".filters ul li input").forEach((input) => {
            input.addEventListener("input", () => {
                applyFilters();
                if (img.src) saveFilterState(); // Only save state if an image is loaded
            });
        });

        // Preset Filters Listeners
        document.querySelectorAll(".preset-filters button").forEach((button) => {
            button.addEventListener("click", () => {
                applyPreset(button.textContent.trim());
                if (img.src) saveFilterState(); // Only save state if an image is loaded
            });
        });

        // Upload functionality
        upload.onchange = function () {
            resetFilters();
            let file = new FileReader();
            file.readAsDataURL(upload.files[0]);
            file.onload = function () {
                img.src = file.result;
                img.style.display = "block";
                saveFilterState();
            };
        };

        // Download functionality
        download.onclick = async function () {
            if (!img.src) return alert("Upload an image first!");

            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.filter = img.style.filter;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async function (blob) {
                let link = document.createElement("a");
                link.download = "edited-image.png";
                link.href = URL.createObjectURL(blob);
                link.click();
            }, "image/png");
        };

        // Undo functionality
        undo.onclick = function () {
            if (filterHistory.length > 1) { // Ensure there's a state to go back to (original + at least one change)
                filterHistory.pop(); // Remove current state
                const previousState = filterHistory[filterHistory.length - 1]; // Get the state before that
                loadFilterState(previousState);
            }
        };

        // Reset functionality
        reset.onclick = resetFilters;

        // Remove Background functionality
        removeBg.onclick = async function () {
            if (!img.src) return alert("Upload an image first!");

            const formData = new FormData();
            formData.append("image_file", upload.files[0]);
            formData.append("size", "auto");

            let response = await fetch("https://api.remove.bg/v1.0/removebg", {
                method: "POST",
                headers: { "X-Api-Key": "5SXZTakgkUFoCiuWSCkq4rrH" },
                body: formData,
            });

            if (response.ok) {
                let blob = await response.blob();
                img.src = URL.createObjectURL(blob);
            } else {
                alert("Background removal failed.");
            }
        };
    }
});

// Helper Functions (can be outside DOMContentLoaded as they don't directly interact with DOM elements on page load)
function saveFilterState() {
    currentFilterState = {
        saturate: saturate.value,
        brightness: brightness.value,
        contrast: contrast.value,
        grayscale: grayscale.value,
        sepia: sepia.value,
        blur: blur.value,
        hue: hue.value,
    };
    filterHistory.push(currentFilterState);
    if (filterHistory.length > 20) { // Limit history to 20 steps
        filterHistory.shift();
    }
}

function loadFilterState(state) {
    // Check if elements exist before trying to set their values
    if (saturate) saturate.value = state.saturate;
    if (brightness) brightness.value = state.brightness;
    if (contrast) contrast.value = state.contrast;
    if (grayscale) grayscale.value = state.grayscale;
    if (sepia) sepia.value = state.sepia;
    if (blur) blur.value = state.blur;
    if (hue) hue.value = state.hue;
    applyFilters();
}

function applyFilters() {
    // Check if img element exists (i.e., we are on editor page)
    if (img) {
        img.style.filter = `
            saturate(${saturate.value}%)
            brightness(${brightness.value}%)
            contrast(${contrast.value}%)
            grayscale(${grayscale.value})
            sepia(${sepia.value})
            blur(${blur.value}px)
            hue-rotate(${hue.value}deg)
        `;
    }
}

function resetFilters() {
    // Check if elements exist
    if (saturate) saturate.value = 100;
    if (brightness) brightness.value = 100;
    if (contrast) contrast.value = 100;
    if (grayscale) grayscale.value = 0;
    if (sepia) sepia.value = 0;
    if (blur) blur.value = 0;
    if (hue) hue.value = 0;
    applyFilters();
    filterHistory = [{ // Reset history to initial state
        saturate: 100,
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hue: 0,
    }];
}

function applyPreset(type) {
    // Check if elements exist
    if (saturate && brightness && contrast && grayscale && sepia && blur && hue) {
        // Reset all filters to default before applying preset to avoid cumulative effects
        saturate.value = 100;
        brightness.value = 100;
        contrast.value = 100;
        grayscale.value = 0;
        sepia.value = 0;
        blur.value = 0;
        hue.value = 0;

        switch (type) {
            case "B&W":
                grayscale.value = 1;
                contrast.value = 120;
                brightness.value = 110;
                break;
            case "Warm":
                sepia.value = 0.4;
                saturate.value = 120;
                break;
            case "Cool":
                hue.value = 200;
                saturate.value = 120;
                brightness.value = 95;
                break;
            case "Vintage":
                sepia.value = 0.6;
                contrast.value = 90;
                brightness.value = 95;
                break;
            case "Pop":
                saturate.value = 200;
                contrast.value = 120;
                break;
            case "Bright":
                brightness.value = 130;
                contrast.value = 105;
                break;
            case "Soft":
                brightness.value = 105;
                contrast.value = 90;
                sepia.value = 0.2;
                break;
            case "Contrasty":
                contrast.value = 150;
                saturate.value = 110;
                break;
        }
        applyFilters();
        saveFilterState();
    }
}
