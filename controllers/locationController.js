import pool from "../db.js";

export const suggestLocations = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }

    const like = `%${q}%`;

    // 🧭 1️⃣ Fetch cities and states normally
    const [cities] = await pool.query(
      `SELECT 
          ci.id,
          ci.name AS city,
          st.name AS state,
          co.name AS country
       FROM cities ci
       LEFT JOIN states st ON ci.state_id = st.id
       LEFT JOIN countries co ON st.country_id = co.id
       WHERE ci.name LIKE ?
          OR st.name LIKE ?
       ORDER BY ci.name ASC
       LIMIT 10`,
      [like, like]
    );

    // 🏙️ 2️⃣ Extract unique area/locality names from address fields
    const [areas] = await pool.query(
      `
      SELECT DISTINCT SUBSTRING_INDEX(address, ',', 1) AS area
      FROM (
        SELECT address FROM doctors WHERE address LIKE ?
        UNION ALL
        SELECT address FROM hospitals WHERE address LIKE ?
        UNION ALL
        SELECT address FROM clinics WHERE address LIKE ?
      ) AS combined
      WHERE address IS NOT NULL
      LIMIT 10
      `,
      [like, like, like]
    );

    // 🧩 3️⃣ Transform both results for frontend consistency
    const formattedCities = cities.map((r) => ({
      id: r.id,
      name: r.city,
      label: `${r.city}${r.state ? `, ${r.state}` : ""}`,
      type: "city",
      country: r.country || "",
    }));

    const formattedAreas = areas
      .filter((a) => a.area && a.area.trim().length > 0)
      .map((a, idx) => ({
        id: `area-${idx}`,
        name: a.area.trim(),
        label: `${a.area.trim()} (Area)`,
        type: "area",
        country: "",
      }));

    // 🧠 Merge and de-duplicate by label
    const allResults = [
      ...formattedAreas,
      ...formattedCities.filter(
        (city) => !formattedAreas.find((a) => a.name === city.name)
      ),
    ];

    return res.json({ results: allResults });
  } catch (error) {
    console.error("❌ Location suggestion error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
