import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test, describe } from 'vitest'
import WorkflowStepper from '../src/components/WorkflowStepper'

describe('WorkflowStepper Component', () => {
  const STEPS = [
    'Register Voters',
    'Proposals Open',
    'Proposals Closed',
    'Voting Open',
    'Voting Closed',
    'Votes Tallied'
  ]

  test('renders all 6 workflow step labels', () => {
    render(<WorkflowStepper currentStatus={0} />)
    
    STEPS.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument()
    })
  })

  test('renders correct active status and checkmarks for completed steps', () => {
    // Let's set currentStatus to 2 ("Proposals Closed" is active, 0 and 1 are completed, 3+ are future)
    render(<WorkflowStepper currentStatus={2} />)

    // Completed steps (index 0 and 1) should show '✓' instead of numbers
    // Note: index + 1 is what would show for future/current steps.
    // In our implementation, we render {isCompleted ? '✓' : index + 1}.
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks).toHaveLength(2)

    // Current active step (index 2) should show '3'
    expect(screen.getByText('3')).toBeInTheDocument()

    // Future steps should show their index + 1
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })
})
