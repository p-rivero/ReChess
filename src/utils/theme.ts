const DEFAULT_THEME = 'light'

export function toggleTheme() {
  const theme = localStorage.getItem('theme') || DEFAULT_THEME
  const newTheme = theme === 'dark' ? 'light' : 'dark'
  // Store the new theme in localStorage so it persists across page refreshes
  localStorage.setItem('theme', newTheme)
  // Reload page to apply the new theme
  window.location.reload()
}

export async function loadTheme() {
  const theme = localStorage.getItem('theme') || DEFAULT_THEME
  if (theme === 'light') {
    // console.log('import: light')
    // Load the light theme CSS
    await import('@/assets/style/light.scss')
  } else {
    console.log('import: dark')
    // Load the dark theme CSS
    await import('@/assets/style/dark.scss')
  }
}
