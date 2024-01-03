const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const ExpressError= require("./utils/ExpressError.js")
;
const {listingSchema ,reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");
const listings = require("./routes/listing.js");






const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/", (req, res) => {
  res.render("listings/home.ejs");
});

  const validateReview =(req,res,next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
      let msg = error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,msg);
    }else{
      next();
    }
    };
   app.use("/listings",listings);

//REview Route
app.post("/listings/:id/reviews",validateReview, wrapAsync(async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newRev = new Review(req.body.review);
  listing.reviews.push(newRev);
 await newRev.save();
 await listing.save();
 res.redirect(`/listings/${listing._id}`);

}));
app.delete("/listings/:id/reviews/:rid" ,wrapAsync(async(req,res)=>{
  let {id,rid} = req.params;
  await Listing.findByIdAndUpdate(id, {$pull: {reviews:rid}});
 await Review.findByIdAndDelete(rid);
 res.redirect(`/listings/${id}`);
}));
// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 120  0,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });
app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page Not Found"));
});

app.use((err,req,res,next)=>{
  let{status=500,message="something went wrong"}=err;
  res.status(status).render("listings/error.ejs",{message});
  //res.status(status).send(message);
  
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
