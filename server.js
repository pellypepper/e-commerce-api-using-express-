const express = require('express');
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const PORT = process.env.PORT || 4000;

// Setup Swagger UI


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Middleware
app.use(cors({
    origin: true, 
    credentials: true
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'fhcfhr3',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 300000000 },
    
  }));
app.use(passport.initialize());
app.use(passport.session());
  
const authenticate = (req, res, next) => {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
    req.userId = userId;
    next();
  };
// Passport Configuration
passport.use(
    new LocalStrategy( async (username, password, done) => {
    try {
        const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
        const user = result.rows[0];
  
        if (!user) {
          return done(null, false, { message: 'No user with that username' });
        }
  
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }
  
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

// Serialize User (Store user ID in session)
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize User (Retrieve user from session)
passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM "user" WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  });
  
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// registe route
app.post('/register', async (req, res) => {
       const {username, password, email} = req.body;
       if (!username || !password || !email) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }
       try{
        const userCheck = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }
           const hashedPassword = await bcrypt.hash(password, 10);
           const result = await pool.query(
            'INSERT INTO "user" (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );
        const newUser = result.rows[0];
        res.status(201).json({ message: 'User created successfully', user: newUser });

       } 
       catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

//login route 
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ message: info.message }); 
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            return res.status(200).json({ message: 'Logged in successfully', user });
            req.user = { id: user.id };
        });
    })(req, res, next);
  });

//get all produc route
app.get('/product', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "products"');
        const products = result.rows;
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  })


// Get products by category
app.get('/product/category', async (req, res) => {
    const categoryId = req.query.category;
  
  
    if (!categoryId || isNaN(categoryId)) {
        return res.status(400).json({ message: 'Please provide a category ID' });
    }
  
    try {
  
        const result = await pool.query('SELECT * FROM "products" WHERE category_id = $1', [categoryId]);
        const products = result.rows;
  
        // Check if any products were found
        if (products.length > 0) {
            return res.status(200).json(products);
        } else {
            return res.status(404).json({ message: 'No products found for this category' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
  })


// Get product by ID
app.get('/product/:productId', async (req, res) => {
    const id = req.params.productId;
    if(isNaN(id)){
       return res.status(400).json({message: 'Please provide a product id'});
    }
     try {
        const result = await pool.query('SELECT * FROM "products" WHERE id = $1', [id]);
        const product = result.rows[0];
         if(product){
        
          return  res.status(200).json(product);
         } else {
           return res.status(404).json({ message: 'Product not found' });
         }
     } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
     }
   
  })


  
//Get all users
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "user"');
        const users = result.rows;
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  })

  //Get user by ID
app.get('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    if(!userId){
        res.status(400).json({message: 'Please provide a user id'});
    }
     try {
        const result = await pool.query('SELECT * FROM "user" WHERE id = $1', [userId]);
        const user = result.rows[0];
         if(user){
        
            res.status(200).json(user);
         } else {
            res.status(404).json({ message: 'User not found' });
         }
     } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
     }
   
  })
  
  //Update user by ID
 app.put('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    const {username, email} = req.body;
    if(!userId || !username || !email){
        res.status(400).json({message: 'Please provide a user id ,username and email'});
    }
    try {
        const result = await pool.query('UPDATE "user" SET username = $1, email = $2 WHERE id = $3 RETURNING *', [username, email, userId]);
        const user = result.rows[0];
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  })

  app.post('/cart',authenticate, async (req, res) => {
    // Extract productId and quantity from the request body
    const { product_id, quantity } = req.body;
     // Ensure userId is available
     const userId = req.userId;
  
    if (!product_id || !quantity) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }
  
    try {
   
        const result = await pool.query(
            'INSERT INTO "cart" (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [userId, product_id, quantity]
        );
        
        const cartItem = result.rows[0];
        res.status(201).json({ message: 'Cart created successfully', cart: cartItem});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/cart/:cartId', authenticate, async (req, res) => {
    const userId = req.userId;
    const id  = req.params.cartId;
    const { product_id, quantity } = req.body;
  
    if ( !product_id || !quantity) {
        return res.status(400).json({ message: 'Please provide productId and quantity' });
    }
  
    try {
        // Check if the cart exists
        const cartCheck = await pool.query('SELECT * FROM "cart" WHERE id = $1 AND user_id = $2',[id , userId]);
        if (cartCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Cart not found' });
        }
  
        // Add item to cart
        const result = await pool.query(
            'INSERT INTO "cart_items" (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [id, product_id, quantity]
        );
        const newItem = result.rows[0];
        res.status(201).json({ message: 'Item added to cart', item: newItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get contents of a specific cart for the authenticated user
  app.get('/cart/:cartId', authenticate, async (req, res) => {
    const userId = req.userId;
    const cartId = req.params.cartId;
  
    // Ensure userId is available
  
    if (!userId) {
        return res.status(400).json({ message: 'Please provide a user id' });
    }
  
    try {
        // Check if the cart belongs to the user
        const cartCheck = await pool.query('SELECT * FROM "cart" WHERE id = $1 AND user_id = $2', [cartId, userId]);
        const cart = cartCheck.rows[0];
  
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found or does not belong to this user' });
        }
  
        // Get cart items for the specified cartId
        const result = await pool.query(`
            SELECT ci.*, p.name, p.price 
            FROM "cart_items" ci
            LEFT JOIN "products" p ON ci.product_id = p.id
            WHERE ci.cart_id = $1
        `, [cartId]);
  
        const cartItems = result.rows;
  
        // If there are no items in the cart
        if (cartItems.length === 0) {
            return res.status(404).json({ message: 'Cart is empty' });
        }
  
        // Return cart items
        res.status(200).json(cartItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  });


// POST /cart/:cartId/checkout
app.post('/cart/:cartId/checkout', authenticate, async (req, res) => {
    const cartId = req.params.cartId;
  
  
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
  
    try {
        // Check if the cart belongs to the user and is not empty
        const cartCheck = await pool.query('SELECT * FROM "cart" WHERE id = $1 AND user_id = $2', [cartId, userId]);
        const cart = cartCheck.rows[0];
  
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found or does not belong to this user' });
        }
  
        // Retrieve cart items and calculate total price
        const result = await pool.query(`
            SELECT ci.product_id, ci.quantity, p.price 
            FROM "cart_items" ci
            LEFT JOIN "products" p ON ci.product_id = p.id
            WHERE ci.cart_id = $1
        `, [cartId]);
  
        const cartItems = result.rows;
  
     
        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
  
        // Calculate total price
        let totalPrice = 0;
        cartItems.forEach(item => {
            totalPrice += item.price * item.quantity; 
        });
  
        // Create an order 
        const orderResult = await pool.query(`
            INSERT INTO "order" (user_id, total_price, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *
        `, [userId, totalPrice]);
  
        const order = orderResult.rows[0];
  
        //insert new order into order_items table
        for (const item of cartItems) {
            await pool.query(`
                INSERT INTO "order_items" (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `, [order.id, item.product_id, item.quantity, item.price]);
        }
  
        // Create order items
        await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  
        // Return order details
        res.status(201).json({
            message: 'Checkout successful',
            order: {
                id: order.id,
                total_price: order.total_price,
                created_at: order.created_at,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/orders',authenticate, async (req, res) => { 
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
  
    try {
        const result = await pool.query('SELECT * FROM "order" WHERE user_id = $1', [userId]);
        const orders = result.rows;
        res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  })
  
  
  app.get('/orders/:orderId',authenticate, async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
  
    try {
        const result = await pool.query('SELECT * FROM "order" WHERE id = $1 AND user_id = $2', [orderId, userId]);
        const order = result.rows[0];
  
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
  
        res.status(200).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
  })

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});