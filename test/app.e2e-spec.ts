import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http:/localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'user@gmail.com',
      password: '12345@user',
    };
    describe('SignUp', () => {
      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: '',
          })
          .expectStatus(400);
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('SignIn', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: '',
            password: '121212212',
          })
          .expectStatus(400);
      });

      it('Should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(201)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get 401 without access_token', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('Should retrieve a USER', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .expectStatus(200)
          .expectJsonLike({
            email: 'user@gmail.com',
          });
      });
    });

    describe('Edit user', () => {
      it('Should throw if no access token is provided', () => {
        return pactum
          .spec()
          .patch('/users')
          .withBody({
            firstName: 'UpdatedFirstName',
            lastName: 'UpdatedLastName',
          })
          .expectStatus(401);
      });

      it('Should edit user details', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody({
            firstName: 'UpdatedFirstName',
            lastName: 'UpdatedLastName',
          })
          .expectStatus(200)
          .expectJsonLike({
            firstName: 'UpdatedFirstName',
            lastName: 'UpdatedLastName',
          });
      });

      it('Should throw if no data is provided', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`,
          })
          .withBody({})
          .expectStatus(400);
      });
    });
  });

  describe('Bookmarks', () => {
    let bookmarkId: number;
    const createDto = {
      title: 'NestJS Bookmark',
      description: 'A useful bookmark for learning NestJS',
      link: 'https://nestjs.com/',
    };

    describe('Get bookmarks', () => {
      it('Should get an empty list initially', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(200)
          .expectJson([]);
      });
    });

    describe('Create bookmark', () => {
      it('Should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withBody(createDto)
          .expectStatus(201)
          .expectJsonLike({
            title: createDto.title,
            description: createDto.description,
            link: createDto.link,
          })
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmark by id', () => {
      it('Should retrieve a bookmark by ID', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(200)
          .expectJsonLike({
            id: `$S{bookmarkId}`,
            title: createDto.title,
          });
      });
    });

    describe('Edit bookmark', () => {
      const editDto = { title: 'Updated Bookmark Title' };

      it('Should edit bookmark details', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withBody(editDto)
          .expectStatus(200)
          .expectJsonLike({
            title: editDto.title,
          });
      });
    });

    describe('Delete bookmark', () => {
      it('Should delete a bookmark by ID', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(204);
      });

      it('Should get an empty list after deletion', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(200)
          .expectJson([]);
      });
    });
  });
});
