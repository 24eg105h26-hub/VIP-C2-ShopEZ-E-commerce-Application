const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

// @desc    Get all products (with text search, filtering, pagination, sorting)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      ratings,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { approvalStatus: 'approved' };

    // 1. Full text search
    if (search) {
      query.$text = { $search: search };
    }

    // 2. Category filtering (resolve slug or find direct ObjectId)
    if (category) {
      const foundCategory = await Category.findOne({
        $or: [{ slug: category }, { name: category }]
      });
      if (foundCategory) {
        query.category = foundCategory._id;
      } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      }
    }

    // 3. Brand filtering
    if (brand) {
      const brandsArray = brand.split(',').map(b => b.trim());
      query.brand = { $in: brandsArray.map(b => new RegExp('^' + b + '$', 'i')) };
    }

    // 4. Price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 5. Rating filter
    if (ratings) {
      query.ratings = { $gte: Number(ratings) };
    }

    // Determine Sorting
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOptions = { price: 1 };
          break;
        case 'price-desc':
          sortOptions = { price: -1 };
          break;
        case 'rating':
          sortOptions = { ratings: -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        case 'featured':
          sortOptions = { isFeatured: -1, createdAt: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    } else if (search) {
      // Sort by text relevance score if search query is provided
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const projection = search ? { score: { $meta: 'textScore' } } : {};

    const products = await Product.find(query, projection)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name slug');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product details by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, approvalStatus: 'approved' })
      .populate('category', 'name slug')
      .populate({
        path: 'seller',
        select: 'storeName storeDescription logo banner policies'
      });

    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products (same category/brand)
// @route   GET /api/products/:slug/related
// @access  Public
const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      approvalStatus: 'approved'
    })
      .limit(4)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: related
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product recommendations
// @route   GET /api/products/recommendations
// @access  Public
const getProductRecommendations = async (req, res, next) => {
  try {
    // Recommend top-rated or featured products
    const recommendations = await Product.find({ isFeatured: true, approvalStatus: 'approved' })
      .limit(12)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Product search autocomplete
// @route   GET /api/products/search/autocomplete
// @access  Public
const autocompleteSearch = async (req, res, next) => {
  const { q } = req.query;
  try {
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const products = await Product.find(
      { name: { $regex: q, $options: 'i' }, approvalStatus: 'approved' },
      { name: 1, slug: 1, images: 1 }
    ).limit(5);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getProductRecommendations,
  autocompleteSearch
};
