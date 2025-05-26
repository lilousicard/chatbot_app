/**
 * Message State Management Store
 * A reactive store that manages message highlighting states and persists them in localStorage.
 * This allows message highlights to persist across page refreshes.
 */

import { reactive } from 'vue';

/**
 * Message State Management Store
 * A reactive store that manages message highlighting states and persists them in localStorage.
 * This allows message highlights to persist across page refreshes.
 */
export const messageStore = reactive({
  /**
   * Map storing the state for each message
   * @type {Map<number, Object>}
   */
  messageStates: new Map(),

  /**
   * Initializes the store by loading saved states from localStorage
   */
  init() {
    const saved = localStorage.getItem('messageHighlightedStates');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([id, state]) => {
          this.messageStates.set(parseInt(id, 10), state);
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load saved message states:', e);
      }
    }
  },

  /**
   * Persists the current message states to localStorage
   */
  persist() {
    const data = Object.fromEntries(this.messageStates);
    localStorage.setItem('messageHighlightedStates', JSON.stringify(data));
  },

  /**
   * Checks if a message is highlighted
   * @param {number} messageId - The ID of the message
   * @returns {boolean} Whether the message is highlighted
   */
  getIsHighlighted(messageId) {
    return this.messageStates.get(messageId)?.isHighlighted === true;
  },

  /**
   * Sets the highlight state for a message
   * @param {number} messageId - The ID of the message
   * @param {boolean} value - The highlight state to set
   */
  setIsHighlighted(messageId, value) {
    const current = this.messageStates.get(messageId) || {};
    this.messageStates.set(messageId, { ...current, isHighlighted: value });
    this.persist(); // Auto-save
  },

  /**
   * Toggles the highlight state for a message
   * @param {number} messageId - The ID of the message
   * @returns {boolean} The new highlight state
   */
  toggleIsHighlighted(messageId) {
    const current = this.getIsHighlighted(messageId);
    const newValue = !current;
    this.setIsHighlighted(messageId, newValue);
    return newValue;
  },
});

// Initialize the store when the module is loaded
messageStore.init();
