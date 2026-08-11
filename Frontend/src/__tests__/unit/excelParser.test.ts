import { describe, it, expect } from 'vitest'
import { parseExcelClipboard, parseNumberCell, parseWeekCell } from '../../lib/excelParser'

describe('excelParser unit tests', () => {
  describe('parseNumberCell', () => {
    it('converts European comma decimals to standard dots', () => {
      expect(parseNumberCell('3,2')).toBe(3.2)
      expect(parseNumberCell('82,5')).toBe(82.5)
      expect(parseNumberCell(' 12,05 ')).toBe(12.05)
    })

    it('parses standard dot decimals', () => {
      expect(parseNumberCell('4.5')).toBe(4.5)
      expect(parseNumberCell('9200')).toBe(9200)
    })

    it('maps empty cells or whitespace to null', () => {
      expect(parseNumberCell('')).toBeNull()
      expect(parseNumberCell('   ')).toBeNull()
      expect(parseNumberCell('-')).toBeNull()
      expect(parseNumberCell('N/A')).toBeNull()
      expect(parseNumberCell(undefined)).toBeNull()
    })

    it('returns null for invalid numbers', () => {
      expect(parseNumberCell('abc')).toBeNull()
    })
  })

  describe('parseWeekCell', () => {
    it('parses numeric and labeled week strings', () => {
      expect(parseWeekCell('25')).toBe(25)
      expect(parseWeekCell('CW25')).toBe(25)
      expect(parseWeekCell(' W25 ')).toBe(25)
      expect(parseWeekCell('Week 25')).toBe(25)
    })

    it('returns null for empty strings', () => {
      expect(parseWeekCell('')).toBeNull()
      expect(parseWeekCell('   ')).toBeNull()
      expect(parseWeekCell(undefined)).toBeNull()
    })
  })

  describe('parseExcelClipboard', () => {
    it('handles clipboard data with header row and European decimals', () => {
      const pasteData = `set\tweek\tOutput\tscrape\toee\tcim1\tcim2\tcim3\r\nSet 1\t25\t9200\t1,5\t82,5\t95,2\t94,1\t96,0`

      const result = parseExcelClipboard(pasteData)

      expect(result.hasHeader).toBe(true)
      expect(result.rows).toHaveLength(1)

      const row = result.rows[0]
      expect(row.setRaw).toBe('Set 1')
      expect(row.weekNum).toBe(25)
      expect(row.output).toBe(9200)
      expect(row.scrap).toBe(1.5)
      expect(row.oee).toBe(82.5)
      expect(row.cim1).toBe(95.2)
      expect(row.cim2).toBe(94.1)
      expect(row.cim3).toBe(96.0)
    })

    it('maps empty cells to null rather than 0 or NaN', () => {
      const pasteData = `Set 2\tCW26\t9500\t\t80,0\t\t\t`

      const result = parseExcelClipboard(pasteData)

      expect(result.hasHeader).toBe(false)
      expect(result.rows).toHaveLength(1)

      const row = result.rows[0]
      expect(row.setRaw).toBe('Set 2')
      expect(row.weekNum).toBe(26)
      expect(row.output).toBe(9500)
      expect(row.scrap).toBeNull()
      expect(row.oee).toBe(80.0)
      expect(row.cim1).toBeNull()
      expect(row.cim2).toBeNull()
      expect(row.cim3).toBeNull()
    })

    it('sanitizes leading and trailing whitespace from cell text', () => {
      const pasteData = `  Set 3  \t  27  \t  10000  \t  2,0  `

      const result = parseExcelClipboard(pasteData)
      const row = result.rows[0]

      expect(row.setRaw).toBe('Set 3')
      expect(row.weekNum).toBe(27)
      expect(row.output).toBe(10000)
      expect(row.scrap).toBe(2.0)
    })

    it('splits rows by \\n and ignores completely blank trailing lines', () => {
      const pasteData = "Set 1\t25\t9200\r\nSet 2\t26\t9300\r\n\r\n  \r\n"

      const result = parseExcelClipboard(pasteData)

      expect(result.rows).toHaveLength(2)
      expect(result.rows[0].setRaw).toBe('Set 1')
      expect(result.rows[1].setRaw).toBe('Set 2')
    })
  })
})
