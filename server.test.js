const request = require('supertest');
const app = require('./server'); 
const pool = require('./db');
const bcrypt = require('bcryptjs');

describe('API Tests', () => {
    let testUserId;

    beforeAll(async () => {
        // Clean up the database or set up initial state if needed
        await pool.query('DELETE FROM "user"'); // Clear users for tests
    });

    afterAll(async () => {
        await pool.end(); // Close database connection
    });

    describe('User Registration', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/register')
                .send({ username: 'testuser', password: 'password123', email: 'test@example.com' });
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body.user.username).toBe('testuser');

            // Save the user id for further tests
            testUserId = response.body.user.id;
        });

        it('should not register a user with existing username', async () => {
            const response = await request(app)
                .post('/register')
                .send({ username: 'testuser', password: 'password123', email: 'test@example.com' });
            expect(response.statusCode).toBe(409);
            expect(response.body.message).toBe('Username already exists');
        });
    });

    describe('User Login', () => {
        it('should log in an existing user', async () => {
            const response = await request(app)
                .post('/login')
                .send({ username: 'testuser', password: 'password123' });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Logged in successfully');
        });

        it('should not log in with incorrect password', async () => {
            const response = await request(app)
                .post('/login')
                .send({ username: 'testuser', password: 'wrongpassword' });
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Incorrect password');
        });
    });

    describe('Product Routes', () => {
        it('should get all products', async () => {
            const response = await request(app).get('/product');
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should get a product by ID', async () => {
            const response = await request(app).get('/product/1'); // Change ID as necessary
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id');
        });

        it('should return 404 for non-existent product ID', async () => {
            const response = await request(app).get('/product/9999'); // Assuming this ID does not exist
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('Product not found');
        });
    });

    describe('Cart Management', () => {
        let cartId;

        beforeAll(async () => {
            // Create a cart for the user to work with
            const response = await request(app)
                .post('/cart')
                .send({ product_id: 1, quantity: 1 }) // Replace with actual product ID
                .set('Cookie', [`connect.sid=sess_${testUserId}`]); // Mock user session
            cartId = response.body.cart.id;
        });

        it('should add an item to the cart', async () => {
            const response = await request(app)
                .post(`/cart/${cartId}`)
                .send({ product_id: 2, quantity: 2 }) // Replace with actual product ID
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Item added to cart');
        });

        it('should get cart items', async () => {
            const response = await request(app)
                .get(`/cart/${cartId}`)
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should checkout the cart', async () => {
            const response = await request(app)
                .post(`/cart/${cartId}/checkout`)
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Checkout successful');
        });
    });

    describe('Order Management', () => {
        it('should get all orders for the user', async () => {
            const response = await request(app)
                .get('/orders')
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should get a specific order', async () => {
            const orderResponse = await request(app)
                .get('/orders/1') // Adjust the order ID based on your test data
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(orderResponse.statusCode).toBe(200);
            expect(orderResponse.body).toHaveProperty('id');
        });

        it('should return 404 for non-existent order ID', async () => {
            const response = await request(app)
                .get('/orders/9999') // Assuming this ID does not exist
                .set('Cookie', [`connect.sid=sess_${testUserId}`]);
            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('Order not found');
        });
    });
});
