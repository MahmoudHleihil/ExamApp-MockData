import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import React from 'react';
import PortalTabs from '../components/student/PortalTabs';

describe('PortalTabs', () => {
  it('renders both navigation links', () => {
    render(
      <HashRouter>
        <PortalTabs />
      </HashRouter>
    );

    expect(screen.getByText(/Take Exam/i)).toBeInTheDocument();
    expect(screen.getByText(/My Feedback/i)).toBeInTheDocument();
  });

  it('links have correct href attributes', () => {
    render(
      <HashRouter>
        <PortalTabs />
      </HashRouter>
    );

    const takeExamLink = screen.getByText(/Take Exam/i).closest('a');
    const feedbackLink = screen.getByText(/My Feedback/i).closest('a');

    expect(takeExamLink).toHaveAttribute('href', '#/student/exams');
    expect(feedbackLink).toHaveAttribute('href', '#/student/feedback');
  });
});
