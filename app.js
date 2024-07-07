//modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const morgan = require('morgan');

//models
const Campground = require('./models/campground');
const Review = require('./models/review')

//Extra
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas.js');


morgan('tiny');

mongoose.connect('mongodb://localhost:27017/yelp-camp')
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//app.use()는 모든 요청에 코드를 실행하게 한다.
//request.body 파싱하기
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));

//미들웨어 정의
const validateCampground = (req, res, next) => {
    const { err } = campgroundSchema.validate(req.body);
    if(err){
        //에러 있으면 err의 detail 배열에서 모든 요소를 ,로 묶은 문자열 msg 생성
        const msg = err.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }else {
        //에러 없으면 라우트 핸들러 실행
        next();
    }
}

const validateReview = (req, res, next) => {
    const { err } = reviewSchema.validate(req.body);
    if(err){
        //에러 있으면 err의 detail 배열에서 모든 요소를 ,로 묶은 문자열 msg 생성
        const msg = err.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }else {
        //에러 없으면 라우트 핸들러 실행
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/campgrounds', catchAsync( async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

//'.campgrounds/new'가 '/campgrounds/:id'보다 아래에 있으면 new 키워드를 id로 처리함
app.get('/campgrounds/new', catchAsync( async (req, res) => {
    res.render('campgrounds/new');
}));

app.post('/campgrounds', validateCampground, catchAsync( async (req, res, next) => {
    //이 방법은 campground 객체가 있는지만 체크할 수 있고, campground 요소에 대한 유효성 검사는 못 함.
    //요소에 대해 검사하려면 if(req.body.campground.price = ~~~)라는 식의 조건을 모든 요소에 걸어줘야 하는데 몹시 번거로움
    // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const newCampground = new Campground(req.body.campground);
    await newCampground.save();
    res.redirect(`/campgrounds/${newCampground._id}`)

}));

app.get('/campgrounds/:id', catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show', { campground });
}));

app.get('/campgrounds/:id/edit', catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

app.put('/campgrounds/:id', validateCampground, catchAsync( async (req, res) => {
    const campground = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground}, {new: true});
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete('/campgrounds/:id', catchAsync( async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);
    res.redirect('/campgrounds');
}));

//review
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await campground.save();
    await review.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async(req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`)
}));

//유효하지 않은 모든 주소에 대해서
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

//에러 핸들러: 모든 유형의 에러 발생 시 실행
app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log("Serving on port 3000");
});

