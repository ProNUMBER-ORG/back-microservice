import { boundClass } from "autobind-decorator";
import axios from "axios";
import { readFileSync } from "fs";
import { globalAgent } from "https";
import { uuidGenerate } from "../common/functions/generator";
import logger from "../core/logger";

@boundClass
class GigaChat {
    private readonly api = axios.create({ baseURL: process.env.SBER_URL });

    private readonly scope = process.env.SBER_SCOPE;
    private readonly authKey = process.env.SBER_AUTH_KEY;
    private readonly clientId = process.env.SBER_CLIENT_ID;

    private readonly rootCA = readFileSync("/certs/russian_trusted_root_ca_pem.crt");
    private readonly subCA = readFileSync("/certs/russian_trusted_sub_ca_pem.crt");

    private token: string;

    constructor() {
        this.auth();
        globalAgent.options.ca = [this.rootCA, this.subCA];
    }

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
        } catch (error: Error | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }
}

export default new GigaChat();
