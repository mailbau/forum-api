const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager'); // To create a token for testing

describe('/threads endpoint', () => {
    let server;
    let tokenManager;
    let testUserId = 'user-threadtest';
    let accessToken;

    beforeAll(async () => {
        server = await createServer(container);
        tokenManager = container.getInstance(AuthenticationTokenManager.name);

        // Add a test user
        await UsersTableTestHelper.addUser({
            id: testUserId,
            username: 'threaduser',
            password: 'secretpassword', // Will be hashed by AddUserUseCase if using API to add
            fullname: 'Thread User',
        });

        // Manually create a token for this user for testing protected routes
        // In a real login flow, this would come from /authentications
        accessToken = await tokenManager.createAccessToken({ id: testUserId, username: 'threaduser' });
    });

    afterAll(async () => {
        await pool.end();
    });

    afterEach(async () => {
        await ThreadsTableTestHelper.cleanTable();
        // No need to clean users or authentications table here if managed by beforeAll/afterAll for the suite
        // or if each test scenario handles its own user setup/teardown.
        // For simplicity, keeping user added in beforeAll for all tests in this describe block.
        // await UsersTableTestHelper.cleanTable(); // Uncomment if tests interfere
        // await AuthenticationsTableTestHelper.cleanTable(); // Uncomment if tests interfere
    });

    describe('when POST /threads', () => {
        it('should response 201 and persisted thread when payload valid and authenticated', async () => {
            // Arrange
            const requestPayload = {
                title: 'Test Thread Title',
                body: 'This is the body of the test thread.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(201);
            expect(responseJson.status).toEqual('success');
            expect(responseJson.data.addedThread).toBeDefined();
            expect(responseJson.data.addedThread.id).toBeDefined();
            expect(responseJson.data.addedThread.title).toEqual(requestPayload.title);
            expect(responseJson.data.addedThread.owner).toEqual(testUserId);

            // Verify in DB
            const threads = await ThreadsTableTestHelper.findThreadById(responseJson.data.addedThread.id);
            expect(threads).toHaveLength(1);
            expect(threads[0].title).toEqual(requestPayload.title);
            expect(threads[0].body).toEqual(requestPayload.body);
            expect(threads[0].owner).toEqual(testUserId);
        });

        it('should response 401 when no access token is provided', async () => {
            // Arrange
            const requestPayload = {
                title: 'Test Thread Title',
                body: 'This is the body of the test thread.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                // No Authorization header
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401); // Default for missing auth
            // The actual message might depend on Hapi's default handling or @hapi/jwt
            // For @hapi/jwt, it's often "Missing authentication" or similar
            expect(responseJson.message).toBeDefined();
        });

        it('should response 401 when access token is invalid', async () => {
            // Arrange
            const requestPayload = {
                title: 'Test Thread Title',
                body: 'This is the body of the test thread.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: 'Bearer an.invalid.token',
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(401);
            // The actual message might depend on Hapi's default handling or @hapi/jwt
            expect(responseJson.message).toEqual('Invalid token missing header'); // Or similar from @hapi/jwt
        });


        it('should response 400 when request payload not contain title property', async () => {
            // Arrange
            const requestPayload = {
                body: 'This is the body of the test thread.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti title atau body tidak ada');
        });

        it('should response 400 when request payload not contain body property', async () => {
            // Arrange
            const requestPayload = {
                title: 'Test Thread Title',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti title atau body tidak ada');
        });

        it('should response 400 when request payload title is not a string', async () => {
            // Arrange
            const requestPayload = {
                title: 12345,
                body: 'This is the body of the test thread.',
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data title atau body tidak sesuai');
        });

        it('should response 400 when request payload body is not a string', async () => {
            // Arrange
            const requestPayload = {
                title: 'Test Thread Title',
                body: true,
            };

            // Action
            const response = await server.inject({
                method: 'POST',
                url: '/threads',
                payload: requestPayload,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Assert
            const responseJson = JSON.parse(response.payload);
            expect(response.statusCode).toEqual(400);
            expect(responseJson.status).toEqual('fail');
            expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data title atau body tidak sesuai');
        });
    });
});