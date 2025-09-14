import pool from "../db.js";

export const suggestLocations = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 3) {
      return res.json({ results: [] }); // return empty if less than 3 chars
    }

    const [rows] = await pool.query(
      `SELECT id, name 
       FROM cities 
       WHERE name LIKE ? 
       LIMIT 10`,
      [`%${q}%`]
    );

    return res.json({ results: rows });
  } catch (error) {
    console.error("❌ Location suggestion error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
