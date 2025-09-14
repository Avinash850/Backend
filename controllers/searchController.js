import pool from "../db.js";

// 🔍 Main Search API
export const search = async (req, res) => {
  try {
    const { location, query } = req.query;

    if (!location || !query) {
      return res.status(400).json({ error: "Location and query are required" });
    }

    // 1️⃣ Resolve City ID
    const [cityRows] = await pool.query(
      `SELECT id FROM cities WHERE name LIKE ? LIMIT 1`,
      [`%${location}%`]
    );

    let cityId = cityRows.length ? cityRows[0].id : null;

    if (!cityId) {
      return res.json({ results: [] }); // no city found
    }

    // 2️⃣ Doctor Search
    const [doctors] = await pool.query(
      `SELECT d.id, d.name, 'doctor' AS type, c.name AS city
       FROM doctors d
       JOIN cities c ON d.city_id = c.id
       LEFT JOIN specializations s ON d.specialization_id = s.id
       WHERE c.id = ?
         AND (d.name LIKE ? OR s.name LIKE ?)`,
      [cityId, `%${query}%`, `%${query}%`]
    );

    // 3️⃣ Hospital Search
    const [hospitals] = await pool.query(
      `SELECT h.id, h.name, 'hospital' AS type, c.name AS city
       FROM hospitals h
       JOIN cities c ON h.city_id = c.id
       LEFT JOIN hospital_services hs ON h.id = hs.hospital_id
       LEFT JOIN services s ON hs.service_id = s.id
       LEFT JOIN hospital_procedures hp ON h.id = hp.hospital_id
       LEFT JOIN procedures p ON hp.procedure_id = p.id
       WHERE c.id = ?
         AND (h.name LIKE ? OR s.name LIKE ? OR p.name LIKE ?)`,
      [cityId, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    // 4️⃣ Clinic Search
    const [clinics] = await pool.query(
      `SELECT cl.id, cl.name, 'clinic' AS type, c.name AS city
       FROM clinics cl
       JOIN cities c ON cl.city_id = c.id
       WHERE c.id = ? AND cl.name LIKE ?`,
      [cityId, `%${query}%`]
    );

    // 5️⃣ Merge All Results
    const results = [...doctors, ...hospitals, ...clinics];

    return res.json({ results });

  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const suggest = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 3) {
      return res.json({ hospitals: [], doctors: [], clinics: [] });
    }

    // Hospitals
    const [hospitals] = await pool.query(
      `SELECT id, name, 'hospital' AS type 
       FROM hospitals 
       WHERE name LIKE ? 
       LIMIT 5`,
      [`%${q}%`]
    );

    // Doctors
    const [doctors] = await pool.query(
      `SELECT id, name, 'doctor' AS type 
       FROM doctors 
       WHERE name LIKE ? 
       LIMIT 5`,
      [`%${q}%`]
    );

    // Clinics
    const [clinics] = await pool.query(
      `SELECT id, name, 'clinic' AS type 
       FROM clinics 
       WHERE name LIKE ? 
       LIMIT 5`,
      [`%${q}%`]
    );

    return res.json({
      hospitals,
      doctors,
      clinics,
    });
  } catch (error) {
    console.error("❌ Suggestion error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
