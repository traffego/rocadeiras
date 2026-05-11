/**
 * Utilitários de data para o fuso horário de São Paulo (UTC-3).
 * Usar sempre estas funções para garantir consistência em todo o sistema.
 */

const TZ = 'America/Sao_Paulo'
const LOCALE = 'pt-BR'

/**
 * Formata uma data/string ISO como dd/mm/aaaa no fuso SP.
 * Ex: formatDate('2024-01-15T02:00:00Z') → '14/01/2024'
 */
export function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString(LOCALE, {
        timeZone: TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

/**
 * Formata uma data/string ISO como dd/mm/aaaa às HH:MM no fuso SP.
 */
export function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    const date = d.toLocaleDateString(LOCALE, { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
    const time = d.toLocaleTimeString(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
    return `${date} às ${time}`
}

/**
 * Formata só o horário HH:MM no fuso SP.
 */
export function formatTime(value) {
    if (!value) return '—'
    return new Date(value).toLocaleTimeString(LOCALE, {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Formata data longa: ex. "15 de janeiro de 2024" no fuso SP.
 */
export function formatDateLong(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString(LOCALE, {
        timeZone: TZ,
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}
