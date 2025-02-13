const Express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = Express();
const port = 5003;

app.use(cors({ origin: "*" }));
app.use(Express.json()); // ✅ Enable JSON body parsing
app.use(Express.urlencoded({ extended: true })); // ✅ Enable form-urlencoded parsing

const CONNECTION_STRING = "mongodb+srv://dkamble031993:dharati%40oct1993@cluster0.opd2p.mongodb.net/taskmanagerdb?retryWrites=true&w=majority";
const DATABASENAME = "taskmanagerdb";
let database;

// ✅ Connect to MongoDB
MongoClient.connect(CONNECTION_STRING)
    .then(client => {
        database = client.db(DATABASENAME);
        console.log("✅ DB connection is successful");
    })
    .catch(err => {
        console.error("❌ DB connection failed:", err);
    });

// ✅ Prevent Favicon Requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Add Task Endpoint
app.post('/api/taskmanager/AddTask', (request, response) => {
    console.log("Received POST request body:", request.body);  // Debugging

    if (!request.body || !request.body.taskName) {
        return response.status(400).send({ message: "Task name cannot be empty!" });
    }

    database.collection("taskcollection").insertOne({
        taskName: request.body.taskName
    })
    .then(result => {
        response.status(201).send({ message: "Task added successfully!", taskId: result.insertedId });
    })
    .catch(err => {
        console.error("❌ Error inserting task:", err);
        response.status(500).send({ message: "Error inserting task", error: err });
    });
});

// ✅ Get All Tasks Endpoint
app.get('/api/taskmanager/GetTasks', async (request, response) => {
    try {
        console.log("🔍 Fetching tasks...");
        const tasks = await database.collection("taskcollection").find({}).toArray();
        response.status(200).json(tasks);
    } catch (error) {
        console.error("❌ Error fetching tasks:", error);
        response.status(500).json({ message: "Error fetching tasks", error: error.message });
    }
});

// ✅ Delete Task Endpoint
app.delete('/api/taskmanager/DeleteTask', async (req, res) => {   
    try {
        const taskId = req.query._id; // ✅ Extract `_id` instead of `id`

        if (!taskId) {
            return res.status(400).send({ message: "Error: Task _id is missing." });
        }

        if (!ObjectId.isValid(taskId)) {
            return res.status(400).send({ message: "Invalid Task _id format." });
        }

        const result = await database.collection("taskcollection").deleteOne({ _id: new ObjectId(taskId) });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Task not found" });
        }

        res.status(200).send({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting task:", error);
        res.status(500).send({ message: "Error deleting task", error });
    }
});

// ✅ Update Task Completion Status
app.put('/api/taskmanager/UpdateTask', (request, response) => {
    const { taskId, isCompleted } = request.body;

    if (!taskId || typeof isCompleted === "undefined") {
        return response.status(400).send({ message: "Task ID and completion status are required." });
    }

    if (!ObjectId.isValid(taskId)) {
        return response.status(400).send({ message: "Invalid Task ID format." });
    }

    database.collection("taskcollection").updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { isCompleted: isCompleted } }
    )
    .then(result => {
        if (result.matchedCount === 0) {
            return response.status(404).send({ message: "Task not found" });
        }
        response.status(200).send({ message: "Task updated successfully" });
    })
    .catch(error => {
        console.error("❌ Error updating task:", error);
        response.status(500).send({ message: "Error updating task", error: error });
    });
});

// ✅ Toggle Task Status Endpoint
app.put('/api/taskmanager/ToggleStatus', async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({ message: "Task ID is required!" });
        }

        if (!ObjectId.isValid(taskId)) { // ✅ Check for valid ObjectId
            return res.status(400).json({ message: "Invalid Task ID format." });
        }

        const task = await database.collection("taskcollection").findOne({ _id: new ObjectId(taskId) });
        
        if (!task) {
            return res.status(404).json({ message: "Task not found!" });
        }

        const updatedStatus = !task.status; // Toggle status

        await database.collection("taskcollection").updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { status: updatedStatus } }
        );

        res.status(200).json({ message: "Task status updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating task status:", error);
        res.status(500).json({ message: "Error updating task status", error: error.message });
    }
});


// ✅ Start Server
app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});
