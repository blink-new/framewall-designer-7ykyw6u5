export interface FrameSize {
  id: string
  name: string
  width: number
  height: number
  price: number
}

export interface GridCell {
  id: string
  row: number
  col: number
  frameSize?: FrameSize
  imageUrl?: string
  imageName?: string
}

export interface Design {
  id: string
  name: string
  userId: string
  gridRows: number
  gridCols: number
  cells: GridCell[]
  totalPrice: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  displayName?: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}