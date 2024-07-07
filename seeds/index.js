const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

//함수: 배열을 인수로 전달하면 랜덤 인덱스의 배열요소를 반환(화살표 함수 내에 코드가 한 줄이면 리턴이라고 명시 안 해도 됨)
const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    //db 초기화용이기 때문에 데이터 추가하기 전에 저장된 데이터를 모두 삭제
    await Campground.deleteMany({});
    for(let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000); //cities에 1000개가 등록되어 있음
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://source.unsplash.com/collection/483251',
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price
        })
        await camp.save();
    }
}

//초기 데이터를 입력 후 데이터베이스 연결을 끊기
//seedDB는 비동기 함수라 promise를 반환하니 then 사용
//db.close(); == mongoose.connection.close() == 연결 끊김
seedDB().then(() => {
    db.close();
})
