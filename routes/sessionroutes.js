const express = require('express');
const redisClient = require('../config/redisclient');

const router = express.Router();

// Middleware to check if session exists
const getSessionData = async (req, res, next) => {
    try {
        const { session_id } = req.body;
        let sessionData = await redisClient.get(session_id);

        if (!sessionData) {
            return res.status(400).json({ error: "Session expired or not found" });
        }

        req.sessionData = JSON.parse(sessionData); // Attach session data to request
        next(); // Proceed to next middleware
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Redis failure while retrieving session" });
    }
};

// ✅ Start a new test session
router.post('/start-test', async (req, res) => {
    const { user_id, test_id } = req.body;

    if (!user_id || !test_id) {
        return res.status(400).json({ error: "Missing user_id or test_id" });
    }

    const session_id = `session:${user_id}:${test_id}`;

    const sessionData = {
        user_id,
        test_id,
        start_time: new Date().toISOString(),
        status: "ongoing",
        responses: [],
        score: null
    };

    try {
        // Store session in Redis with a TTL of 2 hours (7200 seconds)
        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData));
        res.status(201).json({ message: "Test started successfully!", session_id });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

// ✅ Submit an answer (with session validation middleware)
router.post('/submit-answer', getSessionData, async (req, res) => {
    const { question_id, user_answer } = req.body;
    const session_id = req.body.session_id;
    let sessionData = req.sessionData;

    if (!question_id || !user_answer) {
        return res.status(400).json({ error: "Missing question_id or user_answer" });
    }

    // Append user response
    sessionData.responses.push({ question_id, user_answer, correct: null });

    try {
        // Update session in Redis
        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData));
        res.json({ message: "Answer recorded successfully!" });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to store answer" });
    }
});

// ✅ Evaluate the test session
router.post('/evaluate-test', getSessionData, async (req, res) => {
    let sessionData = req.sessionData;
    const session_id = req.body.session_id;

    try {
        // Fetch correct answers from MongoDB
        const questionIds = sessionData.responses.map(r => r.question_id);
        const correctAnswers = {}; // Replace this with MongoDB query to fetch actual answers

        let score = 0;
        sessionData.responses.forEach(response => {
            const correct = correctAnswers[response.question_id] === response.user_answer;
            response.correct = correct;
            score += correct ? 4 : -1; // Assume +4 for correct, -1 for wrong
        });

        sessionData.score = score;
        sessionData.status = "completed";

        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData));

        res.json({ message: "Test evaluated successfully!", score });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to evaluate test" });
    }
});

// ✅ Always export at the **end of the file**
module.exports = router;
