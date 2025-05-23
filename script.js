document.addEventListener('DOMContentLoaded', () => {
    const journalBook = document.getElementById('journal-book');
    const bookCover = document.getElementById('book-cover');
    const leftPage = document.getElementById('left-page');
    const rightPage = document.getElementById('right-page');
    const pageIndicator = document.getElementById('page-indicator');
    const flipSound = document.getElementById('page-flip-sound');

    // Get references to the content wrappers (already in HTML)
    const leftPageContent = leftPage.querySelector('.page-content-wrapper');
    const rightPageContent = rightPage.querySelector('.page-content-wrapper');

    // Define default content for each spread.
    const defaultPagesContent = [
        [
            `<h1>My Journal</h1>
             <p>Welcome to your digital journal! Click the right edge of the page to turn.</p>`,
            `<h2>Today's Reflection</h2>
             <p>You can add more content, images, or lists here.</p>
             <ul>
               <li>Gratitude</li>
               <li>Memories</li>
               <li>Plans</li>
             </ul>`
        ],
        [
            `<h2>Memories</h2>
             <p>Describe a memorable event here.</p>`,
            `<h2>Photo</h2>
             <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Sample" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px #ccc;">
             <br><small style="color:#bfa046;">(You can add images too!)</small>`
        ],
        [
            `<h2>Reflections</h2>
             <p>What did you learn today?</p>`,
            `<h2>Gratitude</h2>
             <p>Write something you're grateful for.</p>`
        ],
        [
            `<h2>Blank Page</h2>
             <p>This page is empty. Start typing!</p>`,
            `<h2>Blank Page</h2>
             <p>This page is empty. Start typing!</p>`
        ]
    ];

    let currentSpread = 0;
    const totalSpreads = defaultPagesContent.length;
    const totalPhysicalPages = totalSpreads * 2;

    let isFlipping = false;
    let isBookOpen = false;

    // --- Dynamic Click Zone Creation and Setup ---
    let nextPageZone, prevPageZone;

    function createAndSetupClickZones() {
        // Create element for the zone on the LEFT page (JS gives it 'next-page-zone' class)
        nextPageZone = document.createElement('div');
        nextPageZone.classList.add('page-click-zone', 'next-page-zone');
        leftPage.appendChild(nextPageZone);

        // Create element for the zone on the RIGHT page (JS gives it 'prev-page-zone' class)
        prevPageZone = document.createElement('div');
        prevPageZone.classList.add('page-click-zone', 'prev-page-zone');
        rightPage.appendChild(prevPageZone);

        // Attach event listeners to the dynamically created zones
        nextPageZone.addEventListener('click', () => {
            // Only allow flip if book is open, not currently flipping, and not on the last spread
            if (isBookOpen && !isFlipping && currentSpread < totalSpreads - 1) {
                flipPage("next");
            }
        });

        prevPageZone.addEventListener('click', () => {
            // Only allow flip if book is open, not currently flipping, and not on the first spread
            if (isBookOpen && !isFlipping && currentSpread > 0) {
                flipPage("prev");
            }
        });

        // Initial state: hide zones until book is open using the 'hidden' class
        nextPageZone.classList.add('hidden');
        prevPageZone.classList.add('hidden');
    }

    // Call this function once when DOM is ready
    createAndSetupClickZones();

    // --- Local Storage Functions ---
    function getPageContent(spreadIndex, side) {
        const key = `journal_spread_${spreadIndex}_${side}`;
        const savedContent = localStorage.getItem(key);
        return savedContent !== null ? savedContent : defaultPagesContent[spreadIndex][side === 'left' ? 0 : 1];
    }

    function savePageContent(spreadIndex, side, content) {
        const key = `journal_spread_${spreadIndex}_${side}`;
        localStorage.setItem(key, content);
    }

    // --- Render Function ---
    function renderBook() {
        leftPageContent.innerHTML = getPageContent(currentSpread, 'left');
        rightPageContent.innerHTML = getPageContent(currentSpread, 'right');

        // Set placeholders (if contenteditable is not empty, placeholder won't show)
        // These are already in HTML, but setting them here ensures consistency.
        leftPageContent.setAttribute('data-placeholder', 'Start writing on your left page...');
        rightPageContent.setAttribute('data-placeholder', 'Start writing on your right page...');

        const leftPageNum = (currentSpread * 2) + 1;
        const rightPageNum = (currentSpread * 2) + 2;
        pageIndicator.textContent = `Pages ${leftPageNum} - ${rightPageNum} of ${totalPhysicalPages}`;

        // Manage click zone visibility (using classes for transitions)
        if (isBookOpen) {
            // Next button (on left page)
            if (currentSpread < totalSpreads - 1) {
                nextPageZone.classList.remove('hidden');
            } else {
                nextPageZone.classList.add('hidden');
            }

            // Previous button (on right page)
            if (currentSpread > 0) {
                prevPageZone.classList.remove('hidden');
            } else {
                prevPageZone.classList.add('hidden');
            }
        } else {
            // If book is not open, hide all zones
            nextPageZone.classList.add('hidden');
            prevPageZone.classList.add('hidden');
        }
    }

    // --- Page Flip Animation ---
    const FLIP_ANIMATION_DURATION = 600; // Matches CSS transition duration for .book-page.flipping

    function flipPage(direction) {
        if (!isBookOpen || isFlipping) return;
        isFlipping = true;

        // Temporarily disable pointer-events immediately to prevent rapid clicks during flip
        nextPageZone.style.pointerEvents = 'none';
        prevPageZone.style.pointerEvents = 'none';

        if (flipSound) {
            flipSound.currentTime = 0;
            flipSound.play();
        }

        if (direction === "next") {
            // When going next, the current left page flips to the left
            leftPage.classList.add("flipping-left");
        } else { // direction === "prev"
            // When going previous, the current right page flips to the right
            rightPage.classList.add("flipping-right");
        }

        // Timeout to update content after the visual flip animation starts (mid-flip)
        setTimeout(() => {
            if (direction === "next" && currentSpread < totalSpreads - 1) {
                currentSpread++;
            } else if (direction === "prev" && currentSpread > 0) {
                currentSpread--;
            }
            renderBook(); // Update content for the new spread immediately after changing currentSpread
        }, FLIP_ANIMATION_DURATION / 2); // Update content roughly halfway through the flip

        // Timeout to remove flipping classes and re-enable pointer-events after animation completes
        setTimeout(() => {
            // Remove flipping classes from both pages, regardless of which one "flipped" visually
            leftPage.classList.remove("flipping-left", "flipping-right");
            rightPage.classList.remove("flipping-left", "flipping-right");
            isFlipping = false;

            // Re-enable pointer events based on current page after flip is done
            // This is handled by renderBook, but explicitly setting 'auto' here just in case,
            // though the class-based visibility will take precedence.
            nextPageZone.style.pointerEvents = '';
            prevPageZone.style.pointerEvents = '';
            renderBook(); // Re-render to ensure buttons are correctly enabled/disabled for the new spread
        }, FLIP_ANIMATION_DURATION); // Ensure this matches or slightly exceeds the CSS transition for the flip
    }

    // --- Event Listeners ---

    // Toggle book open/close on cover click
    bookCover.addEventListener('click', () => {
        if (!isBookOpen) {
            // Opening the book
            bookCover.classList.add('open');
            journalBook.classList.add('opened'); // Adds this class to the book

            if (flipSound) {
                flipSound.currentTime = 0;
                flipSound.play();
            }

            // Ensure page indicator becomes visible when book is opened
            pageIndicator.classList.add('visible');

            setTimeout(() => {
                isBookOpen = true;
                renderBook(); // Display initial or saved content and enable zones
            }, 1000); // Matches cover open transition duration in CSS
        } else {
            // Closing the book
            bookCover.classList.remove('open');
            journalBook.classList.remove('opened'); // Removes this class from the book

            if (flipSound) {
                flipSound.currentTime = 0;
                flipSound.play();
            }

            // Immediately hide all click zones and page indicator when book is closing
            nextPageZone.classList.add('hidden');
            prevPageZone.classList.add('hidden');
            pageIndicator.classList.remove('visible');

            setTimeout(() => {
                isBookOpen = false;
            }, 1000); // Matches cover close transition
        }
    });

    // Save content on input
    leftPageContent.addEventListener('input', () => {
        savePageContent(currentSpread, 'left', leftPageContent.innerHTML);
    });

    rightPageContent.addEventListener('input', () => {
        savePageContent(currentSpread, 'right', rightPageContent.innerHTML);
    });

    // Keyboard navigation (Left/Right arrow keys)
    document.addEventListener('keydown', (event) => {
        if (!isBookOpen) return; // Only allow keyboard navigation if book is open

        if (event.key === 'ArrowRight') {
            event.preventDefault(); // Prevent page scrolling
            if (currentSpread < totalSpreads - 1) {
                flipPage('next');
            }
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault(); // Prevent page scrolling
            if (currentSpread > 0) {
                flipPage('prev');
            }
        }
    });

    // Initial render of the book when the page loads (before opening)
    renderBook();
});