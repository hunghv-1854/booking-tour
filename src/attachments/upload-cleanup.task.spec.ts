import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  symlink,
  utimes,
  writeFile,
} from 'fs/promises';
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

const ORPHAN_OLD = '11111111-1111-4111-8111-111111111111';
const KEPT = '22222222-2222-4222-8222-222222222222';
const ORPHAN_NEW = '33333333-3333-4333-8333-333333333333';
const BROKEN = '44444444-4444-4444-8444-444444444444';

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
    await createFile('tours', `${ORPHAN_OLD}.png`, 2 * day);
    await createFile('tours', `${KEPT}.png`, 2 * day);
    await createFile('tours', `${ORPHAN_NEW}.png`, 60 * 1000);
    await createFile('avatars', '.gitkeep', 2 * day);
    await createFile('avatars', 'not-a-uuid.png', 2 * day);
    attachmentsRepository.find.mockResolvedValue([{ id: KEPT }]);

    const removed = await task.removeOrphanFiles();

    expect(removed).toEqual([`/uploads/tours/${ORPHAN_OLD}.png`]);
    expect((await filesIn('tours')).sort()).toEqual([
      `${KEPT}.png`,
      `${ORPHAN_NEW}.png`,
    ]);
    expect((await filesIn('avatars')).sort()).toEqual([
      '.gitkeep',
      'not-a-uuid.png',
    ]);
    expect(attachmentsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: expect.anything() as unknown },
      }),
    );
  });

  it('does not query the database when there is no old file', async () => {
    await createFile('tours', `${ORPHAN_NEW}.png`, 60 * 1000);

    await expect(task.removeOrphanFiles()).resolves.toEqual([]);
    expect(attachmentsRepository.find).not.toHaveBeenCalled();
  });

  it('skips entries that cannot be stat-ed instead of failing the run', async () => {
    await createFile('tours', `${ORPHAN_OLD}.png`, 2 * day);
    await symlink(
      join(mockPublicDir, 'missing.png'),
      join(mockPublicDir, 'uploads', 'tours', `${BROKEN}.png`),
    );
    attachmentsRepository.find.mockResolvedValue([]);

    await expect(task.removeOrphanFiles()).resolves.toEqual([
      `/uploads/tours/${ORPHAN_OLD}.png`,
    ]);
  });
});
