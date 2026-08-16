import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BookmarkCard from './BookmarkCard'

const bookmark = {
  id: 7,
  url: 'https://example.com',
  title: 'Example bookmark',
  description: 'A useful example page',
  summary: null,
  summary_status: 'failed',
}

function renderBookmarkCard(overrides = {}) {
  const props = {
    bookmark,
    isRetrying: false,
    isDeleting: false,
    onRetry: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }

  render(<BookmarkCard {...props} />)
  return props
}

describe('BookmarkCard', () => {
  it('shows the saved bookmark information', () => {
    renderBookmarkCard()

    expect(
      screen.getByRole('heading', { name: 'Example bookmark' }),
    ).toBeInTheDocument()
    expect(screen.getByText('A useful example page')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visit page' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('shows retry only when summary generation failed', () => {
    const { rerender } = render(
      <BookmarkCard
        bookmark={bookmark}
        isRetrying={false}
        isDeleting={false}
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Retry summary' }),
    ).toBeInTheDocument()

    rerender(
      <BookmarkCard
        bookmark={{ ...bookmark, summary_status: 'completed' }}
        isRetrying={false}
        isDeleting={false}
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Retry summary' }),
    ).not.toBeInTheDocument()
  })

  it('calls the edit handler when Edit is selected', async () => {
    const user = userEvent.setup()
    const props = renderBookmarkCard()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(props.onEdit).toHaveBeenCalledOnce()
  })

  it('calls the delete handler when Delete is selected', async () => {
    const user = userEvent.setup()
    const props = renderBookmarkCard()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(props.onDelete).toHaveBeenCalledOnce()
  })
})
