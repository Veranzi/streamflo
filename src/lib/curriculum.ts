/**
 * Kenya renamed CBC (Competency Based Curriculum) to CBE (Competency Based Education).
 * Older records store "CBC" and newer ones "CBE" (search matches both); always show "CBE".
 */
export function curriculumLabel<T extends string | null | undefined>(value: T): T {
  return (typeof value === "string" ? value.replace(/\bCBC\b/g, "CBE") : value) as T;
}
