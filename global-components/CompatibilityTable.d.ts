interface Header {
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  group?: string
  subtitle?: string
  href?: string
}

type Row = string[]

export interface CompatibilityTableProps {
  table: string
  mode?: 'popover' | 'table'
}

export interface MdTableOptions {
  rows: Row[]
  headers: Header[]
  status: 'SUPPORTED' | 'NOT_SUPPORTED' | 'PARTIALLY_SUPPORTED'
}
