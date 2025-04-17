import { boundClass } from "autobind-decorator";
import axios, { AxiosError } from "axios";
import { readFileSync } from "fs";
import { globalAgent } from "https";
import { uuidGenerate } from "../common/functions/generator";
import logger, { IMessage } from "../core/logger";

const _prompt = `
Проанализируй текст чека и преобразуй его в JSON-массив строго в следующем формате:
[
  {"name": "название товара", "cost": число},
  ...
]

Требования:
1. Извлекай только товарные позиции с ценами
2. Игнорируй итоговые суммы, скидки, налоги и служебную информацию
3. Если название товара и цена в разных строках - объединяй их
4. Цены округляй до 2 знаков после запятой
5. Удаляй специальные символы (★, *, • и т.д.) в названиях товаров
6. Не включай позиции с нулевой стоимостью (0.00)
7. Сохраняй оригинальные названия товаров без изменений (кроме п.5)

Пример правильного вывода:
[
  {"name": "Молоко Простоквашино 2,5%", "cost": 89.90},
  {"name": "Хлеб Бородинский нарезка", "cost": 45.20},
  {"name": "Яблоки Гренни Смит кг", "cost": 129.99}
]

Текст чека для обработки:
{replace this}
`;

type Model = {
    id: string;
    object: string;
    owner_by: string;
    type: string;
};

type ChatCompletionParams = {
    model: string;
    messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
};

type ChatCompletionResult = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
        index: number;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
};

@boundClass
class GigaChat {
    private readonly api = axios.create();

    private readonly authUrl = process.env.GIGACHAT_AUTH_URL;
    private readonly apiUrl = process.env.GIGACHAT_API_URL;

    private readonly scope = process.env.GIGACHAT_SCOPE;
    private readonly authKey = process.env.GIGACHAT_AUTH_KEY;
    private readonly clientId = process.env.GIGACHAT_CLIENT_ID;
    private readonly clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

    private readonly rootCA = readFileSync("/app/certs/russian_trusted_root_ca_pem.crt");
    private readonly subCA = readFileSync("/app/certs/russian_trusted_sub_ca_pem.crt");

    private token: string;
    private models: string[];

    constructor() {
        globalAgent.options.ca = [this.rootCA, this.subCA];
        this.auth().then(() => this.getModels());
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
            const response = await this.api.post<{ access_token: string; expires_at: number }>(
                `${this.authUrl}/v2/oauth`,
                { scope: this.scope },
                { headers }
            );

            this.token = response.data.access_token;
            logger.info({ module: "gigachat-api", msg: "Bearer token updated" });
        } catch (error: Error | AxiosError | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }

    public async getModels() {
        try {
            if (!this.token) throw new Error("Token not initialized");

            const headers = {
                Accept: "application/json",
                maxBodyLength: Infinity,
                RqUID: uuidGenerate(),
                Authorization: `Bearer ${this.token.trim()}`,
                "Content-Type": "application/json"
            };
            const response = await this.api.get<{ object: string; data: Model[] }>(`${this.apiUrl}/v1/models`, { headers });
            this.models = response.data.data.map(({ id }) => id);
        } catch (error: Error | AxiosError | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }

    private validateModel(model: string): string {
        if (!this.models.includes(model)) {
            logger.warn({ module: "gigachat-model-choice", msg: `Model '${model}' not in recommended list. Using '${this.models[0]}'` });
            return this.models[0];
        }
        return model;
    }

    private async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult | IMessage> {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.token}`,
                RqUID: uuidGenerate(),
                Accept: "application/json"
            };

            const defaultParams = {
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 1.0,
                n: 1,
                stream: false
            };

            const requestBody = {
                ...defaultParams,
                ...params,
                model: this.validateModel(params.model)
            };

            const response = await this.api.post<ChatCompletionResult>(`${this.apiUrl}/v1/chat/completions`, requestBody, { headers });

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error("Invalid API response structure");
            }

            return response.data;
        } catch (error: AxiosError | Error | any) {
            const errorObj: IMessage = { module: "gigachat-api", msg: "" };
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data || error.message;
                errorObj.msg = errorData;
                errorObj.additional = { status: error.response?.status, data: errorData, config: error.config };
            } else {
                errorObj.msg = error?.message || "Something went wrong";
                errorObj.additional = error;
            }
            logger.error(errorObj);
            return errorObj;
        }
    }

    public async parseReceipt(textFromOCR: string): Promise<{ error: IMessage } | Record<string, any>> {
        const prompt = _prompt.replace("{replace this}", textFromOCR);

        const response = await this.chatCompletion({
            model: process.env.GIGACHAT_DEFAULT_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3
        });

        if ("msg" in response && "module" in response) return { error: response };
        return JSON.parse(response?.choices[0].message.content);
    }
}

export default new GigaChat();
