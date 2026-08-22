import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { constants, publicEncrypt } from 'crypto';
import { AppModule } from '../src/app.module';
import { CryptoKeysService } from '../src/domains/auth/services/crypto-keys.service';

const describeE2e = process.env.RUN_E2E === 'true' ? describe : describe.skip;

describeE2e('AuthController (e2e)', () => {
  let app: INestApplication;
  let cryptoKeys: CryptoKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    cryptoKeys = app.get(CryptoKeysService);
  });

  afterAll(async () => {
    await app?.close();
  });

  function encryptPassword(password: string) {
    const { publicKey } = cryptoKeys.getPublicKey();
    const payload = `${password}::${Date.now()}`;
    return publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(payload, 'utf8'),
    ).toString('base64');
  }

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'wrong', password: encryptPassword('wrongpw') })
        .expect(401);
    });

    it('should return 400 for missing username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: '123456' })
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin' })
        .expect(400);
    });
  });
});
