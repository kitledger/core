import { serverConfig } from "../../../../config.ts";
import { auth } from "../../middleware/auth_middleware.ts";
import { cors } from "@hono/hono/cors";
import { Hono } from "@hono/hono";

const router = new Hono();

router.use(cors(serverConfig.cors));
router.use(auth);
router.get("/", (c) => {
	return c.json({ message: "Welcome to the Kitledger API!" });
});

//router.post("/unit-models")

export const apiV1Router = router;
export const apiV1Prefix = "/api/v1";
