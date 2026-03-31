export default function ThemeScript() {
  const script = `
    try {
      var storedTheme = localStorage.getItem('landed-theme');
      var theme = storedTheme || 'light';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {}
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
