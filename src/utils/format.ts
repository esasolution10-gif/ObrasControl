export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  // Parse as local date to avoid timezone offset issues
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR')
}

export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function getInitials(nome: string): string {
  const parts = nome.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase()
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
}
