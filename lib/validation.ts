export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const INVALID_CHARACTERS = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
const MAX_NAME_LENGTH = 255;

export function validateFileName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: "Name cannot be empty",
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be less than ${MAX_NAME_LENGTH} characters`,
    };
  }

  const invalidChars = INVALID_CHARACTERS.filter((char) =>
    trimmedName.includes(char)
  );

  if (invalidChars.length > 0) {
    return {
      valid: false,
      error: `Name contains invalid characters: ${invalidChars.join(", ")}`,
    };
  }

  if (trimmedName.startsWith('.')) {
    return {
      valid: false,
      error: "Name cannot start with a dot",
    };
  }

  return { valid: true };
}

export function checkDuplicateName(
  name: string,
  existingNames: string[]
): boolean {
  const normalizedName = name.trim().toLowerCase();
  return existingNames.some(
    (existingName) => existingName.toLowerCase() === normalizedName
  );
}
