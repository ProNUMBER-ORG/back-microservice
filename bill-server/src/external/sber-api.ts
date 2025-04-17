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
    private readonly clientSecret = process.env.SBER_CLIENT_SECRET;

    private readonly rootCA = readFileSync("/app/certs/russian_trusted_root_ca_pem.crt");
    private readonly subCA = readFileSync("/app/certs/russian_trusted_sub_ca_pem.crt");

    private token: string;

    constructor() {
        globalAgent.options.ca = [this.rootCA, this.subCA];
        this.auth();
    }

    public async auth() {
        try {
            const authKey = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                RqUID: uuidGenerate(),
                Authorization: `Basic ${authKey}`
            };
            const response = await this.api.post<{ access_token: string; expires_at: number }>("/v2/oauth", { scope: this.scope }, { headers });

            this.token = response.data.access_token;
            logger.info({ module: "gigachat-api", msg: "Bearer token updated" });
            this.wasd();
        } catch (error: Error | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }

    public async wasd() {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            RqUID: uuidGenerate(),
            Authorization: `Bearer ${this.token}`
        };
        const response = await this.api.post<Record<string, any>>("/v2/oauth", { scope: this.scope }, { headers });
        console.log(response.data);
    }
}

export default new GigaChat();
