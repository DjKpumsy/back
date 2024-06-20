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
    coinsToAdd: { type: Number, default: 5 },
    completedTasks: { type: [Number], default: [] },  // Add completedTasks field
    ref_by: { type: String, default: 0 }  // New field to store referrer ID
});

const User = mongoose.model('User', UserSchema);

app.post('/auth', async (req, res) => {
    const { telegramId, username, referrerId } = req.body;  // Capture referrerId from request

    let user = await User.findOne({ telegramId });
    if (!user) {
        user = new User({ telegramId, username, ref_by: referrerId });
        await user.save();
        
        // Update the referrer's referral count if referrerId is provided
        if (referrerId) {
            const referrer = await User.findOne({ telegramId: referrerId });
            if (referrer) {
                referrer.referralCount += 1;
                await referrer.save();
            }
        }
    }

    res.json(user);
});

app.post('/addPoints', async (req, res) => {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });
    if (user) {
        user.points += user.coinsToAdd;
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
        if (user.points >= 50) {
            user.coinsToAdd += 1;
            user.points -= 50;
            await user.save();
            res.json({ coinsToAdd: user.coinsToAdd, points: user.points });
        } else {
            res.status(400).send('Not enough points');
        }
    } else {
        res.status(404).send('User not found');
    }
});

// New endpoint to handle task completion
app.post('/completeTask', async (req, res) => {
    const { telegramId, taskId, points } = req.body;
    const user = await User.findOne({ telegramId });

    if (user) {
        // Add the taskId to the completedTasks array if not already present
        if (!user.completedTasks.includes(taskId)) {
            user.completedTasks.push(taskId);
            user.points += points;
            await user.save();
            res.json({ points: user.points });
        } else {
            res.status(400).send('Task already completed');
        }
    } else {
        res.status(404).send('User not found');
    }
});


app.post('/getUser', async (req, res) => {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });
    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
