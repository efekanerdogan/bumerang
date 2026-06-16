/**
 * Bumerang SRS (Spaced Repetition System)
 * Based on the SuperMemo 2 (SM-2) algorithm used by Anki.
 */

const SRS = {
    /**
     * Calculates the next review interval and new ease factor for a card.
     * @param {object} card - The card object containing current interval, repetitions, and ease factor.
     * @param {number} quality - The quality of the recall (0-5).
     *                           0: Validation failed (Blackout)
     *                           1: Wrong response
     *                           2: Wrong, but remembered after seeing answer
     *                           3: Correct, but with much difficulty
     *                           4: Correct, with some hesitation
     *                           5: Perfect recall
     * @returns {object} - The updated card properties (interval, repetitions, easeFactor, dueDate).
     */
    calculateNextReview: (card, quality) => {
        let { interval, repetitions, easeFactor } = card;

        // Default values for new cards
        if (!interval) interval = 0;
        if (!repetitions) repetitions = 0;
        if (!easeFactor) easeFactor = 2.5;

        // If quality is less than 3, the card is forgotten. Reset repetitions and interval.
        if (quality < 3) {
            repetitions = 0;
            interval = 1; // Review next day (or same day logic could be added)
        } else {
            // Success
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions++;
        }

        // Update Ease Factor (EF)
        // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        // EF cannot fall below 1.3
        if (easeFactor < 1.3) easeFactor = 1.3;

        // Calculate Due Date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);

        return {
            interval,
            repetitions,
            easeFactor,
            dueDate: dueDate.toISOString()
        };
    }
};

// Export to window for global access
window.SRS = SRS;
