const request = require('supertest');
const { app } = require('../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Coupon = require('../src/models/Coupon');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Seller = require('../src/models/Seller');
const { signAccessToken } = require('../src/utils/token');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('shopEZ Extended APIs Integration Tests', () => {
  let customerToken;
  let customerId;
  let testCoupon;

  beforeEach(async () => {
    await User.deleteMany({});
    await Coupon.deleteMany({});

    // Create test customer
    const customer = await User.create({
      name: 'Test Customer',
      email: 'test@shopez.com',
      password: 'password123',
      role: 'customer',
      isVerified: true
    });

    customerId = customer._id;
    customerToken = signAccessToken(customer._id, 'customer');

    // Create test coupon
    testCoupon = await Coupon.create({
      code: 'TESTPERCENT',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 100,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    });
  });

  describe('Address Book CRUD APIs', () => {
    it('should add a new address to user profile', async () => {
      const addressData = {
        street: '456 Tech Boulevard',
        city: 'Silicon Valley',
        state: 'CA',
        postalCode: '94025',
        country: 'USA',
        phone: '+15559876',
        isDefault: true
      };

      const res = await request(app)
        .post('/api/auth/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addressData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].street).toEqual('456 Tech Boulevard');
    });

    it('should delete an address from user profile', async () => {
      // First, add an address manually
      const user = await User.findById(customerId);
      user.addresses.push({
        street: '789 Remove Lane',
        city: 'Trash City',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '+15551111',
        isDefault: false
      });
      await user.save();
      const addressId = user.addresses[0]._id;

      const res = await request(app)
        .delete(`/api/auth/address/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(0);
    });
  });

  describe('Coupon Validation API', () => {
    it('should successfully validate an active coupon code', async () => {
      const res = await request(app)
        .post('/api/orders/coupon/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          couponCode: 'TESTPERCENT',
          subtotal: 200
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.coupon.code).toEqual('TESTPERCENT');
      expect(res.body.coupon.discountAmount).toEqual(30); // 15% of 200
    });

    it('should fail validation if subtotal is below minOrderAmount', async () => {
      const res = await request(app)
        .post('/api/orders/coupon/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          couponCode: 'TESTPERCENT',
          subtotal: 50 // below minOrderAmount of 100
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Order Cancellation API', () => {
    let testProduct;
    let testSeller;

    beforeEach(async () => {
      await Product.deleteMany({});
      await Order.deleteMany({});
      await Seller.deleteMany({});

      // Create test seller
      const sellerUser = await User.create({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: 'password123',
        role: 'seller',
        isVerified: true
      });

      testSeller = await Seller.create({
        user: sellerUser._id,
        storeName: 'Test Store',
        isApproved: true
      });

      // Create test product with stock
      testProduct = await Product.create({
        seller: testSeller._id,
        name: 'Cancel Test Phone',
        description: 'Test Description',
        category: new mongoose.Types.ObjectId(),
        brand: 'TestBrand',
        price: 100,
        images: ['img.jpg'],
        variants: [
          { sku: 'TEST-CANCEL-SKU', size: '128GB', color: 'Black', price: 100, stock: 10 }
        ],
        stock: 10,
        approvalStatus: 'approved'
      });
    });

    it('should successfully cancel a Placed order and restore stock levels', async () => {
      // Create a Placed order
      const order = await Order.create({
        user: customerId,
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          quantity: 2,
          price: 100,
          variantSku: 'TEST-CANCEL-SKU',
          seller: testSeller._id
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'TestCountry',
          phone: '+123456789'
        },
        paymentMethod: 'cod',
        totalPrice: 200,
        orderStatus: 'Placed'
      });

      // Stock was at 10. Let's make sure it is 10 first.
      const prodBefore = await Product.findById(testProduct._id);
      expect(prodBefore.variants[0].stock).toEqual(10);

      const res = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toEqual('Cancelled');

      // Verify stock is restored (+2)
      const prodAfter = await Product.findById(testProduct._id);
      expect(prodAfter.variants[0].stock).toEqual(12);
      expect(prodAfter.stock).toEqual(12);
    });

    it('should fail to cancel order if it is already Shipped', async () => {
      // Create a Shipped order
      const order = await Order.create({
        user: customerId,
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          quantity: 2,
          price: 100,
          variantSku: 'TEST-CANCEL-SKU',
          seller: testSeller._id
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'TestCountry',
          phone: '+123456789'
        },
        paymentMethod: 'cod',
        totalPrice: 200,
        orderStatus: 'Shipped'
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});

