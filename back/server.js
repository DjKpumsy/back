const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://kpumsyweb:kpumsyweb$$1@cluster0.o9gtd9m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    telegramId: { type: String, unique: true },
    username: String,
    points: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    coinsToAdd: { type: Number, default: 1 } // Add coinsToAdd field
});

const User = mongoose.model('User', UserSchema);

app.post('/auth', async (req, res) => {
    const { telegramId, username } = req.body;

    let user = await User.findOne({ telegramId });
    if (!user) {
        user = new User({ telegramId, username });
        await user.save();
    }

    res.json(user);
});

app.post('/addPoints', async (req, res) => {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });
    if (user) {
        user.points += user.coinsToAdd; // Use coinsToAdd value
        await user.save();
        res.json({ points: user.points });
    } else {
        res.status(404).send('User not found');
    }
});

app.post('/referral', async (req, res) => {
    const { referrerId, newUserId } = req.body;
    const referrer = await User.findOne({ telegramId: referrerId });
    const newUser = await User.findOne({ telegramId: newUserId });

    if (referrer && newUser) {
        referrer.referralCount += 1;
        await referrer.save();
        res.json({ referralCount: referrer.referralCount });
    } else {
        res.status(404).send('User not found');
    }
});

app.post('/boost', async (req, res) => {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });
    if (user) {
        user.coinsToAdd += 1; // Increment coinsToAdd by 1
        await user.save();
        res.json({ coinsToAdd: user.coinsToAdd });
    } else {
        res.status(404).send('User not found');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
