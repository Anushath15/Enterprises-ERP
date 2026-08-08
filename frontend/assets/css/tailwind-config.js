/**
 * Tailwind CSS Configuration for Senthil Enterprises ERP
 * Reuses the existing design language.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        text: 'var(--color-text)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  }
}

