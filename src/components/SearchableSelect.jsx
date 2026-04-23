import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * SearchableSelect — combobox com busca embutida (sem Command/Popover para evitar dependência circular)
 */
export function SearchableSelect({
    value,
    onValueChange,
    options = [],
    placeholder = 'Selecione...',
    searchPlaceholder = 'Buscar...',
    disabled = false,
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef(null)

    const selected = options.find(o => o.id === value)

    const filtered = options.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase())
    )

    // Fecha ao clicar fora
    useEffect(() => {
        const handleClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleSelect = (opt) => {
        onValueChange(opt.id === value ? '' : opt.id)
        setOpen(false)
        setSearch('')
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen(prev => !prev)}
                className="w-full justify-between font-normal"
            >
                <span className="truncate text-left">
                    {selected ? selected.name : <span className="text-muted-foreground">{placeholder}</span>}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-8 text-sm"
                            onKeyDown={e => {
                                if (e.key === 'Escape') setOpen(false)
                                if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0])
                            }}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Nenhum resultado encontrado.
                            </p>
                        ) : (
                            filtered.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => handleSelect(opt)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        value === opt.id && 'bg-accent'
                                    )}
                                >
                                    <Check className={cn('h-4 w-4 shrink-0', value === opt.id ? 'opacity-100' : 'opacity-0')} />
                                    {opt.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
