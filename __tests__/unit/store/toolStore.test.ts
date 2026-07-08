import { useToolStore, HISTORY_FIELD_MAX_CHARS } from '@/lib/store/toolStore';

jest.mock('@/lib/analytics/middleware/toolStoreMiddleware', () => ({
  trackToolUsage: jest.fn(),
}));

import { trackToolUsage } from '@/lib/analytics/middleware/toolStoreMiddleware';

function makeOperation(overrides: Partial<Parameters<ReturnType<typeof useToolStore.getState>['addToHistory']>[0]> = {}) {
  return {
    id: 'op-1',
    tool: 'json-formatter',
    input: 'small input',
    output: 'small output',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('toolStore addToHistory', () => {
  beforeEach(() => {
    useToolStore.setState({ history: [] });
    jest.clearAllMocks();
  });

  it('stores small input/output unchanged', () => {
    useToolStore.getState().addToHistory(makeOperation());

    const [entry] = useToolStore.getState().history;
    expect(entry.input).toBe('small input');
    expect(entry.output).toBe('small output');
  });

  it('truncates oversized input and output before storing (INP: keeps persist/rehydrate cheap)', () => {
    const bigInput = 'a'.repeat(HISTORY_FIELD_MAX_CHARS + 10_000);
    const bigOutput = 'b'.repeat(HISTORY_FIELD_MAX_CHARS + 50_000);

    useToolStore.getState().addToHistory(makeOperation({ input: bigInput, output: bigOutput }));

    const [entry] = useToolStore.getState().history;
    expect(entry.input.length).toBe(HISTORY_FIELD_MAX_CHARS);
    expect(entry.output.length).toBe(HISTORY_FIELD_MAX_CHARS);
    expect(entry.input).toBe(bigInput.slice(0, HISTORY_FIELD_MAX_CHARS));
    expect(entry.output).toBe(bigOutput.slice(0, HISTORY_FIELD_MAX_CHARS));
  });

  it('passes the ORIGINAL untruncated operation to analytics (input/output sizes must stay exact)', () => {
    jest.useFakeTimers();
    const bigInput = 'a'.repeat(HISTORY_FIELD_MAX_CHARS + 10_000);

    useToolStore.getState().addToHistory(makeOperation({ input: bigInput }));
    jest.runAllTimers(); // flush requestIdleCallback fallback / setTimeout

    expect(trackToolUsage).toHaveBeenCalledTimes(1);
    const trackedOperation = (trackToolUsage as jest.Mock).mock.calls[0][0];
    expect(trackedOperation.input).toBe(bigInput);
    jest.useRealTimers();
  });

  it('keeps history capped at 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      useToolStore.getState().addToHistory(makeOperation({ id: `op-${i}` }));
    }
    expect(useToolStore.getState().history.length).toBe(50);
    expect(useToolStore.getState().history[0].id).toBe('op-59');
  });
});
