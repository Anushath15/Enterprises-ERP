/**
 * Tailwind CSS Configuration for Senthil Enterprises ERP
 * Reuses the existing design language.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1F2937',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  }
}
