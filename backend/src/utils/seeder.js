const { User, Seller, Product, Category, Cart, Wishlist, Order, Review, Coupon, Notification } = require('../models');

const runSeeder = async () => {
  // Clear current collections
  await User.deleteMany({});
  await Seller.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});
  await Coupon.deleteMany({});
  await Notification.deleteMany({});
  console.log('Seeder: Cleared all collections...');

  // Create Categories
  const electronics = await Category.create({
    name: 'Electronics',
    slug: 'electronics',
    description: 'Smartphones, Laptops, Gadgets, and Accessories'
  });

  const apparel = await Category.create({
    name: 'Apparel & Fashion',
    slug: 'apparel-fashion',
    description: 'Designer clothing, footwear, and accessories'
  });

  const homeLiving = await Category.create({
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Modern furniture, decors, and kitchen items'
  });

  console.log('Seeder: Categories created...');

  // Create Users (Customer, Seller, Admin)
  const adminUser = new User({
    name: 'ShopEZ Administrator',
    email: 'admin@shopez.com',
    password: 'password123',
    role: 'admin',
    isVerified: true
  });
  await adminUser.save();

  const sellerUser = new User({
    name: 'Supreme Retailers',
    email: 'seller@shopez.com',
    password: 'password123',
    role: 'seller',
    isVerified: true
  });
  await sellerUser.save();

  const customerUser = new User({
    name: 'Alex Johnson',
    email: 'customer@shopez.com',
    password: 'password123',
    role: 'customer',
    isVerified: true,
    addresses: [{
      street: '123 Luxury Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      phone: '+919876543210',
      isDefault: true
    }]
  });
  await customerUser.save();

  console.log('Seeder: Users created...');

  // Create Seller Profile
  const sellerProfile = await Seller.create({
    user: sellerUser._id,
    storeName: 'Supreme Tech & Fashion',
    storeDescription: 'Official premium partner of shopEZ',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200',
    isApproved: true
  });

  console.log('Seeder: Seller profile created...');

  // Create Products with Variants
  const p1 = new Product({
    seller: sellerProfile._id,
    name: 'X-Phone Pro Max',
    description: 'The ultimate flagship smartphone with dynamic displays, OLED matrix, and a 200MP camera system.',
    category: electronics._id,
    brand: 'Aegis',
    price: 79999,
    compareAtPrice: 99999,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600'
    ],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['smartphone', 'flagship', 'aegis', 'oled'],
    variants: [
      { sku: 'XP-PRO-128B', size: '128GB', color: 'Midnight Black', price: 79999, compareAtPrice: 99999, stock: 25 },
      { sku: 'XP-PRO-256B', size: '256GB', color: 'Midnight Black', price: 89999, compareAtPrice: 109999, stock: 15 },
      { sku: 'XP-PRO-128S', size: '128GB', color: 'Space Silver', price: 79999, compareAtPrice: 99999, stock: 3 }
    ]
  });
  p1.stock = p1.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p1.save();

  const p2 = new Product({
    seller: sellerProfile._id,
    name: 'Urban Core Leather Jacket',
    description: 'A genuine double-breasted designer leather jacket built for premium fashion statements and extreme comfort.',
    category: apparel._id,
    brand: 'Vogue',
    price: 14999,
    compareAtPrice: 19999,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600'
    ],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['apparel', 'fashion', 'jacket', 'leather'],
    variants: [
      { sku: 'L-JKT-M', size: 'M', color: 'Classic Brown', price: 14999, compareAtPrice: 19999, stock: 12 },
      { sku: 'L-JKT-L', size: 'L', color: 'Classic Brown', price: 14999, compareAtPrice: 19999, stock: 8 }
    ]
  });
  p2.stock = p2.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p2.save();

  const p3 = new Product({
    seller: sellerProfile._id,
    name: 'Aero-Sleek Ergonomic Chair',
    description: 'State-of-the-art office chair with smart lumber support and adaptive high-grade mesh fabric.',
    category: homeLiving._id,
    brand: 'EgoDesign',
    price: 24999,
    compareAtPrice: 29999,
    images: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=600'
    ],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['furniture', 'office', 'chair', 'ergonomic'],
    variants: [
      { sku: 'ERGO-CH-GR', size: 'Standard', color: 'Ash Grey', price: 24999, compareAtPrice: 29999, stock: 10 }
    ]
  });
  p3.stock = p3.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p3.save();

  const p4 = new Product({
    seller: sellerProfile._id,
    name: 'Titan Smartwatch Series 5',
    description: 'Track your health, sleep, and workouts with state-of-the-art biological sensors and an always-on premium titanium retina display.',
    category: electronics._id,
    brand: 'Titanium',
    price: 27999,
    compareAtPrice: 32999,
    images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['wearable', 'smartwatch', 'electronics', 'fitness'],
    variants: [
      { sku: 'TITAN-5-SLV', size: '44mm', color: 'Silver Titanium', price: 27999, compareAtPrice: 32999, stock: 20 },
      { sku: 'TITAN-5-BLK', size: '44mm', color: 'Space Black', price: 27999, compareAtPrice: 32999, stock: 14 }
    ]
  });
  p4.stock = p4.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p4.save();

  const p5 = new Product({
    seller: sellerProfile._id,
    name: 'SoundAura Noise Cancelling Headphones',
    description: 'Immerse yourself in pure studio audio with hybrid active noise cancellation, deep spatial sound, and 45-hour battery life.',
    category: electronics._id,
    brand: 'Acoustic',
    price: 19999,
    compareAtPrice: 24999,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['headphones', 'audio', 'anc', 'acoustic'],
    variants: [
      { sku: 'SA-ANC-WHT', size: 'Standard', color: 'Ivory White', price: 19999, compareAtPrice: 24999, stock: 8 },
      { sku: 'SA-ANC-BLK', size: 'Standard', color: 'Carbon Black', price: 19999, compareAtPrice: 24999, stock: 15 }
    ]
  });
  p5.stock = p5.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p5.save();

  const p6 = new Product({
    seller: sellerProfile._id,
    name: 'Minimalist Ceramic Vase Set',
    description: 'Handcrafted ceramic flower vases with matte textured finishes, perfect for modern and minimalist room aesthetics.',
    category: homeLiving._id,
    brand: 'Loom',
    price: 4999,
    compareAtPrice: 6999,
    images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['vase', 'ceramics', 'home', 'decor'],
    variants: [
      { sku: 'M-VASE-SET', size: '3-Piece Set', color: 'Sand & White', price: 4999, compareAtPrice: 6999, stock: 30 }
    ]
  });
  p6.stock = p6.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p6.save();

  const p7 = new Product({
    seller: sellerProfile._id,
    name: 'Vogue Chelsea Suede Boots',
    description: 'Handcrafted Italian suede leather boots featuring anti-slip premium creep soles and elastic inserts for casual styling.',
    category: apparel._id,
    brand: 'Vogue',
    price: 11999,
    compareAtPrice: 15999,
    images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600'],
    approvalStatus: 'approved',
    tags: ['apparel', 'shoes', 'boots', 'suede'],
    variants: [
      { sku: 'BOOT-SUD-9', size: '9', color: 'Tan Suede', price: 11999, compareAtPrice: 15999, stock: 10 },
      { sku: 'BOOT-SUD-10', size: '10', color: 'Tan Suede', price: 11999, compareAtPrice: 15999, stock: 5 }
    ]
  });
  p7.stock = p7.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p7.save();

  const p8 = new Product({
    seller: sellerProfile._id,
    name: 'Apex Wireless Gaming Mouse',
    description: 'Ultra-lightweight wireless gaming mouse with a 26K DPI optical sensor, smart custom lighting, and zero latency.',
    category: electronics._id,
    brand: 'ApexTech',
    price: 6999,
    compareAtPrice: 8999,
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['gaming', 'mouse', 'wireless', 'apex'],
    variants: [
      { sku: 'APEX-MSE-BLK', size: 'Standard', color: 'Matte Black', price: 6999, compareAtPrice: 8999, stock: 40 },
      { sku: 'APEX-MSE-WHT', size: 'Standard', color: 'Ghost White', price: 6999, compareAtPrice: 8999, stock: 25 }
    ]
  });
  p8.stock = p8.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p8.save();

  const p9 = new Product({
    seller: sellerProfile._id,
    name: 'Chrono Premium Automatic Watch',
    description: 'Luxury mechanical watch featuring Japanese automatic movement, a sapphire glass face, and a solid stainless steel link bracelet.',
    category: apparel._id,
    brand: 'Vogue',
    price: 36999,
    compareAtPrice: 45999,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['watch', 'luxury', 'chrono', 'automatic'],
    variants: [
      { sku: 'CHRO-WAT-SLV', size: '42mm', color: 'Metallic Silver', price: 36999, compareAtPrice: 45999, stock: 10 },
      { sku: 'CHRO-WAT-GLD', size: '42mm', color: 'Champagne Gold', price: 39999, compareAtPrice: 49999, stock: 5 }
    ]
  });
  p9.stock = p9.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p9.save();

  const p10 = new Product({
    seller: sellerProfile._id,
    name: 'Smart LED Ambience Lamp',
    description: 'Vibrant ambient smart lamp with 16 million colors, voice control compatibility, and synchronized music light-show modes.',
    category: homeLiving._id,
    brand: 'Aegis',
    price: 3999,
    compareAtPrice: 4999,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['lighting', 'lamp', 'smart-home', 'led'],
    variants: [
      { sku: 'SMART-LMP-RGB', size: 'Standard', color: 'Multi-Color RGB', price: 3999, compareAtPrice: 4999, stock: 50 }
    ]
  });
  p10.stock = p10.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p10.save();

  const p11 = new Product({
    seller: sellerProfile._id,
    name: 'Premium Bamboo Cotton Hoodie',
    description: 'Luxuriously soft hoodie made from sustainably sourced bamboo cotton fibers, designed for all-season comfort.',
    category: apparel._id,
    brand: 'Vogue',
    price: 5999,
    compareAtPrice: 7999,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['apparel', 'fashion', 'hoodie', 'bamboo'],
    variants: [
      { sku: 'HOOD-BMB-M', size: 'M', color: 'Forest Green', price: 5999, compareAtPrice: 7999, stock: 15 },
      { sku: 'HOOD-BMB-L', size: 'L', color: 'Forest Green', price: 5999, compareAtPrice: 7999, stock: 20 },
      { sku: 'HOOD-BMB-XL', size: 'XL', color: 'Forest Green', price: 5999, compareAtPrice: 7999, stock: 12 }
    ]
  });
  p11.stock = p11.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p11.save();

  const p12 = new Product({
    seller: sellerProfile._id,
    name: 'Sleek Aluminium Laptop Stand',
    description: 'Ergonomic aluminum stand with adjustable height and slip-resistant rubber pads, optimized for cooling and structural stability.',
    category: homeLiving._id,
    brand: 'EgoDesign',
    price: 2999,
    compareAtPrice: 3999,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['office', 'accessory', 'stand', 'aluminium'],
    variants: [
      { sku: 'LAP-STAND-SLV', size: 'Standard', color: 'Brushed Silver', price: 2999, compareAtPrice: 3999, stock: 35 }
    ]
  });
  p12.stock = p12.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p12.save();

  const p13 = new Product({
    seller: sellerProfile._id,
    name: 'Quantum Wireless Earbuds',
    description: 'True wireless stereo earbuds with active noise cancellation, custom sound profiles, and 30-hour playback duration.',
    category: electronics._id,
    brand: 'ApexTech',
    price: 9999,
    compareAtPrice: 12999,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['earbuds', 'audio', 'wireless', 'anc'],
    variants: [
      { sku: 'QT-EAR-WHT', size: 'Standard', color: 'Crystal White', price: 9999, compareAtPrice: 12999, stock: 15 },
      { sku: 'QT-EAR-BLK', size: 'Standard', color: 'Midnight Black', price: 9999, compareAtPrice: 12999, stock: 20 }
    ]
  });
  p13.stock = p13.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p13.save();

  const p14 = new Product({
    seller: sellerProfile._id,
    name: 'Ultra-Warm Winter Parka',
    description: 'Heavy-duty insulated winter jacket featuring a faux-fur hood lining and water-resistant premium shell.',
    category: apparel._id,
    brand: 'Vogue',
    price: 15999,
    compareAtPrice: 19999,
    images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['apparel', 'parka', 'jacket', 'winter'],
    variants: [
      { sku: 'PARKA-BLK-M', size: 'M', color: 'Carbon Black', price: 15999, compareAtPrice: 19999, stock: 10 },
      { sku: 'PARKA-BLK-L', size: 'L', color: 'Carbon Black', price: 15999, compareAtPrice: 19999, stock: 10 }
    ]
  });
  p14.stock = p14.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p14.save();

  const p15 = new Product({
    seller: sellerProfile._id,
    name: 'Smart Indoor Herb Garden',
    description: 'Automatic indoor planter with built-in LED grow lights, water pump, and nutrient reminders for organic growing.',
    category: homeLiving._id,
    brand: 'EgoDesign',
    price: 12499,
    compareAtPrice: 14999,
    images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['home', 'garden', 'smart-home', 'indoor'],
    variants: [
      { sku: 'SMART-GARDEN-W', size: 'Standard', color: 'Porcelain White', price: 12499, compareAtPrice: 14999, stock: 25 }
    ]
  });
  p15.stock = p15.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p15.save();

  const p16 = new Product({
    seller: sellerProfile._id,
    name: 'Premium Mechanical Keyboard',
    description: '87-key compact custom mechanical keyboard with hot-swappable switches, dynamic RGB backlighting, and an aluminium top plate.',
    category: electronics._id,
    brand: 'ApexTech',
    price: 12999,
    compareAtPrice: 15999,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['keyboard', 'gaming', 'mechanical', 'rgb'],
    variants: [
      { sku: 'KEY-MECH-BRN', size: 'Tenkeyless', color: 'Tactile Brown Switch', price: 12999, compareAtPrice: 15999, stock: 15 },
      { sku: 'KEY-MECH-BLU', size: 'Tenkeyless', color: 'Clicky Blue Switch', price: 12999, compareAtPrice: 15999, stock: 10 }
    ]
  });
  p16.stock = p16.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p16.save();

  const p17 = new Product({
    seller: sellerProfile._id,
    name: 'Classic Oak Wood Dining Table',
    description: 'Rustic solid oak wood table featuring natural wood grains and sleek matte black metal legs.',
    category: homeLiving._id,
    brand: 'EgoDesign',
    price: 69999,
    compareAtPrice: 89999,
    images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['furniture', 'table', 'oak', 'dining'],
    variants: [
      { sku: 'TAB-OAK-6S', size: '6-Seater', color: 'Natural Oak', price: 69999, compareAtPrice: 89999, stock: 3 },
      { sku: 'TAB-OAK-8S', size: '8-Seater', color: 'Natural Oak', price: 69999, compareAtPrice: 89999, stock: 2 }
    ]
  });
  p17.stock = p17.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p17.save();

  // 5 New Indian Products including realme P4R 5G (from screenshot)
  const p18 = new Product({
    seller: sellerProfile._id,
    name: 'realme P4R 5G (Silver Glare, 128 GB)',
    description: "Segment's BIGGEST 8000mAh Battery Smartphone. AI Pulse Light, 45W Fast Charging, 144Hz & 1200nits Display. Stable FPS Gaming for 12hrs. IP65 rating.",
    category: electronics._id,
    brand: 'realme',
    price: 18999,
    compareAtPrice: 25999,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600'
    ],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['smartphone', '5g', 'realme', '8000mah'],
    variants: [
      { sku: 'RLM-P4R-128-4SG', size: '128 GB + 4 GB RAM', color: 'Silver Glare', price: 18999, compareAtPrice: 25999, stock: 20 },
      { sku: 'RLM-P4R-128-6SG', size: '128 GB + 6 GB RAM', color: 'Silver Glare', price: 20999, compareAtPrice: 30999, stock: 15 },
      { sku: 'RLM-P4R-256-6SG', size: '256 GB + 6 GB RAM', color: 'Silver Glare', price: 22999, compareAtPrice: 34999, stock: 10 }
    ]
  });
  p18.stock = p18.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p18.save();

  const p19 = new Product({
    seller: sellerProfile._id,
    name: 'Boat Stone 1500 Wireless Speaker',
    description: 'Powerful 40W active wireless bluetooth speaker with rugged military design, IPX6 water resistance, and 15 hours playback.',
    category: electronics._id,
    brand: 'Boat',
    price: 6999,
    compareAtPrice: 9999,
    images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['speaker', 'audio', 'boat', 'bluetooth'],
    variants: [
      { sku: 'BOAT-ST-1500B', size: 'Standard', color: 'Active Black', price: 6999, compareAtPrice: 9999, stock: 30 }
    ]
  });
  p19.stock = p19.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p19.save();

  const p20 = new Product({
    seller: sellerProfile._id,
    name: 'Fabindia Silk Blend Kurta',
    description: 'Premium hand-spun silk blend formal ethnic wear Kurta, perfect for festivals and weddings. Authentic traditional weaves.',
    category: apparel._id,
    brand: 'Fabindia',
    price: 3499,
    compareAtPrice: 4999,
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['apparel', 'ethnic', 'silk', 'kurta'],
    variants: [
      { sku: 'FAB-KUR-M', size: 'M', color: 'Maroon Silk', price: 3499, compareAtPrice: 4999, stock: 15 },
      { sku: 'FAB-KUR-L', size: 'L', color: 'Maroon Silk', price: 3499, compareAtPrice: 4999, stock: 20 },
      { sku: 'FAB-KUR-XL', size: 'XL', color: 'Maroon Silk', price: 3499, compareAtPrice: 4999, stock: 10 }
    ]
  });
  p20.stock = p20.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p20.save();

  const p21 = new Product({
    seller: sellerProfile._id,
    name: 'Prestige Iris 750W Mixer Grinder',
    description: 'Heavy duty 750 watt motor mixer grinder with 3 stainless steel jars, 1 transparent juicer jar, and multi-purpose blades.',
    category: homeLiving._id,
    brand: 'Prestige',
    price: 4899,
    compareAtPrice: 6299,
    images: ['https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['mixer', 'grinder', 'kitchen', 'home'],
    variants: [
      { sku: 'PRES-MIX-750', size: 'Standard', color: 'White & Blue', price: 4899, compareAtPrice: 6299, stock: 25 }
    ]
  });
  p21.stock = p21.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p21.save();

  const p22 = new Product({
    seller: sellerProfile._id,
    name: 'Wipro 16A Smart Wi-Fi Plug',
    description: 'Control heavy appliances (geysers, ACs) remotely via smart phone app or voice assistant. Energy tracking enabled.',
    category: electronics._id,
    brand: 'Wipro',
    price: 999,
    compareAtPrice: 1999,
    images: ['https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600'],
    isFeatured: true,
    approvalStatus: 'approved',
    tags: ['smart-home', 'plug', 'wipro', 'wifi'],
    variants: [
      { sku: 'WIPRO-PLUG-16A', size: '16 Amp', color: 'Classic White', price: 999, compareAtPrice: 1999, stock: 50 }
    ]
  });
  p22.stock = p22.variants.reduce((acc, curr) => acc + curr.stock, 0);
  await p22.save();

  console.log('Seeder: Products populated...');

  // Create Coupon Code (Scaled for INR)
  await Coupon.create({
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 5000,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    usageLimit: 500
  });

  console.log('Seeder: Default coupon WELCOME20 created...');
};

module.exports = runSeeder;
