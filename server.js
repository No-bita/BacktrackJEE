const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const chokidar = require("chokidar");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const Question = require("./models/question"); // ✅ Import schema (Do NOT define again)
require("dotenv").config();
require("./config/passport");

const app = express();
connectDB();

// ✅ Fix CORS
app.use(cors({
    origin: process.env.CLIENT_URL || "https://yourfrontend.com",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization"
}));

app.use(express.json());

// ✅ Fix Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Fix Route Path Casing
app.use("/api/auth", require("./routes/auth"));
app.use("/api/questions", require("./routes/questions"));
app.use("/api/exam", require("./routes/exam"));

// ✅ Setup WebSockets
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ✅ Watch JSON File & Update MongoDB
const jsonFilePath = "./extracted_data.json";

const updateDatabase = async () => {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

        // ✅ Ensure data matches schema (but do NOT define schema here)
        const formattedData = jsonData.map(q => ({
            question_id: q.question_id,
            question_text: q.question,
            options: {
                1: q.options[0], 
                2: q.options[1],
                3: q.options[2],
                4: q.options[3]
            },
            correct_option: parseInt(q.answer),
            image: q.image || null
        }));

        // ✅ Remove duplicates & insert new data
        await Question.deleteMany({});
        await Question.insertMany(formattedData);

        console.log("✅ Database Updated with latest JSON data");

        // Notify frontend
        io.emit("dbUpdated", { message: "Database Updated" });
    } catch (error) {
        console.error("❌ Error updating database:", error);
    }
};

// ✅ Watch for JSON changes
chokidar.watch(jsonFilePath).on("change", () => {
    console.log("🔄 JSON file changed. Updating database...");
    updateDatabase();
});

// ✅ WebSocket Connection
io.on("connection", (socket) => {
    console.log("🟢 Client connected via WebSocket");
    socket.on("disconnect", () => console.log("🔴 Client disconnected"));
});


(async () => {
    await connectDB(); // ✅ Ensure MongoDB connects before starting server

    app.use(express.json());
    app.use("/api/questions", require("./routes/questions"));

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
