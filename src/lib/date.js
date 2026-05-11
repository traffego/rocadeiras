/**
 * Utilitários de data para o fuso horário de São Paulo (UTC-3).
 * Usar sempre estas funções para garantir consistência em todo o sistema.
 */

const TZ = 'America/Sao_Paulo'
const LOCALE = 'pt-BR'

/**
 * Formata uma data/string ISO como dd/mm/aaaa no fuso SP.
 *
 * ATENÇÃO: datas puras do Postgres ("2026-05-11") são interpretadas pelo JS
 * como UTC midnight. Em UTC-3 isso vira 10/05 21:00 → dia errado.
 * Para esse caso extraímos as partes direto, sem passar pelo Date object.
 */
export function formatDate(value) {
    if (!value) return '—'
    // Data pura sem hora: extrair partes diretamente
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-')
        return `${d}/${m}/${y}`
    }
    // Timestamp com hora: aplicar timezone SP
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
