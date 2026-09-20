export interface ProjectStatusInfo {
  statusNote: string
  statusColor: string
}

/**
 * Resolves the plant launch/ramp-up status note.
 * As requested, status notes are categorized as "Successful launch" or "Ramp-up phase".
 * No fake plant names, countries, or SOP dates are hardcoded.
 */
export function getProjectStatus(
  projectName: string,
  oee: number | null | undefined
): ProjectStatusInfo {
  const norm = (projectName || '').toLowerCase().trim()

  // Specific project distinctions if applicable
  if (norm.includes('ksk') || norm.includes('autrak') || norm.includes('autark')) {
    return {
      statusNote: 'Ramp-up phase',
      statusColor: 'text-amber-600',
    }
  }

  if (norm.includes('meb31') || norm.includes('meb21 hv') || norm.includes('tiguan')) {
    if (oee == null || oee >= 75) {
      return {
        statusNote: 'Successful launch',
        statusColor: 'text-emerald-600',
      }
    }
  }

  // General rule based on real OEE performance
  if (oee != null) {
    if (oee >= 80) {
      return {
        statusNote: 'Successful launch',
        statusColor: 'text-emerald-600',
      }
    }
    return {
      statusNote: 'Ramp-up phase',
      statusColor: 'text-amber-600',
    }
  }

  // If no OEE recorded yet for the week
  return {
    statusNote: 'Ramp-up phase',
    statusColor: 'text-amber-600',
  }
}
