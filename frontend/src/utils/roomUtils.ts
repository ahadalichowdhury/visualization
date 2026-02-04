// Room utilities for collaboration

/**
 * Generate a unique room ID for collaboration sessions
 * Format: word-word-word (easy to share)
 */
export function generateRoomId(): string {
  const adjectives = [
    'quick', 'bright', 'calm', 'brave', 'clever', 'gentle', 'happy', 'kind',
    'light', 'noble', 'proud', 'swift', 'wise', 'bold', 'cool', 'fair',
  ];
  
  const nouns = [
    'tiger', 'eagle', 'wolf', 'bear', 'lion', 'hawk', 'fox', 'deer',
    'owl', 'panda', 'shark', 'whale', 'dragon', 'phoenix', 'falcon', 'raven',
  ];
  
  const numbers = Math.floor(Math.random() * 1000);
  
  const adj1 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj1}-${adj2}-${noun}-${numbers}`;
}

/**
 * Validate if a room ID is in the correct format
 */
export function isValidRoomId(roomId: string): boolean {
  // Format: word-word-word-number
  const pattern = /^[a-z]+-[a-z]+-[a-z]+-\d{1,4}$/;
  return pattern.test(roomId);
}
