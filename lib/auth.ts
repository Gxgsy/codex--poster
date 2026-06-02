export function isPasswordValid(input: string, expected: string | undefined): boolean {
  if (!expected) {
    return true;
  }

  return input.length > 0 && input === expected;
}

export function requireAccessPassword(input: string | null): void {
  const password = input === null ? "" : input;

  if (!isPasswordValid(password, process.env.APP_ACCESS_PASSWORD)) {
    throw new Error("Invalid access password.");
  }
}
