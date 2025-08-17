import { Test, TestingModule } from '@nestjs/testing';
import { LinkService } from './link.service';
import { LinkRepository, ClickRepository } from '@database/repositories';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { BusinessException } from '@core/exception-filters/business-exception.filter';
import { ResponseCodeEnum } from '@constant/response-code.enum';
import { Request } from 'express';

describe('LinkService', () => {
  let service: LinkService;
  let linkRepository: jest.Mocked<LinkRepository>;
  let clickRepository: jest.Mocked<ClickRepository>;
  let i18nService: jest.Mocked<I18nService>;
  let configService: jest.Mocked<ConfigService>;

  const mockLink = {
    id: '1',
    userId: 'user1',
    originalUrl: 'https://example.com',
    alias: 'test123',
    password: '$2b$10$test',
    clicksCount: 5,
    successfulAccessCount: 3,
    isActive: true,
    expireAt: null,
    maxClicks: null,
  };

  const mockRequest = {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referer: 'https://google.com',
    },
    connection: { remoteAddress: '192.168.1.1' },
    socket: { remoteAddress: '192.168.1.1' },
    get: jest.fn((key: string) => {
      const headers = {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        referer: 'https://google.com',
      };
      return headers[key] || '';
    }),
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkService,
        {
          provide: LinkRepository,
          useValue: {
            findByAlias: jest.fn(),
            incrementClicksCount: jest.fn(),
            incrementSuccessfulAccessCount: jest.fn(),
          },
        },
        {
          provide: ClickRepository,
          useValue: {
            createClick: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinkService>(LinkService);
    linkRepository = module.get(LinkRepository);
    clickRepository = module.get(ClickRepository);
    i18nService = module.get(I18nService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleRedirect', () => {
    it('should redirect successfully for link without password', async () => {
      const linkWithoutPassword = { ...mockLink, password: null };
      linkRepository.findByAlias.mockResolvedValue(linkWithoutPassword);
      linkRepository.incrementClicksCount.mockResolvedValue();
      linkRepository.incrementSuccessfulAccessCount.mockResolvedValue();
      clickRepository.createClick.mockResolvedValue({} as any);

      const result = await service.handleRedirect('test123', mockRequest);

      expect(result.requiresPassword).toBe(false);
      expect(result.link).toEqual(linkWithoutPassword);
      expect(linkRepository.incrementClicksCount).toHaveBeenCalledWith('1', 1);
      expect(
        linkRepository.incrementSuccessfulAccessCount,
      ).toHaveBeenCalledWith('1', 1);
      expect(clickRepository.createClick).toHaveBeenCalled();
    });

    it('should require password for link with password', async () => {
      linkRepository.findByAlias.mockResolvedValue(mockLink);
      linkRepository.incrementClicksCount.mockResolvedValue();
      clickRepository.createClick.mockResolvedValue({} as any);

      const result = await service.handleRedirect('test123', mockRequest);

      expect(result.requiresPassword).toBe(true);
      expect(result.link).toEqual(mockLink);
      expect(linkRepository.incrementClicksCount).toHaveBeenCalledWith('1', 1);
      expect(
        linkRepository.incrementSuccessfulAccessCount,
      ).not.toHaveBeenCalled();
      expect(clickRepository.createClick).toHaveBeenCalled();
    });

    it('should throw error for inactive link', async () => {
      const inactiveLink = { ...mockLink, isActive: false };
      linkRepository.findByAlias.mockResolvedValue(inactiveLink);
      i18nService.translate.mockResolvedValue('Access forbidden');

      await expect(
        service.handleRedirect('test123', mockRequest),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      linkRepository.findByAlias.mockResolvedValue(mockLink);
      linkRepository.incrementSuccessfulAccessCount.mockResolvedValue();

      const passwordData = { password: 'correctpassword' };

      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.verifyPassword(
        'test123',
        passwordData,
        mockRequest,
      );

      expect(result).toEqual(mockLink);
      expect(
        linkRepository.incrementSuccessfulAccessCount,
      ).toHaveBeenCalledWith('1', 1);
    });

    it('should throw error for incorrect password', async () => {
      linkRepository.findByAlias.mockResolvedValue(mockLink);
      i18nService.translate.mockResolvedValue('Sai mật khẩu');

      const passwordData = { password: 'wrongpassword' };

      // Mock bcrypt.compare to return false
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(
        service.verifyPassword('test123', passwordData, mockRequest),
      ).rejects.toThrow(BusinessException);
    });
  });
});
