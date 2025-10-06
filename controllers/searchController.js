import pool from "../db.js";

/**
 * 🔍 Main Search API
 * Handles user searches for doctors, hospitals, and clinics by location + query.
 */
export const search = async (req, res) => {
  try {
    const { location, query } = req.query;

    if (!location || !query) {
      return res.status(400).json({ error: "Location and query are required" });
    }

    // 1️⃣ Try matching city first
    const [cityRows] = await pool.query(
      `SELECT id FROM cities WHERE name LIKE ? LIMIT 1`,
      [`%${location}%`]
    );

    let cityId = cityRows.length ? cityRows[0].id : null;

    // 2️⃣ If no city found, try matching area in address fields
    if (!cityId) {
      const [areaRows] = await pool.query(
        `
        SELECT DISTINCT c.id 
        FROM cities c
        JOIN doctors d ON d.city_id = c.id
        WHERE d.address LIKE ?
        UNION
        SELECT DISTINCT c.id
        FROM cities c
        JOIN hospitals h ON h.city_id = c.id
        WHERE h.address LIKE ?
        UNION
        SELECT DISTINCT c.id
        FROM cities c
        JOIN clinics cl ON cl.city_id = c.id
        WHERE cl.address LIKE ?
        LIMIT 1
      `,
        [`%${location}%`, `%${location}%`, `%${location}%`]
      );

      cityId = areaRows.length ? areaRows[0].id : null;
    }

    if (!cityId) {
      return res.json({ results: [] });
    }

    // 3️⃣ Doctor search
    const [doctors] = await pool.query(
      `SELECT 
          d.id, 
          d.name, 
          'doctor' AS type,
          d.profile_image AS image,
          s.name AS specialization,
          c.name AS city,
          d.address
       FROM doctors d
       JOIN cities c ON d.city_id = c.id
       LEFT JOIN specializations s ON d.specialization_id = s.id
       WHERE c.id = ?
         AND (d.name LIKE ? OR s.name LIKE ? OR d.address LIKE ?)
       `,
      [cityId, `%${query}%`, `%${query}%`, `%${location}%`]
    );

    // 4️⃣ Hospital search
    const [hospitals] = await pool.query(
      `SELECT 
          h.id, 
          h.name, 
          'hospital' AS type,
          h.image,
          c.name AS city,
          h.address
       FROM hospitals h
       JOIN cities c ON h.city_id = c.id
       LEFT JOIN hospital_services hs ON h.id = hs.hospital_id
       LEFT JOIN services s ON hs.service_id = s.id
       LEFT JOIN hospital_procedures hp ON h.id = hp.hospital_id
       LEFT JOIN procedures p ON hp.procedure_id = p.id
       WHERE c.id = ?
         AND (h.name LIKE ? OR s.name LIKE ? OR p.name LIKE ? OR h.address LIKE ?)`,
      [cityId, `%${query}%`, `%${query}%`, `%${query}%`, `%${location}%`]
    );

    // 5️⃣ Clinic search
    const [clinics] = await pool.query(
      `SELECT 
          cl.id, 
          cl.name, 
          'clinic' AS type,
          cl.image,
          c.name AS city,
          cl.address
       FROM clinics cl
       JOIN cities c ON cl.city_id = c.id
       WHERE c.id = ?
         AND (cl.name LIKE ? OR cl.address LIKE ?)`,
      [cityId, `%${query}%`, `%${location}%`]
    );

    // 6️⃣ Merge + Sort
    const results = [...doctors, ...hospitals, ...clinics].sort((a, b) =>
      a.type.localeCompare(b.type)
    );

    return res.json({ results });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 💡 Suggestion API
 * Used for autocomplete dropdown while typing in the search bar.
 */
export const suggest = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        doctors: [],
        hospitals: [],
        clinics: [],
        specializations: [],
        services: [],
        procedures: [],
        symptoms: [],
        areas: [],
      });
    }

    const like = `%${q}%`;

    // Parallel query execution for performance
    const [
      [doctors],
      [hospitals],
      [clinics],
      [specializations],
      [services],
      [procedures],
      [symptoms],
      [areas],
    ] = await Promise.all([
      pool.query(`SELECT id, name, 'doctor' AS type FROM doctors WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'hospital' AS type FROM hospitals WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'clinic' AS type FROM clinics WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'specialization' AS type FROM specializations WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'service' AS type FROM services WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'procedure' AS type FROM procedures WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(`SELECT id, name, 'symptom' AS type FROM symptoms WHERE name LIKE ? LIMIT 5`, [like]),
      pool.query(
        `
        SELECT DISTINCT SUBSTRING_INDEX(address, ',', 1) AS name, 'area' AS type
        FROM (
          SELECT address FROM doctors WHERE address LIKE ?
          UNION ALL
          SELECT address FROM hospitals WHERE address LIKE ?
          UNION ALL
          SELECT address FROM clinics WHERE address LIKE ?
        ) AS combined
        WHERE address IS NOT NULL
        LIMIT 5
        `,
        [like, like, like]
      ),
    ]);

    return res.json({
      doctors,
      hospitals,
      clinics,
      specializations,
      services,
      procedures,
      symptoms,
      areas,
    });
  } catch (error) {
    console.error("❌ Suggestion error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
