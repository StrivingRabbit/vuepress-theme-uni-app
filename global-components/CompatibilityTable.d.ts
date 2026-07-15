interface Header {
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

type Row = string[]

export interface MdTableOptions {
  rows: Row[]
  headers: Header[]
  status: 'SUPPORTED' | 'UNSUPPORTED' | 'PARTIALLY_SUPPORTED'
}
