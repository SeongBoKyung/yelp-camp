const mongoose = require('mongoose');
const Review = require('./review');
//해당 문법을 더 짧게 사용하기 위함
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    title: String,
    image: String, 
    price: Number, 
    description: String,
    location: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if(doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})



module.exports = mongoose.model('Campground', CampgroundSchema);