/**
 * Utility for redacting PII (Personally Identifiable Information)
 * for guest users.
 */

/**
 * Redacts a full name to "First Name L." (e.g., "John Doe" -> "John D.")
 * or just the first name if requested.
 */
export const redactName = (firstName?: string, lastName?: string): string => {
  if (!firstName) return "User";
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
};

/**
 * Masks sensitive text like phone numbers, emails, or URLs.
 * (Simple pattern-based replacement)
 */
export const redactSensitiveText = (text: string): string => {
  if (!text) return "";
  
  // Basic email redaction
  let redacted = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email hidden]");
  
  // Basic phone number redaction (handles various formats)
  redacted = redacted.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}/g, "[phone hidden]");
  
  return redacted;
};
