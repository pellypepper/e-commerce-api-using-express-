# Express API with User Authentication and Product Management

This is a RESTful API built with Node.js, Express, and PostgreSQL. It supports user authentication, product management, and cart functionalities, including checkout and order management.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- User registration and login with password hashing.
- Product management (CRUD operations).
- Shopping cart functionality.
- Order management with checkout capability.
- API documentation using Swagger.

## Technologies

- Node.js
- Express
- PostgreSQL
- Passport.js for authentication
- Bcrypt.js for password hashing
- Swagger for API documentation

## Installation

1. Clone the repository:

   ```bash
   git clone <www.github/pellypepper/e-commerceapi>
   cd <e-commerceapi>
2 Install the dependencies:

bash

npm install
npm install express



3 Create a .env file in the root directory with the following variables:


DATABASE_HOST=<your_database_host>
DATABASE_PORT=<your_database_port>
DATABASE_USER=<your_database_user>
DATABASE_PASSWORD=<your_database_password>
DATABASE_NAME=<your_database_name>


4 Run database migrations (if any) and set up your PostgreSQL database.

Usage
1 Start the server:

bash

npm start
The server will run on http://localhost:4000.

2 Access the API documentation at http://localhost:4000/api-docs.

API Endpoints
1 User Authentication
Register User

Endpoint: POST /register
Body: { "username": "<username>", "password": "<password>", "email": "<email>" }
Response: { "message": "User created successfully", "user": { ... } }


2 Login User

Endpoint: POST /login
Body: { "username": "<username>", "password": "<password>" }
Response: { "message": "Logged in successfully", "user": { ... } }


3 Product Management
Get All Products

Endpoint: GET /product
Response: [ { ... }, { ... }, ... ]
Get Product by ID

Endpoint: GET /product/:productId
Response: { ... }
Get Products by Category

Endpoint: GET /product/category?category=<categoryId>
Response: [ { ... }, { ... }, ... ]


4 Cart Management
Create Cart Item

Endpoint: POST /cart
Body: { "product_id": "<productId>", "quantity": <quantity> }
Response: { "message": "Cart created successfully", "cart": { ... } }
Add Item to Cart

Endpoint: POST /cart/:cartId
Body: { "product_id": "<productId>", "quantity": <quantity> }
Response: { "message": "Item added to cart", "item": { ... } }
Get Cart Items

Endpoint: GET /cart/:cartId
Response: [ { ... }, { ... }, ... ]
Checkout Cart

Endpoint: POST /cart/:cartId/checkout
Response: { "message": "Checkout successful", "order": { ... } }



5  Order Management
Get All Orders

Endpoint: GET /orders
Response: [ { ... }, { ... }, ... ]
Get Order by ID

Endpoint: GET /orders/:orderId
Response: { ... }



Testing
To run tests, make sure your test database is set up and configured. Then, run:

bash

npm test
Contributing
Contributions are welcome! Please open an issue or submit a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.



