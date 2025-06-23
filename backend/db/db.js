const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false)
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('Db Connected')
    } catch (error) {
        console.log('DB Connection Error', error.message);
    }
}

module.exports = connectDB;