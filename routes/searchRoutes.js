import express from "express";
import { search, suggest  } from "../controllers/searchController.js";

const router = express.Router();

router.get("/search", search);
router.get("/suggest", suggest);

export default router;
