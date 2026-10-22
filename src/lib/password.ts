/** Mirrors the Supabase Auth password policy (set it to the same rules in the dashboard). */
export function passwordProblem(pw: string, email?: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return "Use both letters and numbers.";
  if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) return "Don't use your email name in your password.";
  if (/^(password|klasmeyt|adamson)/i.test(pw)) return "Choose a less guessable password.";
  return null;
}
