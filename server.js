
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// File used to store calendar events
const DATA_FILE = path.join(__dirname, "events.json");

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Read saved events
function readEvents() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

// Save events to file
function saveEvents(events) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(events, null, 2)
    );
}

// GET: Retrieve all events
app.get("/api/events", (req, res) => {
    try {
        res.json(readEvents());
    } catch (error) {
        res.status(500).json({
            error: "Failed to load events"
        });
    }
});

// POST: Add a new event
app.post("/api/events", (req, res) => {
    const { title, date, time = "" } = req.body;

    if (
        typeof title !== "string" ||
        !title.trim() ||
        title.length > 100
    ) {
        return res.status(400).json({
            error: "Please provide a valid event title"
        });
    }

    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return res.status(400).json({
            error: "Please provide a valid date (YYYY-MM-DD)"
        });
    }

    const parsedDate = new Date(date + "T00:00:00");

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        return res.status(400).json({
            error: "Invalid calendar date"
        });
    }

    if (
        typeof time !== "string" ||
        (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    ) {
        return res.status(400).json({
            error: "Time must use HH:MM format"
        });
    }

    try {
        const events = readEvents();

        const newEvent = {
            id: crypto.randomUUID(),
            title: title.trim(),
            date,
            time
        };

        events.push(newEvent);
        saveEvents(events);

        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({
            error: "Failed to save event"
        });
    }
});

// DELETE: Remove an event
app.delete("/api/events/:id", (req, res) => {
    try {
        const events = readEvents();

        const updatedEvents = events.filter(
            event => event.id !== req.params.id
        );

        if (updatedEvents.length === events.length) {
            return res.status(404).json({
                error: "Event not found"
            });
        }

        saveEvents(updatedEvents);

        res.json({
            message: "Event deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to delete event"
        });
    }
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "calender.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Calendar app running at http://localhost:${PORT}`
    );
});
