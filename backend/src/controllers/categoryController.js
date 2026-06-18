const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

// @desc    Get all categories (hierarchical listing)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  const { name, description, image, parent } = req.body;

  try {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      return next(new ApiError(400, 'Category already exists.'));
    }

    if (parent) {
      const parentCat = await Category.findById(parent);
      if (!parentCat) {
        return next(new ApiError(400, 'Parent category not found.'));
      }
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parent: parent || null
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory
};

// @desc    Update category details
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  const { name, description, image, parent } = req.body;
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new ApiError(404, 'Category not found.'));
    }

    if (name) {
      category.name = name;
      category.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;

    if (parent !== undefined) {
      if (parent) {
        const parentCat = await Category.findById(parent);
        if (!parentCat) {
          return next(new ApiError(400, 'Parent category not found.'));
        }
        category.parent = parent;
      } else {
        category.parent = null;
      }
    }

    await category.save();
    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new ApiError(404, 'Category not found.'));
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

