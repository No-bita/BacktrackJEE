const redisClient = require('../config/redisclient');
const Question = require('../models/questionModel');

// Start a new test session
exports.startTest = async (req, res) => {
    const { user_id, test_id } = req.body;
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
        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData)); // TTL: 2 hours
        res.json({ message: "Test started", session_id });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
};

// Store user responses
exports.submitAnswer = async (req, res) => {
    const { session_id, question_id, user_answer } = req.body;

    try {
        let sessionData = await redisClient.get(session_id);
        if (!sessionData) return res.status(400).json({ error: "Session expired or not found" });

        sessionData = JSON.parse(sessionData);
        sessionData.responses.push({ question_id, user_answer, correct: null });

        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData));
        res.json({ message: "Answer recorded" });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to store answer" });
    }
};

// Evaluate test
exports.evaluateTest = async (req, res) => {
    const { session_id } = req.body;

    try {
        let sessionData = await redisClient.get(session_id);
        if (!sessionData) return res.status(400).json({ error: "Session expired or not found" });

        sessionData = JSON.parse(sessionData);
        const responses = sessionData.responses;

        const questionIds = responses.map(r => r.question_id);
        const questions = await Question.find({ _id: { $in: questionIds } });
        const correctAnswers = questions.reduce((acc, q) => ({ ...acc, [q._id]: q.correct_answer }), {});

        let score = 0;
        responses.forEach(response => {
            response.correct = correctAnswers[response.question_id] === response.user_answer;
            score += response.correct ? 4 : -1; // +4 for correct, -1 for wrong
        });

        sessionData.score = score;
        sessionData.status = "completed";
        await redisClient.setEx(session_id, 7200, JSON.stringify(sessionData));

        res.json({ message: "Test evaluated", score });
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json({ error: "Failed to evaluate test" });
    }
};
