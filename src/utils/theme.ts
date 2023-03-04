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
  // Set the theme on the document root element, so that background.scss
  // displays the correct placeholder to avoid a FOUC
  document.documentElement.setAttribute('data-theme', theme)
  // Load the theme's stylesheet
  if (theme === 'light') {
    await import('@/assets/style/light.scss')
  } else {
    await import('@/assets/style/dark.scss')
  }
}
