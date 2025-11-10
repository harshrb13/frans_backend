class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query
    this.queryString = queryString; // Express req.query
  }
  search() {
    // Check if a 'name' query parameter exists
    const nameQuery = this.queryString.name
      ? {
          // If it exists, create a MongoDB $regex query
          productName: {
            $regex: this.queryString.name,
            $options: "i", // 'i' for case-insensitive
          },
        }
      : {}; // If no 'name' query, do nothing (return empty object)

    this.query = this.query.find({ ...nameQuery });
    return this;
  }

  // 1. Filtering
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["sort_by", "page", "limit","name"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // --- NEW, CORRECTED LOGIC ---

    // 1. Create a new object to build the valid Mongoose query
    const mongoQuery = {};

    // 2. Loop over the keys from req.query
    //    e.g., key = 'filter.defaultVariant.price[gte]', value = '0'
    for (const key in queryObj) {
      let value = queryObj[key];

      // 3. Remove the 'filter.' prefix
      //    fieldKey = 'defaultVariant.price[gte]'
      const fieldKey = key.replace(/filter\./g, "");

      // 4. Check if the key contains an operator like [gte] at the end
      const operatorMatch = fieldKey.match(/\[(gte|lte|gt|lt)\]$/);

      if (operatorMatch) {
        // --- We have an operator ---

        // 5. Get the operator (e.g., "gte")
        const operator = operatorMatch[1];
        // 6. Get the Mongoose-style operator (e.g., "$gte")
        const mongoOperator = `$${operator}`;

        // 7. Get the actual field path by removing the [op] part
        //    fieldPath = "defaultVariant.price"
        const fieldPath = fieldKey.replace(/\[(gte|lte|gt|lt)\]$/, "");

        // 8. IMPORTANT: Convert the value to a Number
        if (!isNaN(Number(value))) {
          value = Number(value);
        }

        // 9. Build the nested query object
        if (!mongoQuery[fieldPath]) {
          // If this is the first operator for this field, create the object
          mongoQuery[fieldPath] = {};
        }
        mongoQuery[fieldPath][mongoOperator] = value;
        // This builds: mongoQuery['defaultVariant.price'] = { '$gte': 0 }

      } else {
        // --- No operator, simple equality ---
        // e.g., filter.isHotDeal=true
        mongoQuery[fieldKey] = value;
      }
    }

    // 10. Replace the old, broken logic with this:
    this.query = this.query.find(mongoQuery);
    
    // --- END OF NEW LOGIC ---
    return this;
  }

  // 2. Sorting
  sort() {
    const sortKey = this.queryString.sort_by;

    const sortOptions = {
      "title-ascending": { name: 1 },
      "title-descending": { name: -1 },
      "price-ascending": { "defaultVariant.price": 1 },
      "price-descending": { "defaultVariant.price": -1 },
      "created-ascending": { createdAt: 1 },
      "created-descending": { createdAt: -1 },
      "view-descending": { viewCount: -1 },
    };

    if (sortKey && sortOptions[sortKey]) {
      this.query = this.query.sort(sortOptions[sortKey]);
    } else {
      this.query = this.query.sort({ createdAt: -1 });
    }
    return this;
  }

  // 3. Pagination
  paginate(resPerPage) {
    const page = Number(this.queryString.page) || 1;
    const skip = resPerPage * (page - 1);

    this.query = this.query.skip(skip).limit(resPerPage);
    return this;
  }
}

module.exports = APIFeatures;