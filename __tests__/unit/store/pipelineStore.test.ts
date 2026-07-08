import { usePipelineStore } from '@/lib/store/pipelineStore';

describe('pipelineStore', () => {
  beforeEach(() => {
    usePipelineStore.setState({ pipelines: [] });
  });

  it('saves a new pipeline with id and timestamps', () => {
    const saved = usePipelineStore.getState().savePipeline({
      name: 'My chain',
      steps: [{ toolId: 'base64-encode', options: {} }],
    });

    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeGreaterThan(0);
    expect(usePipelineStore.getState().pipelines).toHaveLength(1);
  });

  it('updates an existing pipeline when id is passed', () => {
    const saved = usePipelineStore.getState().savePipeline({
      name: 'v1',
      steps: [{ toolId: 'base64-encode', options: {} }],
    });
    usePipelineStore.getState().savePipeline(
      { name: 'v2', steps: [{ toolId: 'json-format', options: {} }] },
      saved.id
    );

    const all = usePipelineStore.getState().pipelines;
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('v2');
    expect(all[0].steps[0].toolId).toBe('json-format');
    expect(all[0].id).toBe(saved.id);
  });

  it('deletes and renames pipelines', () => {
    const a = usePipelineStore.getState().savePipeline({ name: 'a', steps: [{ toolId: 'x' }] });
    const b = usePipelineStore.getState().savePipeline({ name: 'b', steps: [{ toolId: 'y' }] });

    usePipelineStore.getState().renamePipeline(a.id, 'renamed');
    usePipelineStore.getState().deletePipeline(b.id);

    const all = usePipelineStore.getState().pipelines;
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('renamed');
  });
});
