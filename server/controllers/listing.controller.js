import Listing from "../models/listing.model.js";
import { errorHandler } from "../utills/error.js";

export const createListing = async (req, res, next) => {
  try {
    const newListing = await Listing.create(req.body);
    console.log("New Listing Created !!!");
    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(401, "Listing not found"));
  }
  if (req.user._id !== listing.userRef) {
    return next(errorHandler(401, "You can only delete your own listings"));
  }
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(201).json("Succesfully deleted a Listing");
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(401, "Listing not found"));
  }
  if (req.user._id !== listing.userRef) {
    return next(errorHandler(401, "You can only edit your own listings"));
  }
  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(201).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(401, "Listing not found"));
    }
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer == undefined || offer == "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished == undefined || furnished == "false") {
      furnished = { $in: [false, true] };
    }

    let parkingSpot = req.query.parkingSpot;

    if (parkingSpot == undefined || parkingSpot == "false") {
      parkingSpot = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type == undefined || type == "all") {
      type = { $in: ["sell", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listing = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parkingSpot,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};
