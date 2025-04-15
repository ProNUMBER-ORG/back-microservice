import { boundClass } from "autobind-decorator";
import axios from "axios";
import { uuidGenerate } from "src/common/functions/generator";
import logger from "../core/logger";

@boundClass
class GigaChat {
    private readonly api = axios.create({ baseURL: process.env.SBER_URL });
    private readonly scope = process.env.SBER_SCOPE;
    private readonly authKey = process.env.SBER_AUTH_KEY;
    private readonly clientId = process.env.SBER_CLIENT_ID;

    private token: string;

    public async auth() {
        try {
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                RqUID: uuidGenerate(),
                Authorization: `Basic ${this.authKey}`
            };
            const response = await this.api.post("/v2/oauth", { scope: this.scope }, { headers });
            console.log(response);
        } catch (error) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }
}

export default new GigaChat();
