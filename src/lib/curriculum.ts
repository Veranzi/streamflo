/**
 * Kenya renamed CBC (Competency Based Curriculum) to CBE (Competency Based Education).
 * Stored data and backend APIs still use the value "CBC"; always show it to people as "CBE".
 */
export function curriculumLabel<T extends string | null | undefined>(value: T): T {
  return (typeof value === "string" ? value.replace(/\bCBC\b/g, "CBE") : value) as T;
}
