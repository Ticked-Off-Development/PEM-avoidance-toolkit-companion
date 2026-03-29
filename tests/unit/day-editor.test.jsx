import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DayEditor from '../../src/DayEditor.jsx';
import { emptyDay } from '../../src/utils.js';

describe('DayEditor - empty save prevention', () => {
  const noop = () => {};

  it('save is disabled on initial render with no data', () => {
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={noop} onCancel={noop} onDelete={null} />);
    const saveButtons = screen.getAllByText('Save');
    expect(saveButtons.length).toBe(2);
    saveButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
    unmount();
  });

  it('save enables after any field receives input', async () => {
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={noop} onCancel={noop} onDelete={null} />);
    // Verify initially disabled
    expect(screen.getAllByText('Save')[0]).toBeDisabled();
    // Click the "0" score button for Physical
    const zeroButtons = screen.getAllByRole('radio', { name: '0' });
    await act(async () => { fireEvent.click(zeroButtons[0]); });
    // Re-query after state update
    expect(screen.getAllByText('Save')[0]).not.toBeDisabled();
    unmount();
  });

  it('save is enabled when reopening an existing entry', () => {
    const existingDay = { ...emptyDay('2024-01-15'), physical: '5' };
    const deleteFn = vi.fn();
    const { unmount } = render(<DayEditor day={existingDay} onSave={noop} onCancel={noop} onDelete={deleteFn} />);
    const saveButtons = screen.getAllByText('Save');
    expect(saveButtons.length).toBe(2);
    saveButtons.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
    unmount();
  });

  it('does not call onSave when save is disabled', () => {
    const onSave = vi.fn();
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={onSave} onCancel={noop} onDelete={null} />);
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[0]);
    expect(onSave).not.toHaveBeenCalled();
    unmount();
  });

  it('setting crash to Yes enables save', async () => {
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={noop} onCancel={noop} onDelete={null} />);
    const crashButtons = screen.getAllByText('Yes — Crash');
    await act(async () => { fireEvent.click(crashButtons[0]); });
    expect(screen.getAllByText('Save')[0]).not.toBeDisabled();
    unmount();
  });

  it('entering a comment enables save', async () => {
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={noop} onCancel={noop} onDelete={null} />);
    const textareas = screen.getAllByLabelText('Comments about the day');
    await act(async () => { fireEvent.change(textareas[0], { target: { value: 'test' } }); });
    expect(screen.getAllByText('Save')[0]).not.toBeDisabled();
    unmount();
  });

  it('setting unrefreshing sleep to Yes enables save', async () => {
    const { unmount } = render(<DayEditor day={emptyDay('2024-01-15')} onSave={noop} onCancel={noop} onDelete={null} />);
    const yesButtons = screen.getAllByText('Yes');
    await act(async () => { fireEvent.click(yesButtons[0]); });
    expect(screen.getAllByText('Save')[0]).not.toBeDisabled();
    unmount();
  });
});
