import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AttachmentsService } from '../attachments/attachments.service';
import { OAuthProfile } from '../auth/auth.types';
import { UNIQUE_VIOLATION } from '../common/postgres-error.constants';
import { createI18nMock } from '../common/testing/i18n.mock';
import { OAuthProvider } from './oauth-provider.enum';
import { UserOAuthAccount } from './user-oauth-account.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService.findOrCreateByOAuth', () => {
  let service: UsersService;
  const oauthAccountsRepository = { findOne: jest.fn() };
  const manager = {
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => data),
    save: jest.fn((data: object) => Promise.resolve({ id: 20, ...data })),
    insert: jest.fn(),
  };
  const runInTransaction = (work: (m: typeof manager) => Promise<unknown>) =>
    work(manager);
  const transaction = jest.fn(runInTransaction);
  const generatePassword = jest.fn().mockResolvedValue('hashed');
  const profile: OAuthProfile = {
    provider: OAuthProvider.GOOGLE,
    providerUserId: 'google-123',
    email: 'An@Example.com',
    fullName: 'Nguyễn Văn An',
  };
  const existingUser = { id: 7, email: 'an@example.com' };

  beforeEach(async () => {
    jest.clearAllMocks();
    transaction.mockImplementation(runInTransaction);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        {
          provide: getRepositoryToken(UserOAuthAccount),
          useValue: oauthAccountsRepository,
        },
        { provide: getDataSourceToken(), useValue: { transaction } },
        { provide: AttachmentsService, useValue: {} },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('returns the already linked user without opening a transaction', async () => {
    oauthAccountsRepository.findOne.mockResolvedValue({ user: existingUser });

    await expect(
      service.findOrCreateByOAuth(profile, generatePassword),
    ).resolves.toBe(existingUser);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('links the Google account to an existing user with the same email', async () => {
    oauthAccountsRepository.findOne.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(existingUser);

    const user = await service.findOrCreateByOAuth(profile, generatePassword);

    expect(user).toBe(existingUser);
    expect(manager.findOne).toHaveBeenCalledWith(
      User,
      expect.objectContaining({ where: { email: 'an@example.com' } }),
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(generatePassword).not.toHaveBeenCalled();
    expect(manager.insert).toHaveBeenCalledWith(UserOAuthAccount, {
      userId: 7,
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'google-123',
    });
  });

  it('creates a new user with a generated password and links the account', async () => {
    oauthAccountsRepository.findOne.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(null);

    const user = await service.findOrCreateByOAuth(profile, generatePassword);

    expect(manager.create).toHaveBeenCalledWith(User, {
      email: 'an@example.com',
      fullName: 'Nguyễn Văn An',
      password: 'hashed',
    });
    expect(user.id).toBe(20);
    expect(manager.insert).toHaveBeenCalledWith(
      UserOAuthAccount,
      expect.objectContaining({ userId: 20 }),
    );
  });

  it('returns the user linked by a concurrent request on a unique violation', async () => {
    oauthAccountsRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ user: existingUser });
    transaction.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: UNIQUE_VIOLATION }),
    );

    await expect(
      service.findOrCreateByOAuth(profile, generatePassword),
    ).resolves.toBe(existingUser);
  });

  it('rethrows other database errors', async () => {
    oauthAccountsRepository.findOne.mockResolvedValue(null);
    transaction.mockRejectedValue(new Error('connection lost'));

    await expect(
      service.findOrCreateByOAuth(profile, generatePassword),
    ).rejects.toThrow('connection lost');
  });
});
