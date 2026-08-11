import { useState, useCallback, type ClipboardEvent } from 'react'
import { parseExcelClipboard, type ExcelParsedRow } from '../lib/excelParser'

export function useExcelPaste() {
  const [rows, setRows] = useState<ExcelParsedRow[]>([])
  const [hasHeaderDetected, setHasHeaderDetected] = useState(false)
  const [lastPastedCount, setLastPastedCount] = useState<number | null>(null)

  const handlePasteText = useCallback((text: string) => {
    const result = parseExcelClipboard(text)
    setRows(result.rows)
    setHasHeaderDetected(result.hasHeader)
    setLastPastedCount(result.rows.length)
  }, [])

  const handlePasteEvent = useCallback(
    (e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement | HTMLInputElement>) => {
      const clipboardData = e.clipboardData?.getData('text/plain')
      if (clipboardData) {
        e.preventDefault()
        handlePasteText(clipboardData)
      }
    },
    [handlePasteText],
  )

  const updateCell = useCallback((rowId: string, field: keyof ExcelParsedRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r
        return {
          ...r,
          [field]: value,
        }
      }),
    )
  }, [])

  const deleteRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
  }, [])

  const clearRows = useCallback(() => {
    setRows([])
    setHasHeaderDetected(false)
    setLastPastedCount(null)
  }, [])

  return {
    rows,
    setRows,
    hasHeaderDetected,
    lastPastedCount,
    handlePasteEvent,
    handlePasteText,
    updateCell,
    deleteRow,
    clearRows,
  }
}
