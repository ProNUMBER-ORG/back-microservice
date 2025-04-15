import { Router } from "express";
import { idDto } from "src/common/dto/id";
import { PayloadKey } from "src/common/enums/validation";
import { validate } from "../../common/middlewares/validator";
import controller from "./controller";

const router = Router();

router.post("/upload", controller.saveBill);
router.get("/status/:id", validate(idDto, PayloadKey.Params), controller.getBillStatus);
router.get("/:id", validate(idDto, PayloadKey.Params), controller.getBillStatus);

export default router;
