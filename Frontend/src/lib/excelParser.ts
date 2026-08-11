export interface ExcelParsedRow {
  id: string
  setRaw: string
  weekNum: number | null
  output: number | null
  scrap: number | null
  oee: number | null
  cim1: number | null
  cim2: number | null
  cim3: number | null
  rawCells: string[]
}

export interface ParseExcelResult {
  rows: ExcelParsedRow[]
  hasHeader: boolean
  ignoredBlankCount: number
}

/**
  Checks whether a cell string represents a non-empty header title.
  Headers can be 'set', 'week', 'output', 'scrape', 'scrap', 'oee', 'cim1', 'cim2', 'cim3', etc.
 */
function isHeaderCell(cell: string): boolean {
  const normalized = cell.trim().toLowerCase()
  const knownHeaders = ['set', 'week', 'output', 'scrape', 'scrap', 'scrap rate', 'oee', 'cim1', 'cim2', 'cim3', 'cim-1', 'cim-2', 'cim-3']
  return knownHeaders.includes(normalized)
}

/**
  Parses a raw cell string into a numeric value or null.
  - Trims accidental whitespace.
  - Converts European comma decimals (e.g. "3,2") to dot decimals ("3.2").
  - Empty cells or invalid non-numbers return null.
 */
export function parseNumberCell(cellStr: string | undefined): number | null {
  if (!cellStr) return null
  const trimmed = cellStr.trim()
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null') {
    return null
  }
  // Convert European comma decimal to dot
  const normalized = trimmed.replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? null : num
}

/**
  Parses a raw week string like "25", "CW25", "W25", "Week 25" into integer week number.
 */
export function parseWeekCell(cellStr: string | undefined): number | null {
  if (!cellStr) return null
  const trimmed = cellStr.trim()
  if (trimmed === '') return null
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null
  const parsed = parseInt(digits, 10)
  return isNaN(parsed) ? null : parsed
}

/**
  Main Excel Clipboard Parser
  Columns in exact order: set, week, Output, scrape, oee, cim1, cim2, cim3.
 */
export function parseExcelClipboard(text: string): ParseExcelResult {
  if (!text || text.trim() === '') {
    return { rows: [], hasHeader: false, ignoredBlankCount: 0 }
  }

  // 1. Split rows by \r\n or \n
  const rawRows = text.split(/\r?\n/)
  const validRawRows = rawRows.filter((r) => r.trim().length > 0)
  const ignoredBlankCount = rawRows.length - validRawRows.length

  if (validRawRows.length === 0) {
    return { rows: [], hasHeader: false, ignoredBlankCount }
  }

  // 2. Check header row detection on the first row
  const firstRowCells = validRawRows[0].split('\t').map((c) => c.trim())
  const hasHeader = firstRowCells.some((cell) => isHeaderCell(cell)) || isNaN(Number(firstRowCells[1]?.replace(/\D/g, '')))

  const dataRowsText = hasHeader ? validRawRows.slice(1) : validRawRows

  const rows: ExcelParsedRow[] = dataRowsText.map((rowStr, index) => {
    const rawCells = rowStr.split('\t').map((c) => c.trim())

    const setRaw = rawCells[0] ? rawCells[0].trim() : ''
    const weekNum = parseWeekCell(rawCells[1])
    const output = parseNumberCell(rawCells[2])
    const scrap = parseNumberCell(rawCells[3])
    const oee = parseNumberCell(rawCells[4])
    const cim1 = parseNumberCell(rawCells[5])
    const cim2 = parseNumberCell(rawCells[6])
    const cim3 = parseNumberCell(rawCells[7])

    return {
      id: `row-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      setRaw,
      weekNum,
      output,
      scrap,
      oee,
      cim1,
      cim2,
      cim3,
      rawCells,
    }
  })

  return {
    rows,
    hasHeader,
    ignoredBlankCount,
  }
}
