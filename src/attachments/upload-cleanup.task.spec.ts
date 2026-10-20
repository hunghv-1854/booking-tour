import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { UploadCleanupTask } from './upload-cleanup.task';

let mockPublicDir = '';

jest.mock('./attachments.constants', () => ({
  ...jest.requireActual<object>('./attachments.constants'),
  get PUBLIC_DIR() {
    return mockPublicDir;
  },
}));

describe('UploadCleanupTask', () => {
  const day = 24 * 60 * 60 * 1000;
  const attachmentsRepository = { find: jest.fn() };
  const task = new UploadCleanupTask(
    attachmentsRepository as unknown as Repository<Attachment>,
  );

  const createFile = async (folder: string, name: string, ageMs: number) => {
    const path = join(mockPublicDir, 'uploads', folder, name);
    await writeFile(path, 'x');
    const time = new Date(Date.now() - ageMs);
    await utimes(path, time, time);
  };
  const filesIn = (folder: string) =>
    readdir(join(mockPublicDir, 'uploads', folder));

  beforeEach(async () => {
    mockPublicDir = await mkdtemp(join(tmpdir(), 'uploads-'));
    await mkdir(join(mockPublicDir, 'uploads', 'avatars'), { recursive: true });
    await mkdir(join(mockPublicDir, 'uploads', 'tours'), { recursive: true });
    attachmentsRepository.find.mockReset();
  });

  afterEach(async () => {
    await rm(mockPublicDir, { recursive: true, force: true });
  });

  it('removes only old files that no attachment references', async () => {
    await createFile('tours', 'orphan-old.png', 2 * day);
    await createFile('tours', 'kept-referenced.png', 2 * day);
    await createFile('tours', 'orphan-new.png', 60 * 1000);
    await createFile('avatars', '.gitkeep', 2 * day);
    attachmentsRepository.find.mockResolvedValue([
      { url: '/uploads/tours/kept-referenced.png' },
    ]);

    const removed = await task.removeOrphanFiles();

    expect(removed).toEqual(['/uploads/tours/orphan-old.png']);
    expect((await filesIn('tours')).sort()).toEqual([
      'kept-referenced.png',
      'orphan-new.png',
    ]);
    expect(await filesIn('avatars')).toEqual(['.gitkeep']);
  });

  it('does not query the database when there is no old file', async () => {
    await createFile('tours', 'fresh.png', 60 * 1000);

    await expect(task.removeOrphanFiles()).resolves.toEqual([]);
    expect(attachmentsRepository.find).not.toHaveBeenCalled();
  });
});
