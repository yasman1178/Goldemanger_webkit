import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/shared/components/ui/button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>اضغط هنا</Button>)
    expect(screen.getByRole('button', { name: 'اضغط هنا' })).toBeInTheDocument()
  })
})
