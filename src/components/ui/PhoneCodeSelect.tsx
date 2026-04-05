'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export interface CountryCode {
  code: string
  iso:  string   // código ISO 2 letras para a imagem da bandeira
  name: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+351', iso: 'pt', name: 'Portugal' },
  { code: '+34',  iso: 'es', name: 'Espanha' },
  { code: '+33',  iso: 'fr', name: 'França' },
  { code: '+44',  iso: 'gb', name: 'Reino Unido' },
  { code: '+49',  iso: 'de', name: 'Alemanha' },
  { code: '+39',  iso: 'it', name: 'Itália' },
  { code: '+32',  iso: 'be', name: 'Bélgica' },
  { code: '+31',  iso: 'nl', name: 'Holanda' },
  { code: '+41',  iso: 'ch', name: 'Suíça' },
  { code: '+43',  iso: 'at', name: 'Áustria' },
  { code: '+352', iso: 'lu', name: 'Luxemburgo' },
  { code: '+30',  iso: 'gr', name: 'Grécia' },
  { code: '+48',  iso: 'pl', name: 'Polónia' },
  { code: '+420', iso: 'cz', name: 'República Checa' },
  { code: '+40',  iso: 'ro', name: 'Roménia' },
  { code: '+55',  iso: 'br', name: 'Brasil' },
  { code: '+244', iso: 'ao', name: 'Angola' },
  { code: '+258', iso: 'mz', name: 'Moçambique' },
  { code: '+238', iso: 'cv', name: 'Cabo Verde' },
]

function flagUrl(iso: string) {
  return `https://flagcdn.com/w40/${iso}.png`
}

interface Props {
  value:    string
  onChange: (code: string) => void
}

export function PhoneCodeSelect({ value, onChange }: Props) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref                 = useRef<HTMLDivElement>(null)

  const selected = COUNTRY_CODES.find(c => c.code === value) ?? COUNTRY_CODES[0]

  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(code: string) {
    onChange(code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-[96px]"
      >
        <img
          src={flagUrl(selected.iso)}
          alt={selected.name}
          className="w-6 h-auto rounded-sm object-cover shadow-sm"
        />
        <span className="text-sm font-medium text-gray-700">{selected.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Pesquisa */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar país…"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Lista */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum resultado</li>
            ) : (
              filtered.map(c => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => select(c.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors ${
                      c.code === value ? 'bg-orange-50' : ''
                    }`}
                  >
                    <img
                      src={flagUrl(c.iso)}
                      alt={c.name}
                      className="w-7 h-auto rounded-sm object-cover shadow-sm flex-shrink-0"
                    />
                    <span className={`flex-1 text-left text-sm ${c.code === value ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                      {c.name}
                    </span>
                    <span className={`font-mono text-xs ${c.code === value ? 'text-orange-500' : 'text-gray-400'}`}>
                      {c.code}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
