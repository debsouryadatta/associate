import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./lib/db";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from Express!");
});

app.get("/create-user/:name/:email", async (req, res) => {
    const { name, email } = req.params;
    await db.user.create({
        data: {
            name,
            email,
        },
    });
    res.send("User created successfully!");
})

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});

export default app;