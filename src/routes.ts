/**
 * Single source of truth for the app's paths, so a rename can't silently
 * desync a <Route path> from the navigate()/<Navigate to> calls that target it.
 */
export const routes = {
  login: '/login',
  newChat: '/new-chat',
  chat: (phone: string) => `/chat/${phone}`,
} as const

/** The pattern react-router matches on — kept next to routes.chat so both change together. */
export const CHAT_ROUTE_PATTERN = '/chat/:phone'
