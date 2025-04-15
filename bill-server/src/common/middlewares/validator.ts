import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validate(schema: AnyZodObject, key: "body" | "params" | "query") {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataForValidation = req[key];
            await schema.parseAsync(dataForValidation);
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(422).json({
                    status: "fail",
                    errors: error.errors
                });
                return;
            }
            res.status(500).json({
                status: "error",
                message: "Something went wrong"
            });
            return;
        }
    };
}
