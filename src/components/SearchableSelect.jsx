import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

/**
 * SearchableSelect — combobox com busca embutida
 * @param {string}   value          — id selecionado
 * @param {function} onValueChange  — callback(id)
 * @param {Array}    options        — [{ id, name }]
 * @param {string}   placeholder    — texto padrão
 * @param {string}   searchPlaceholder
 * @param {boolean}  disabled
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

    const selected = options.find(o => o.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selected ? selected.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                        <CommandGroup>
                            {options.map(opt => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.name}
                                    onSelect={() => {
                                        onValueChange(opt.id === value ? '' : opt.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === opt.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {opt.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
