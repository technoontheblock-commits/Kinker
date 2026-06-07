export interface UserType {
  id: string
  name: string
  email: string
  avatar_url?: string
}

export interface Comment {
  id: string
  content: string
  created_at: string
  user: UserType
}

export interface Card {
  id: string
  title: string
  description?: string
  position: number
  due_date?: string
  assigned_to?: string
  assigned_user?: UserType
  created_by: string
  created_by_user?: UserType
  list_id: string
  comments?: Comment[]
}

export interface List {
  id: string
  title: string
  position: number
  board_id: string
  cards: Card[]
}

export interface Board {
  id: string
  title: string
  description?: string
  created_by: string
  created_by_user?: UserType
  created_at: string
  lists: List[]
}
