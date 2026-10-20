/** A policy's text, structured so one renderer serves both pages. */
export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; columns: string[]; rows: string[][] }

export type LegalSection = { title: string; blocks: LegalBlock[] }

export type LegalDocument = {
  title: string
  /** yyyy-mm-dd */
  updated: string
  intro: string
  sections: LegalSection[]
}
