export default async function handler(req, res) {
  if (req.method === "POST") {
    const { temperature, humidity } = req.body;

    // You can store this in memory (for now)
    global.latestData = { temperature, humidity, time: new Date() };

    return res.status(200).json({ message: "Data received" });
  } else if (req.method === "GET") {
    // Send the latest data
    return res.status(200).json(global.latestData || { error: "No data yet" });
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
